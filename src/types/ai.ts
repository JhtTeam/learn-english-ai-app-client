export type AIConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

export type ConversationRole = 'user' | 'assistant' | 'system';

export interface ConversationMessage {
  id: string;
  role: ConversationRole;
  content: string;
  timestamp: number;
  audioUrl?: string;
}

export interface AISessionConfig {
  model: string;
  voice: string;
  instructions: string;
  temperature: number;
  maxTokens: number;
  inputAudioFormat: 'pcm16' | 'g711_ulaw' | 'g711_alaw';
  outputAudioFormat: 'pcm16' | 'g711_ulaw' | 'g711_alaw';
}

export interface RealtimeEvent {
  type: string;
  [key: string]: unknown;
}

export interface IRealtimeAIClient {
  connect(config: Partial<AISessionConfig>): Promise<void>;
  disconnect(): void;
  sendAudio(audioData: string): void;
  sendText(text: string): void;
  commitAudioBuffer(): void;
  cancelResponse(): void;
  onMessage(callback: (message: ConversationMessage) => void): () => void;
  onAudioDelta(callback: (audioDelta: string) => void): () => void;
  onTranscript(callback: (transcript: string, isFinal: boolean) => void): () => void;
  onStateChange(callback: (state: AIConnectionState) => void): () => void;
  onError(callback: (error: Error) => void): () => void;
  getState(): AIConnectionState;
}

export const DEFAULT_AI_SESSION_CONFIG: AISessionConfig = {
  model: 'gpt-4o-realtime-preview',
  voice: 'alloy',
  instructions:
    'You are a friendly English teacher for children. Speak simply, clearly, and encouragingly. Use short sentences. Correct mistakes gently.',
  temperature: 0.7,
  maxTokens: 256,
  inputAudioFormat: 'pcm16',
  outputAudioFormat: 'pcm16',
};
