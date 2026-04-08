import {logger} from '@/utils/logger';
import {ENV} from '@/config/env';
import type {
  AIConnectionState,
  AISessionConfig,
  ConversationMessage,
  IRealtimeAIClient,
} from '@/types';
import {DEFAULT_AI_SESSION_CONFIG} from '@/types';

// WebRTC types — provided at runtime by react-native-webrtc
declare const RTCPeerConnection: any;

const TAG = 'RealtimeAIClient';

type MessageCallback = (message: ConversationMessage) => void;
type AudioDeltaCallback = (audioDelta: string) => void;
type TranscriptCallback = (transcript: string, isFinal: boolean) => void;
type StateCallback = (state: AIConnectionState) => void;
type ErrorCallback = (error: Error) => void;

/**
 * Client for OpenAI Realtime API (ChatGPT voice-to-voice).
 *
 * Uses WebRTC for low-latency bidirectional audio streaming.
 * This is the interface layer — actual WebRTC/DataChannel setup
 * will be implemented with react-native-webrtc.
 */
export class RealtimeAIClient implements IRealtimeAIClient {
  private state: AIConnectionState = 'disconnected';
  private config: AISessionConfig = DEFAULT_AI_SESSION_CONFIG;
  private pc: any = null;
  private dc: any = null;

  private messageListeners: Set<MessageCallback> = new Set();
  private audioDeltaListeners: Set<AudioDeltaCallback> = new Set();
  private transcriptListeners: Set<TranscriptCallback> = new Set();
  private stateListeners: Set<StateCallback> = new Set();
  private errorListeners: Set<ErrorCallback> = new Set();

  async connect(config?: Partial<AISessionConfig>): Promise<void> {
    if (this.state === 'connected' || this.state === 'connecting') {
      logger.warn(TAG, 'Already connected or connecting');
      return;
    }

    this.config = {...DEFAULT_AI_SESSION_CONFIG, ...config};
    this.setState('connecting');

    try {
      logger.info(TAG, 'Creating WebRTC peer connection');

      // Step 1: Create peer connection
      this.pc = new RTCPeerConnection({
        iceServers: [{urls: 'stun:stun.l.google.com:19302'}],
      });

      // Step 2: Add local audio track
      // TODO: Get local media stream from AudioRecorderService
      // const stream = await mediaDevices.getUserMedia({ audio: true });
      // stream.getTracks().forEach(track => this.pc?.addTrack(track, stream));

      // Step 3: Create data channel for events
      this.dc = this.pc.createDataChannel('oai-events');
      this.setupDataChannel();

      // Step 4: Create and set local offer
      const offer = await this.pc.createOffer({
        offerToReceiveAudio: true,
      });
      await this.pc.setLocalDescription(offer);

      // Step 5: Send offer to OpenAI Realtime API
      const sdpResponse = await fetch(
        `${ENV.OPENAI_REALTIME_URL}?model=${this.config.model}&voice=${this.config.voice}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${ENV.OPENAI_API_KEY}`,
            'Content-Type': 'application/sdp',
          },
          body: offer.sdp,
        },
      );

      if (!sdpResponse.ok) {
        throw new Error(`SDP exchange failed: ${sdpResponse.status}`);
      }

      // Step 6: Set remote description
      const answerSdp = await sdpResponse.text();
      await this.pc.setRemoteDescription({
        type: 'answer',
        sdp: answerSdp,
      });

      // Step 7: Handle incoming audio
      this.pc.ontrack = (event: any) => {
        logger.info(TAG, 'Received remote audio track');
        // TODO: Route remote audio to speaker via AudioPlayer
        // The event.streams[0] contains the AI's audio output
      };

      this.setState('connected');
      this.sendSessionUpdate();

