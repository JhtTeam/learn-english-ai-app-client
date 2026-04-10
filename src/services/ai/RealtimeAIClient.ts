import LiveAudioStream from 'react-native-live-audio-stream';
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
type VoidCallback = () => void;

/**
 * Client for Google Gemini Multimodal Live API (voice-to-voice).
 *
 * Architecture:
 *   Mic → react-native-live-audio-stream → PCM base64 → WebSocket → Gemini
 *   Gemini → WebSocket → PCM base64 → AudioPlayerService → Speaker
 *   Gemini → WebSocket → JSON events (transcripts, turn state)
 *
 * Uses plain WebSocket for bidirectional audio streaming.
 * Audio capture via react-native-live-audio-stream (raw PCM).
 * Audio playback delegated to AudioPlayerService via onAudioDelta callbacks.
 */
export class RealtimeAIClient implements IRealtimeAIClient {
  private state: AIConnectionState = 'disconnected';
  private config: AISessionConfig = DEFAULT_AI_SESSION_CONFIG;
  private interactionMode: InteractionMode = 'push_to_talk';
  private ws: WebSocket | null = null;
  private isStreaming = false;
  private isResponding = false;
  private currentTranscript = '';
  private audioInitialized = false;

  private messageListeners: Set<MessageCallback> = new Set();
  private audioDeltaListeners: Set<AudioDeltaCallback> = new Set();
  private transcriptListeners: Set<TranscriptCallback> = new Set();
  private stateListeners: Set<StateCallback> = new Set();
  private errorListeners: Set<ErrorCallback> = new Set();
  private speakingStartListeners: Set<VoidCallback> = new Set();
  private speakingEndListeners: Set<VoidCallback> = new Set();

