export type AIConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

export type AIPhase = 'idle' | 'listening' | 'thinking' | 'speaking';

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
    'You are a friendly English teacher for young Vietnamese children (ages 3-5). ' +
    'The child may speak Vietnamese, English, or mix both — that is normal and okay. ' +
    'Always understand Vietnamese input. ' +
    'Respond primarily in simple English, but use Vietnamese to explain, encourage, or help when needed. ' +
    'For example: "Good job! Con nói giỏi lắm! Now say: Apple" or "That\'s a dog! Con chó đó! Can you say dog?". ' +
    'Keep sentences very short (3-6 words). Speak slowly and clearly. ' +
    'Use lots of praise and encouragement. ' +
    'If the child seems confused, switch more to Vietnamese to help them understand, then gently guide back to English. ' +
    'Correct mistakes gently without making the child feel bad. ' +
    'Make it fun — use animal sounds, counting games, and repetition.',
  temperature: 0.7,
  maxTokens: 256,
  inputAudioFormat: 'pcm16',
  outputAudioFormat: 'pcm16',
};