      logger.info(TAG, 'Connected to OpenAI Realtime API');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error(TAG, 'Connection failed', err);
      this.setState('error');
      this.errorListeners.forEach(cb => cb(err));
      throw err;
    }
  }

  disconnect(): void {
    logger.info(TAG, 'Disconnecting');
    this.dc?.close();
    this.pc?.close();
    this.dc = null;
    this.pc = null;
    this.setState('disconnected');
  }

  sendAudio(audioData: string): void {
    if (this.state !== 'connected') return;

    this.sendEvent({
      type: 'input_audio_buffer.append',
      audio: audioData,
    });
  }

  sendText(text: string): void {
    if (this.state !== 'connected') return;

    this.sendEvent({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [{type: 'input_text', text}],
      },
    });

    this.sendEvent({type: 'response.create'});
  }

  commitAudioBuffer(): void {
    this.sendEvent({type: 'input_audio_buffer.commit'});
    this.sendEvent({type: 'response.create'});
  }

  cancelResponse(): void {
    this.sendEvent({type: 'response.cancel'});
  }

  onMessage(callback: MessageCallback): () => void {
    this.messageListeners.add(callback);
    return () => this.messageListeners.delete(callback);
  }

  onAudioDelta(callback: AudioDeltaCallback): () => void {
    this.audioDeltaListeners.add(callback);
    return () => this.audioDeltaListeners.delete(callback);
  }

  onTranscript(callback: TranscriptCallback): () => void {
    this.transcriptListeners.add(callback);
    return () => this.transcriptListeners.delete(callback);
  }

  onStateChange(callback: StateCallback): () => void {
    this.stateListeners.add(callback);
    return () => this.stateListeners.delete(callback);
  }

  onError(callback: ErrorCallback): () => void {
    this.errorListeners.add(callback);
    return () => this.errorListeners.delete(callback);
  }

  getState(): AIConnectionState {
    return this.state;
  }

  private setupDataChannel(): void {
    if (!this.dc) return;

    this.dc.onopen = () => {
      logger.info(TAG, 'Data channel opened');
    };

    this.dc.onmessage = (event: any) => {
      try {
        const data = JSON.parse(event.data);
        this.handleServerEvent(data);
      } catch (error) {
        logger.error(TAG, 'Failed to parse server event', error);
      }
    };

    this.dc.onerror = (event: Event) => {
      logger.error(TAG, 'Data channel error', event);
    };
  }

  private handleServerEvent(event: Record<string, unknown>): void {
    const type = event.type as string;

    switch (type) {
      case 'response.audio.delta':
        this.audioDeltaListeners.forEach(cb => cb(event.delta as string));
        break;

      case 'response.audio_transcript.delta':
        this.transcriptListeners.forEach(cb => cb(event.delta as string, false));
        break;

      case 'response.audio_transcript.done':
        this.transcriptListeners.forEach(cb => cb(event.transcript as string, true));
        break;

      case 'conversation.item.input_audio_transcription.completed':
        this.messageListeners.forEach(cb =>
          cb({
            id: (event.item_id as string) ?? Date.now().toString(),
            role: 'user',
            content: event.transcript as string,
            timestamp: Date.now(),
          }),
        );
        break;

      case 'response.done': {
        const response = event.response as Record<string, unknown>;
        const output = (response?.output as Array<Record<string, unknown>>)?.[0];
        if (output) {
          const content = (output.content as Array<Record<string, unknown>>)?.[0];
          if (content?.transcript) {
            this.messageListeners.forEach(cb =>
              cb({
                id: (output.id as string) ?? Date.now().toString(),
                role: 'assistant',
                content: content.transcript as string,
                timestamp: Date.now(),
              }),
            );
          }
        }
        break;
      }

      case 'error':
        this.errorListeners.forEach(cb =>
          cb(new Error((event.error as Record<string, string>)?.message ?? 'Unknown error')),
        );
        break;

      default:
        logger.debug(TAG, `Unhandled event: ${type}`);
    }
  }

  private sendEvent(event: Record<string, unknown>): void {
    if (this.dc?.readyState === 'open') {
      this.dc.send(JSON.stringify(event));
    }
  }

  private sendSessionUpdate(): void {
    this.sendEvent({
      type: 'session.update',
      session: {
        instructions: this.config.instructions,
        voice: this.config.voice,
        input_audio_format: this.config.inputAudioFormat,
        output_audio_format: this.config.outputAudioFormat,
        input_audio_transcription: {model: 'whisper-1'},
        turn_detection: {type: 'server_vad'},
        temperature: this.config.temperature,
        max_response_output_tokens: this.config.maxTokens,
      },
    });
  }

  private setState(newState: AIConnectionState): void {
    this.state = newState;
    this.stateListeners.forEach(cb => cb(newState));
  }
}

export const realtimeAIClient = new RealtimeAIClient();
