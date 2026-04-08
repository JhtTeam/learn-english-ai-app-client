import {logger} from '@/utils/logger';
import type {AudioChunk, IRealtimeVoiceService} from '@/types';

const TAG = 'RealtimeVoiceService';

type AudioCallback = (chunk: AudioChunk) => void;
type TranscriptCallback = (text: string, isFinal: boolean) => void;
type ErrorCallback = (error: Error) => void;

/**
 * Manages real-time voice streaming over WebSocket/WebRTC.
 * Acts as the transport layer between the audio recorder and AI service.
 */
export class RealtimeVoiceService implements IRealtimeVoiceService {
  private ws: WebSocket | null = null;
  private connected = false;
  private audioListeners: Set<AudioCallback> = new Set();
  private transcriptListeners: Set<TranscriptCallback> = new Set();
  private errorListeners: Set<ErrorCallback> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;

  async connect(url: string, config?: Record<string, unknown>): Promise<void> {
    logger.info(TAG, `Connecting to ${url}`);

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
          logger.info(TAG, 'Connected');
          this.connected = true;
          this.reconnectAttempts = 0;

          if (config) {
            this.ws?.send(JSON.stringify({type: 'config', ...config}));
          }

          resolve();
        };

        this.ws.onmessage = (event: WebSocketMessageEvent) => {
          this.handleMessage(event.data);
        };

        this.ws.onerror = (event: Event) => {
          const error = new Error(`WebSocket error: ${JSON.stringify(event)}`);
          logger.error(TAG, 'Connection error', error);
          this.errorListeners.forEach(cb => cb(error));
          reject(error);
        };

        this.ws.onclose = () => {
          logger.info(TAG, 'Disconnected');
          this.connected = false;
          this.attemptReconnect(url, config);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect(): void {
    logger.info(TAG, 'Disconnecting');
    this.reconnectAttempts = this.maxReconnectAttempts; // Prevent reconnect
    this.ws?.close();
    this.ws = null;
    this.connected = false;
  }

  sendAudio(chunk: AudioChunk): void {
    if (!this.connected || !this.ws) {
      logger.warn(TAG, 'Not connected, cannot send audio');
      return;
    }

    this.ws.send(
      JSON.stringify({
        type: 'audio',
        data: chunk.data,
        timestamp: chunk.timestamp,
      }),
    );
  }

  onAudioReceived(callback: AudioCallback): () => void {
    this.audioListeners.add(callback);
    return () => this.audioListeners.delete(callback);
  }

  onTranscript(callback: TranscriptCallback): () => void {
    this.transcriptListeners.add(callback);
    return () => this.transcriptListeners.delete(callback);
  }

  onError(callback: ErrorCallback): () => void {
    this.errorListeners.add(callback);
    return () => this.errorListeners.delete(callback);
  }

  isConnected(): boolean {
    return this.connected;
  }

  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data);

      switch (message.type) {
        case 'audio':
          this.audioListeners.forEach(cb =>
            cb({
              data: message.data,
              timestamp: message.timestamp,
              duration: message.duration,
            }),
          );
          break;

        case 'transcript':
          this.transcriptListeners.forEach(cb => cb(message.text, message.isFinal));
          break;

        default:
          logger.debug(TAG, `Unknown message type: ${message.type}`);
      }
    } catch (error) {
      logger.error(TAG, 'Failed to parse message', error);
    }
  }

  private attemptReconnect(url: string, config?: Record<string, unknown>): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;

    this.reconnectAttempts++;
    const delay = Math.pow(2, this.reconnectAttempts) * 1000;

    logger.info(TAG, `Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      this.connect(url, config).catch(() => {});
    }, delay);
  }
}

export const realtimeVoiceService = new RealtimeVoiceService();
