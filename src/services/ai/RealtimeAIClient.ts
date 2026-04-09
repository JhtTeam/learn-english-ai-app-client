import {RTCPeerConnection, mediaDevices, MediaStream} from 'react-native-webrtc';
import {logger} from '@/utils/logger';
import {ENV} from '@/config/env';
import type {
  AIConnectionState,
  AISessionConfig,
  ConversationMessage,
  InteractionMode,
  IRealtimeAIClient,
} from '@/types';
import {DEFAULT_AI_SESSION_CONFIG} from '@/types';

const TAG = 'RealtimeAIClient';

type MessageCallback = (message: ConversationMessage) => void;
type AudioDeltaCallback = (audioDelta: string) => void;
type TranscriptCallback = (transcript: string, isFinal: boolean) => void;
type StateCallback = (state: AIConnectionState) => void;
type ErrorCallback = (error: Error) => void;
type RemoteStreamCallback = (stream: MediaStream) => void;
type VoidCallback = () => void;

/**
 * Client for OpenAI Realtime API (ChatGPT voice-to-voice).
 *
 * Architecture:
 *   Mic → getUserMedia → MediaStream → RTCPeerConnection → OpenAI
 *   OpenAI → Remote Audio Track → Device Speaker (automatic)
 *   OpenAI → DataChannel → JSON events (transcripts, messages)
 *
 * The audio path is fully WebRTC — no manual base64 encoding of audio.
 * The DataChannel carries structured events for transcription,
 * turn detection, and session management.
 */
export class RealtimeAIClient implements IRealtimeAIClient {
  private state: AIConnectionState = 'disconnected';
  private config: AISessionConfig = DEFAULT_AI_SESSION_CONFIG;
  private interactionMode: InteractionMode = 'push_to_talk';
  private pc: RTCPeerConnection | null = null;
  private dc: any = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;

  private messageListeners: Set<MessageCallback> = new Set();
  private audioDeltaListeners: Set<AudioDeltaCallback> = new Set();
  private transcriptListeners: Set<TranscriptCallback> = new Set();
  private stateListeners: Set<StateCallback> = new Set();
  private errorListeners: Set<ErrorCallback> = new Set();
  private remoteStreamListeners: Set<RemoteStreamCallback> = new Set();
  private speakingStartListeners: Set<VoidCallback> = new Set();
  private speakingEndListeners: Set<VoidCallback> = new Set();
  private isResponding: boolean = false;

  async connect(config?: Partial<AISessionConfig>): Promise<void> {
    if (this.state === 'connected' || this.state === 'connecting') {
      logger.warn(TAG, 'Already connected or connecting');
      return;
    }

    this.config = {...DEFAULT_AI_SESSION_CONFIG, ...config};
    this.setState('connecting');

    try {
      // Validate API key before proceeding
      logger.info(
        TAG,
        `API key loaded: ${
          ENV.OPENAI_API_KEY
            ? 'yes (' + ENV.OPENAI_API_KEY.substring(0, 10) + '...)'
            : 'NO - MISSING'
        }`,
      );
      logger.info(TAG, `Realtime URL: ${ENV.OPENAI_REALTIME_URL}`);

      if (!ENV.OPENAI_API_KEY) {
        throw new Error(
          'OPENAI_API_KEY is not configured. Check .env file and rebuild the app (react-native-config requires a native rebuild after .env changes).',
        );
      }

      // Step 1: Acquire local microphone stream
      logger.info(TAG, 'Acquiring microphone stream');
      this.localStream = (await mediaDevices.getUserMedia({
        audio: true,
      })) as unknown as MediaStream;

      // Step 2: Create peer connection
      logger.info(TAG, 'Creating WebRTC peer connection');
      this.pc = new RTCPeerConnection({
        iceServers: [{urls: 'stun:stun.l.google.com:19302'}],
      });

      // Step 3: Add local audio track to peer connection
      const tracks = this.localStream.getTracks();
      for (const track of tracks) {
        this.pc.addTrack(track as any, this.localStream as any);
      }

      // Initially mute for push-to-talk mode
      if (this.interactionMode === 'push_to_talk') {
        this.muteLocalAudio();
      }

      // Step 4: Handle remote audio track (AI speaking)
      (this.pc as any).ontrack = (event: any) => {
        logger.info(TAG, 'Received remote audio track');
        if (event.streams && event.streams[0]) {
          this.remoteStream = event.streams[0];
          this.remoteStreamListeners.forEach(cb => cb(this.remoteStream!));
        }
      };

      // Step 5: Handle ICE candidates
      (this.pc as any).onicecandidate = (event: any) => {
        if (event.candidate) {
          logger.debug(TAG, 'ICE candidate gathered');
        }
      };

      (this.pc as any).oniceconnectionstatechange = () => {
        const iceState = (this.pc as any)?.iceConnectionState;
        logger.info(TAG, `ICE state: ${iceState}`);
        if (iceState === 'failed') {
          this.handleConnectionFailure();
        }
      };

      // Step 6: Create data channel for structured events
      this.dc = (this.pc as any).createDataChannel('oai-events');
      this.setupDataChannel();

      // Step 7: Create and set local SDP offer
      const offer = await this.pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false,
      } as any);
      await this.pc.setLocalDescription(offer as any);

