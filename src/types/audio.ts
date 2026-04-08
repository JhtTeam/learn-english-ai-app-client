export type AudioState = 'idle' | 'recording' | 'playing' | 'paused' | 'error';

export interface AudioRecorderConfig {
  sampleRate: number;
  channels: 1 | 2;
  bitDepth: 16 | 24;
  encoding: 'pcm' | 'aac' | 'opus';
}

export interface AudioChunk {
  data: string; // base64 encoded
  timestamp: number;
  duration: number;
}

export interface RecorderEvents {
  onAudioData: (chunk: AudioChunk) => void;
  onStateChange: (state: AudioState) => void;
  onError: (error: Error) => void;
}

export interface IAudioRecorderService {
  start(config?: Partial<AudioRecorderConfig>): Promise<void>;
  stop(): Promise<string | null>;
  pause(): void;
  resume(): void;
  getState(): AudioState;
  onAudioData(callback: (chunk: AudioChunk) => void): () => void;
  onStateChange(callback: (state: AudioState) => void): () => void;
  dispose(): void;
}

export interface IRealtimeVoiceService {
  connect(url: string, config?: Record<string, unknown>): Promise<void>;
  disconnect(): void;
  sendAudio(chunk: AudioChunk): void;
  onAudioReceived(callback: (chunk: AudioChunk) => void): () => void;
  onTranscript(callback: (text: string, isFinal: boolean) => void): () => void;
  onError(callback: (error: Error) => void): () => void;
  isConnected(): boolean;
}
