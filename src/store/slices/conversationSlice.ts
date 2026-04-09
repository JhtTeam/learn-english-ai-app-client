import type {StateCreator} from 'zustand';
import type {
  AIConnectionState,
  AudioState,
  ConversationMessage,
  InteractionMode,
  VADState,
} from '@/types';

export interface ConversationSlice {
  messages: ConversationMessage[];
  audioState: AudioState;
  connectionState: AIConnectionState;
  currentTopic: string | null;

  // Realtime voice state
  interactionMode: InteractionMode;
  isTalking: boolean;
  audioEnergy: number;
  vadState: VADState;
  streamingTranscript: string;

  // Actions
  addMessage: (message: ConversationMessage) => void;
  clearMessages: () => void;
  setAudioState: (state: AudioState) => void;
  setConnectionState: (state: AIConnectionState) => void;
  setTopic: (topic: string | null) => void;
  setInteractionMode: (mode: InteractionMode) => void;
  setIsTalking: (talking: boolean) => void;
  setAudioEnergy: (energy: number) => void;
  setVADState: (state: VADState) => void;
  setStreamingTranscript: (transcript: string) => void;
}

export const createConversationSlice: StateCreator<ConversationSlice> = set => ({
  messages: [],
  audioState: 'idle',
  connectionState: 'disconnected',
  currentTopic: null,
  interactionMode: 'push_to_talk',
  isTalking: false,
  audioEnergy: 0,
  vadState: 'inactive',
  streamingTranscript: '',

  addMessage: (message: ConversationMessage) =>
    set(state => ({messages: [...state.messages, message]})),
  clearMessages: () => set({messages: [], streamingTranscript: ''}),
  setAudioState: (audioState: AudioState) => set({audioState}),
  setConnectionState: (connectionState: AIConnectionState) => set({connectionState}),
  setTopic: (currentTopic: string | null) => set({currentTopic}),
  setInteractionMode: (interactionMode: InteractionMode) => set({interactionMode}),
  setIsTalking: (isTalking: boolean) => set({isTalking}),
  setAudioEnergy: (audioEnergy: number) => set({audioEnergy}),
  setVADState: (vadState: VADState) => set({vadState}),
  setStreamingTranscript: (streamingTranscript: string) => set({streamingTranscript}),
});