  async connect(config?: Partial<AISessionConfig>): Promise<void> {
    if (this.state === 'connected' || this.state === 'connecting') {
      logger.warn(TAG, 'Already connected or connecting');
      return;
    }

    this.config = {...DEFAULT_AI_SESSION_CONFIG, ...config};
    this.setState('connecting');

    try {
      if (!ENV.GEMINI_API_KEY) {
        throw new Error(
          'GEMINI_API_KEY is not configured. Get your free API key at https://aistudio.google.com/apikey and add it to your .env file.',
        );
      }

      logger.info(TAG, 'Connecting to Gemini Live API');
      logger.info(TAG, `Model: ${this.config.model}, Voice: ${this.config.voice}`);

      // Initialize audio capture (only once)
      this.initAudioCapture();

      // Connect WebSocket to Gemini
      const url = `${ENV.GEMINI_REALTIME_URL}?key=${ENV.GEMINI_API_KEY}`;

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          if (this.state === 'connecting') {
            reject(new Error('Connection timeout (15s)'));
            this.cleanup();
          }
        }, 15000);

        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
          logger.info(TAG, 'WebSocket connected, sending setup');
          this.sendSetup();
        };

        this.ws.onmessage = (event: WebSocketMessageEvent) => {
          try {
            // Gemini sends audio as binary WebSocket frames — decode to string first
            let raw: string;
            if (typeof event.data === 'string') {
              raw = event.data;
            } else if (event.data instanceof ArrayBuffer) {
              const bytes = new Uint8Array(event.data);
              let decoded = '';
              for (let i = 0; i < bytes.length; i++) {
                decoded += String.fromCharCode(bytes[i]);
              }
              raw = decoded;
            } else {
              // Unknown binary type (Blob, etc.) — skip
              return;
            }
            const data = JSON.parse(raw);

            // Handle setup completion — resolve the connect promise
            if (data.setupComplete !== undefined) {
              clearTimeout(timeout);
              logger.info(TAG, 'Gemini session ready');
              this.setState('connected');

              // Auto-start streaming in auto_vad mode
              if (this.interactionMode === 'auto_vad') {
                this.startStreaming();
              }

              resolve();
              return;
            }

            this.handleServerEvent(data);
          } catch (error) {
            logger.error(TAG, 'Failed to parse server event', error);
          }
        };

        this.ws.onerror = () => {
          clearTimeout(timeout);
          const err = new Error('WebSocket connection error');
          logger.error(TAG, 'WebSocket error', err);
          this.errorListeners.forEach(cb => cb(err));
          if (this.state === 'connecting') {
            reject(err);
          }
        };

        this.ws.onclose = (event: WebSocketCloseEvent) => {
          clearTimeout(timeout);
          logger.info(TAG, `WebSocket closed (code: ${event.code})`);
          if (this.state === 'connecting') {
            reject(new Error(`WebSocket closed during setup (code: ${event.code})`));
          }
          this.stopStreaming();
          this.ws = null;
          if (this.state !== 'disconnected') {
            this.setState('disconnected');
          }
        };
      });
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

  sendAudio(audioData: string): void {
    if (this.state !== 'connected') return;
    this.sendJSON({
      realtimeInput: {
        mediaChunks: [
          {
            mimeType: 'audio/pcm;rate=16000',
            data: audioData,
          },
        ],
      },
    });
  }

  sendText(text: string): void {
    if (this.state !== 'connected') return;
    this.sendJSON({
      clientContent: {
        turns: [
          {
            role: 'user',
            parts: [{text}],
          },
        ],
        turnComplete: true,
      },
    });
  }

  commitAudioBuffer(): void {
    if (this.state !== 'connected') return;
    this.sendJSON({
      clientContent: {
        turnComplete: true,
      },
    });
  }

  cancelResponse(): void {
    logger.warn(TAG, 'Cancel not directly supported in Gemini Live API');
  }

  // --- Interaction mode ---

  setInteractionMode(mode: InteractionMode): void {
    this.interactionMode = mode;
    logger.info(TAG, `Interaction mode: ${mode}`);

    // If already connected, toggle streaming accordingly
    if (this.state === 'connected') {
      if (mode === 'auto_vad') {
        this.startStreaming();
      } else {
        this.stopStreaming();
      }
    }
  }

  getInteractionMode(): InteractionMode {
    return this.interactionMode;
  }

  startTalking(): void {
    this.startStreaming();
    logger.debug(TAG, 'Started talking');
  }

  stopTalking(): void {
    if (this.interactionMode === 'push_to_talk') {
      this.stopStreaming();
      this.commitAudioBuffer();
      logger.debug(TAG, 'Stopped talking, committed buffer');
    }
    // In auto_vad mode, don't stop streaming — Gemini handles turn detection
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

  // --- Private ---

  private initAudioCapture(): void {
    if (this.audioInitialized) return;

    LiveAudioStream.init({
      sampleRate: 16000,
      channels: 1,
      bitsPerSample: 16,
      audioSource: 6, // VOICE_RECOGNITION
      bufferSize: 4096,
      wavFile: '', // not saving to file, streaming only
    });

    LiveAudioStream.on('data', (base64: string) => {
      if (this.isStreaming && this.state === 'connected') {
        this.sendAudio(base64);
      }
    });

    this.audioInitialized = true;
    logger.info(TAG, 'Audio capture initialized (16kHz, 16-bit, mono)');
  }

  private startStreaming(): void {
    if (this.isStreaming) return;
    this.isStreaming = true;
    LiveAudioStream.start();
    logger.debug(TAG, 'Mic streaming started');
  }

  private stopStreaming(): void {
    if (!this.isStreaming) return;
    this.isStreaming = false;
    LiveAudioStream.stop();
    logger.debug(TAG, 'Mic streaming stopped');
  }

  private sendSetup(): void {
    this.sendJSON({
      setup: {
        model: `models/${this.config.model}`,
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: this.config.voice,
              },
            },
          },
          temperature: this.config.temperature,
          maxOutputTokens: this.config.maxTokens,
        },
        systemInstruction: {
          parts: [{text: this.config.instructions}],
        },
      },
    });
  }

  private handleServerEvent(event: Record<string, unknown>): void {
    const serverContent = event.serverContent as Record<string, unknown> | undefined;

    if (serverContent) {
      const modelTurn = serverContent.modelTurn as Record<string, unknown> | undefined;

      if (modelTurn?.parts) {
        const parts = modelTurn.parts as Array<Record<string, unknown>>;

        for (const part of parts) {
          // Audio response from Gemini
          const inlineData = part.inlineData as Record<string, string> | undefined;
          if (inlineData?.data) {
            if (!this.isResponding) {
              this.isResponding = true;
              this.speakingStartListeners.forEach(cb => cb());
            }
            this.audioDeltaListeners.forEach(cb => cb(inlineData.data));
          }

          // Text transcript from Gemini
          if (typeof part.text === 'string') {
            this.currentTranscript += part.text;
            this.transcriptListeners.forEach(cb => cb(part.text as string, false));
          }
        }
      }

      // Turn complete — AI finished speaking
      if (serverContent.turnComplete) {
        if (this.isResponding) {
          this.isResponding = false;
          this.speakingEndListeners.forEach(cb => cb());
        }

        if (this.currentTranscript) {
          // Send final transcript
          this.transcriptListeners.forEach(cb => cb(this.currentTranscript, true));

          // Add as conversation message
          this.messageListeners.forEach(cb =>
            cb({
              id: Date.now().toString(),
              role: 'assistant',
              content: this.currentTranscript,
              timestamp: Date.now(),
            }),
          );
          this.currentTranscript = '';
        }
      }
    }

    // Handle errors from Gemini
    if (event.error) {
      const errorData = event.error as Record<string, unknown>;
      const message = (errorData.message as string) ?? 'Unknown Gemini error';
      logger.error(TAG, `Gemini error: ${message}`);
      this.errorListeners.forEach(cb => cb(new Error(message)));
    }
  }

  private sendJSON(data: Record<string, unknown>): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  private cleanup(): void {
    this.stopStreaming();

    if (this.ws) {
      this.ws.onclose = null; // prevent re-entry
      this.ws.close();
      this.ws = null;
    }

    this.currentTranscript = '';
    this.isResponding = false;
  }

  private setState(newState: AIConnectionState): void {
    this.state = newState;
    this.stateListeners.forEach(cb => cb(newState));
  }
}

export const realtimeAIClient = new RealtimeAIClient();
