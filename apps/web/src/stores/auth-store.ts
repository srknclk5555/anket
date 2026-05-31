import { create } from "zustand";
import type { SessionUser } from "@gorunmeyen-lig/shared";

interface AuthState {
  user: SessionUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: SessionUser | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
      isLoading: false,
    }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: () =>
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    }),
}));
