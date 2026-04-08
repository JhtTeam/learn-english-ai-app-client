import type {StateCreator} from 'zustand';
import type {AIConnectionState, AudioState, ConversationMessage} from '@/types';

export interface ConversationSlice {
  messages: ConversationMessage[];
  audioState: AudioState;
  connectionState: AIConnectionState;
  currentTopic: string | null;
  addMessage: (message: ConversationMessage) => void;
  clearMessages: () => void;
  setAudioState: (state: AudioState) => void;
  setConnectionState: (state: AIConnectionState) => void;
  setTopic: (topic: string | null) => void;
}

export const createConversationSlice: StateCreator<ConversationSlice> = set => ({
  messages: [],
  audioState: 'idle',
  connectionState: 'disconnected',
  currentTopic: null,
  addMessage: (message: ConversationMessage) =>
    set(state => ({messages: [...state.messages, message]})),
  clearMessages: () => set({messages: []}),
  setAudioState: (audioState: AudioState) => set({audioState}),
  setConnectionState: (connectionState: AIConnectionState) => set({connectionState}),
  setTopic: (currentTopic: string | null) => set({currentTopic}),
});
