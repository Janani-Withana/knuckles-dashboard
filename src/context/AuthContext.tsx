import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { ApiError, tokenStore } from "../lib/api";
import { superAdminLogin } from "../services/authService.service";
import type { AuthUser, Role } from "../types/auth";

interface LoginResult {
  role: Role;
  mustChangePassword: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  mustChangePassword: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  completePasswordChange: (newPassword: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const USER_KEY = "hms_user";

function loadStoredUser(): AuthUser | null {
  try {
    const raw = sessionStorage.getItem(USER_KEY);
    if (!raw || !tokenStore.get()) return null;
    const stored = JSON.parse(raw) as AuthUser;
    if (
      stored.expiresAtUtc &&
      new Date(stored.expiresAtUtc).getTime() <= Date.now()
    ) {
      return null;
    }
    return stored;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(loadStoredUser);
  const [mustChangePassword, setMustChangePassword] = useState(false);

  useEffect(() => {
    if (user) sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    else tokenStore.clear();
  }, [user]);

  const login = async (
    email: string,
    password: string,
  ): Promise<LoginResult> => {
    // Super admin: real API
    if (email.toLowerCase().includes("super")) {
      const res = await superAdminLogin(email, password);

      if (!res.roles.includes("PLATFORM_ADMIN")) {
        throw new ApiError("This account is not a platform admin.", 403);
      }

      tokenStore.set(res.accessToken);
      setUser({
        email: res.email,
        fullName: res.fullName,
        role: "SuperAdmin",
        staffUid: res.staffUid,
        expiresAtUtc: res.expiresAtUtc,
      });
      setMustChangePassword(false);
      return { role: "SuperAdmin", mustChangePassword: false };
    }

    // TODO: property admin login API. Mock until the endpoint is available.
    setUser({ email, role: "PropertyAdmin" });
    setMustChangePassword(false);
    return { role: "PropertyAdmin", mustChangePassword: false };
  };

  const completePasswordChange = async (newPassword: string) => {
    void newPassword; // TODO: call API
    setMustChangePassword(false);
    setUser(null);
  };

  const logout = () => {
    tokenStore.clear();
    setUser(null);
    setMustChangePassword(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        mustChangePassword,
        login,
        completePasswordChange,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
