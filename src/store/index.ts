import {create} from 'zustand';
import {useShallow} from 'zustand/react/shallow';
import {createJSONStorage, persist} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {createAppSlice, type AppSlice} from './slices/appSlice';
import {createAuthSlice, type AuthSlice} from './slices/authSlice';
import {createConversationSlice, type ConversationSlice} from './slices/conversationSlice';

export type AppStore = AppSlice & AuthSlice & ConversationSlice;

export const useStore = create<AppStore>()(
  persist(
    (...args) => ({
      ...createAppSlice(...args),
      ...createAuthSlice(...args),
      ...createConversationSlice(...args),
    }),
    {
      name: 'learn-eng-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({
        isDarkMode: state.isDarkMode,
        isOnboarded: state.isOnboarded,
        language: state.language,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);

// Selector hooks for performance — useShallow prevents infinite re-renders
// from new object references on every selector call
export const useAppSettings = () =>
  useStore(
    useShallow(state => ({
      isDarkMode: state.isDarkMode,
      language: state.language,
      toggleDarkMode: state.toggleDarkMode,
    })),
  );

export const useAuth = () =>
  useStore(
    useShallow(state => ({
      user: state.user,
      isAuthenticated: state.isAuthenticated,
      isLoading: state.isLoading,
      setUser: state.setUser,
      logout: state.logout,
    })),
  );

export const useConversation = () =>
  useStore(
    useShallow(state => ({
      messages: state.messages,
      audioState: state.audioState,
      connectionState: state.connectionState,
      currentTopic: state.currentTopic,
      interactionMode: state.interactionMode,
      isTalking: state.isTalking,
      audioEnergy: state.audioEnergy,
      vadState: state.vadState,
      streamingTranscript: state.streamingTranscript,
      addMessage: state.addMessage,
      clearMessages: state.clearMessages,
      setAudioState: state.setAudioState,
      setConnectionState: state.setConnectionState,
      setInteractionMode: state.setInteractionMode,
      setIsTalking: state.setIsTalking,
      setAudioEnergy: state.setAudioEnergy,
      setVADState: state.setVADState,
      setStreamingTranscript: state.setStreamingTranscript,
    })),
  );
