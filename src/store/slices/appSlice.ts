import type {StateCreator} from 'zustand';
import type {InteractionMode} from '@/types';

export interface AppSlice {
  isDarkMode: boolean;
  isOnboarded: boolean;
  language: string;
  preferredInteractionMode: InteractionMode;
  toggleDarkMode: () => void;
  setOnboarded: (value: boolean) => void;
  setLanguage: (lang: string) => void;
  setPreferredInteractionMode: (mode: InteractionMode) => void;
}

export const createAppSlice: StateCreator<AppSlice> = set => ({
  isDarkMode: false,
  isOnboarded: false,
  language: 'vi',
  preferredInteractionMode: 'auto_vad',
  toggleDarkMode: () => set(state => ({isDarkMode: !state.isDarkMode})),
  setOnboarded: (value: boolean) => set({isOnboarded: value}),
  setLanguage: (lang: string) => set({language: lang}),
  setPreferredInteractionMode: (preferredInteractionMode: InteractionMode) =>
    set({preferredInteractionMode}),
});
