import type {StateCreator} from 'zustand';

export interface User {
  id: string;
  name: string;
  avatar?: string;
  level: number;
  xp: number;
}

export interface AuthSlice {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const createAuthSlice: StateCreator<AuthSlice> = set => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  setUser: (user: User | null) => set({user, isAuthenticated: user !== null}),
  setLoading: (isLoading: boolean) => set({isLoading}),
  logout: () => set({user: null, isAuthenticated: false}),
});