      // Step 8: Exchange SDP with OpenAI Realtime API
      const sdpResponse = await fetch(
        `${ENV.OPENAI_REALTIME_URL}?model=${this.config.model}&voice=${this.config.voice}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${ENV.OPENAI_API_KEY}`,
            'Content-Type': 'application/sdp',
          },
          body: (offer as any).sdp,
        },
      );

      if (!sdpResponse.ok) {
        const body = await sdpResponse.text();
        throw new Error(`SDP exchange failed (${sdpResponse.status}): ${body}`);
      }

      // Step 9: Set remote SDP answer
      const answerSdp = await sdpResponse.text();
      await this.pc.setRemoteDescription({
        type: 'answer',
        sdp: answerSdp,
      } as any);

      this.setState('connected');
      logger.info(TAG, 'WebRTC connection established with OpenAI Realtime API');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error(TAG, 'Connection failed', err);
      this.cleanup();
      this.setState('error');
      this.errorListeners.forEach(cb => cb(err));
      throw err;
    }
  }

  disconnect(): void {
    logger.info(TAG, 'Disconnecting');
    this.cleanup();
    this.setState('disconnected');
  }

  /**
   * Send base64-encoded audio via DataChannel.
   * This is the fallback path — primary path is the WebRTC audio track.
   */
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

  // --- Interaction mode ---

  setInteractionMode(mode: InteractionMode): void {
    this.interactionMode = mode;
    logger.info(TAG, `Interaction mode: ${mode}`);

    if (this.state === 'connected') {
      this.sendSessionUpdate();
    }
  }

  getInteractionMode(): InteractionMode {
    return this.interactionMode;
  }

  startTalking(): void {
    if (this.interactionMode !== 'push_to_talk') return;
    this.unmuteLocalAudio();
    logger.debug(TAG, 'PTT: started talking');
  }

  stopTalking(): void {
    if (this.interactionMode !== 'push_to_talk') return;
    this.muteLocalAudio();
    this.commitAudioBuffer();
    logger.debug(TAG, 'PTT: stopped talking, committed buffer');
  }

  // --- Listeners ---

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

  onRemoteStream(callback: RemoteStreamCallback): () => void {
    this.remoteStreamListeners.add(callback);
    if (this.remoteStream) {
      callback(this.remoteStream);
    }
    return () => this.remoteStreamListeners.delete(callback);
  }

  onAISpeakingStart(callback: VoidCallback): () => void {
    this.speakingStartListeners.add(callback);
    return () => this.speakingStartListeners.delete(callback);
  }

  onAISpeakingEnd(callback: VoidCallback): () => void {
    this.speakingEndListeners.add(callback);
    return () => this.speakingEndListeners.delete(callback);
  }

  getState(): AIConnectionState {
    return this.state;
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  // --- Private ---

  private setupDataChannel(): void {
    if (!this.dc) return;

    this.dc.onopen = () => {
      logger.info(TAG, 'Data channel opened');
      this.sendSessionUpdate();
    };

    this.dc.onmessage = (event: any) => {
      try {
        const data = JSON.parse(event.data);
        this.handleServerEvent(data);
      } catch (error) {
        logger.error(TAG, 'Failed to parse server event', error);
      }
    };

    this.dc.onerror = (event: any) => {
      logger.error(TAG, 'Data channel error', event);
    };

    this.dc.onclose = () => {
      logger.info(TAG, 'Data channel closed');
    };
  }

  private handleServerEvent(event: Record<string, unknown>): void {
    const type = event.type as string;

    switch (type) {
      case 'session.created':
        logger.info(TAG, 'Session created by server');
        break;

      case 'session.updated':
        logger.info(TAG, 'Session configuration updated');
        break;

      case 'input_audio_buffer.speech_started':
        logger.debug(TAG, 'Server VAD: speech started');
        break;

      case 'input_audio_buffer.speech_stopped':
        logger.debug(TAG, 'Server VAD: speech stopped');
        break;

      case 'response.audio.delta':
        if (!this.isResponding) {
          this.isResponding = true;
          this.speakingStartListeners.forEach(cb => cb());
        }
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
        if (this.isResponding) {
          this.isResponding = false;
          this.speakingEndListeners.forEach(cb => cb());
        }
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
    const turnDetection =
      this.interactionMode === 'auto_vad'
        ? {type: 'server_vad', threshold: 0.5, prefix_padding_ms: 300, silence_duration_ms: 500}
        : null;

    this.sendEvent({
      type: 'session.update',
      session: {
        instructions: this.config.instructions,
        voice: this.config.voice,
        input_audio_format: this.config.inputAudioFormat,
        output_audio_format: this.config.outputAudioFormat,
        input_audio_transcription: {model: 'whisper-1'},
        turn_detection: turnDetection,
        temperature: this.config.temperature,
        max_response_output_tokens: this.config.maxTokens,
      },
    });
  }

  private muteLocalAudio(): void {
    if (!this.localStream) return;
    const audioTracks = this.localStream.getAudioTracks();
    for (const track of audioTracks) {
      track.enabled = false;
    }
  }

  private unmuteLocalAudio(): void {
    if (!this.localStream) return;
    const audioTracks = this.localStream.getAudioTracks();
    for (const track of audioTracks) {
      track.enabled = true;
    }
  }

  private handleConnectionFailure(): void {
    logger.error(TAG, 'ICE connection failed');
    this.cleanup();
    this.setState('error');
    this.errorListeners.forEach(cb => cb(new Error('WebRTC connection failed')));
  }

  private cleanup(): void {
    this.dc?.close();
    this.pc?.close();

    if (this.localStream) {
      const tracks = this.localStream.getTracks();
      for (const track of tracks) {
        track.stop();
      }
    }

    this.dc = null;
    this.pc = null;
    this.localStream = null;
    this.remoteStream = null;
  }

  private setState(newState: AIConnectionState): void {
    this.state = newState;
    this.stateListeners.forEach(cb => cb(newState));
  }
}

export const realtimeAIClient = new RealtimeAIClient();
