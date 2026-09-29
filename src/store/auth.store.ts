import { create } from "zustand";
import type { AuthUser } from "../types/auth.types";
import { tokenStorage } from "../utils/tokenStorage";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  mustChangePassword: boolean;
  setSession: (
    user: AuthUser,
    accessToken: string,
    refreshToken?: string,
  ) => void;
  setTokens: (accessToken: string, refreshToken?: string) => void;
  setMustChangePassword: (value: boolean) => void;
  clearSession: () => void;
}

function loadUser(): AuthUser | null {
  try {
    const raw = tokenStorage.getUser();
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

const accessToken = tokenStorage.getAccess();
const refreshToken = tokenStorage.getRefresh();
const user = loadUser();

export const useAuthStore = create<AuthState>((set) => ({
  accessToken,
  refreshToken,
  user,
  isAuthenticated: Boolean(user && accessToken),
  mustChangePassword: false,

  setSession: (nextUser, nextAccessToken, nextRefreshToken) => {
    tokenStorage.set(nextAccessToken, nextRefreshToken);
    tokenStorage.setUser(JSON.stringify(nextUser));
    set({
      user: nextUser,
      accessToken: nextAccessToken,
      refreshToken: nextRefreshToken ?? tokenStorage.getRefresh(),
      isAuthenticated: true,
    });
  },

  setTokens: (nextAccessToken, nextRefreshToken) => {
    tokenStorage.set(nextAccessToken, nextRefreshToken);
    set((state) => ({
      accessToken: nextAccessToken,
      refreshToken: nextRefreshToken ?? state.refreshToken,
    }));
  },

  setMustChangePassword: (mustChangePassword) => set({ mustChangePassword }),

  clearSession: () => {
    tokenStorage.clear();
    set({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      mustChangePassword: false,
    });
  },
}));
