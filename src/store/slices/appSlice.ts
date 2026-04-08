import type {StateCreator} from 'zustand';

export interface AppSlice {
  isDarkMode: boolean;
  isOnboarded: boolean;
  language: string;
  toggleDarkMode: () => void;
  setOnboarded: (value: boolean) => void;
  setLanguage: (lang: string) => void;
}

export const createAppSlice: StateCreator<AppSlice> = set => ({
  isDarkMode: false,
  isOnboarded: false,
  language: 'vi',
  toggleDarkMode: () => set(state => ({isDarkMode: !state.isDarkMode})),
  setOnboarded: (value: boolean) => set({isOnboarded: value}),
  setLanguage: (lang: string) => set({language: lang}),
});
