import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ApiError,
  onSessionRefreshed,
  refreshSession,
  tokenStore,
} from "../lib/api";
import { roleFromLogin, signIn } from "../services/authService.service";
import type { AuthUser, LoginResponse, Role } from "../types/auth";

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

const EMPTY_UID = "00000000-0000-0000-0000-000000000000";

function realUid(value?: string | null): string {
  return value && value !== EMPTY_UID ? value : "";
}

function toAuthUser(res: LoginResponse, email: string): AuthUser {
  const propertyUids = (res.propertyUids ?? [])
    .map((uid) => realUid(uid))
    .filter(Boolean);
  const propertyUid = realUid(res.propertyUid) || propertyUids[0] || "";
  return {
    email: res.email || email,
    fullName: res.fullName,
    role: roleFromLogin(res),
    roles: res.roles ?? [],
    staffUid: res.staffUid,
    propertyUid,
    propertyUids: propertyUids.length ? propertyUids : propertyUid ? [propertyUid] : [],
    expiresAtUtc: res.expiresAtUtc,
    refreshTokenExpiresAtUtc: res.refreshTokenExpiresAtUtc,
  };
}

/** Fills profile fields for a session saved before those fields were stored. */
function claimsFromAccessToken(): Record<string, unknown> | null {
  const token = tokenStore.get();
  const payload = token?.split(".")[1];
  if (!payload) return null;
  try {
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function normalizeStoredUser(stored: Partial<AuthUser>): AuthUser | null {
  const claims = claimsFromAccessToken();
  const claim = (key: string) => {
    const value = claims?.[key];
    return typeof value === "string" ? value : "";
  };
  const claimRoles = claims?.role;
  const roles = stored.roles?.length
    ? stored.roles
    : Array.isArray(claimRoles)
      ? claimRoles.filter((role): role is string => typeof role === "string")
      : claim("role")
        ? [claim("role")]
        : [];
  const propertyFromClaim = claim("property_uids")
    .split(",")
    .map((uid) => realUid(uid.trim()))
    .filter(Boolean);
  const propertyUid =
    realUid(stored.propertyUid) || realUid(claim("property_uid")) || propertyFromClaim[0] || "";
  const propertyUids = stored.propertyUids?.length
    ? stored.propertyUids
    : propertyFromClaim.length
      ? propertyFromClaim
      : propertyUid
        ? [propertyUid]
        : [];
  const email = stored.email || claim("email");
  if (!email || !stored.role) return null;
  return {
    email,
    fullName: stored.fullName || claim("full_name") || undefined,
    role: stored.role,
    roles,
    staffUid: stored.staffUid || claim("staff_uid") || undefined,
    propertyUid,
    propertyUids,
    expiresAtUtc: stored.expiresAtUtc,
    refreshTokenExpiresAtUtc: stored.refreshTokenExpiresAtUtc,
  };
}

function loadStoredUser(): AuthUser | null {
  try {
    const raw = sessionStorage.getItem(USER_KEY);
    if (!raw || (!tokenStore.get() && !tokenStore.getRefresh())) return null;
    return normalizeStoredUser(JSON.parse(raw) as Partial<AuthUser>);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(loadStoredUser);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const lastProactiveRefresh = useRef(0);

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
    setMustChangePassword(false);
  }, []);

  useEffect(() => {
    if (user) sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    return onSessionRefreshed((session) => {
      setUser((prev) =>
        prev
          ? {
              ...prev,
              email: session.email || prev.email,
              fullName: session.fullName || prev.fullName,
              staffUid: session.staffUid || prev.staffUid,
              propertyUid: realUid(session.propertyUid) || prev.propertyUid,
              propertyUids: session.propertyUids?.length
                ? session.propertyUids
                : prev.propertyUids,
              roles: session.roles?.length ? session.roles : prev.roles,
              expiresAtUtc: session.expiresAtUtc || prev.expiresAtUtc,
              refreshTokenExpiresAtUtc:
                session.refreshTokenExpiresAtUtc || prev.refreshTokenExpiresAtUtc,
              role: (session.roles ?? []).includes("PLATFORM_ADMIN")
                ? "SuperAdmin"
                : prev.role,
            }
          : prev,
      );
    });
  }, []);

  // Same refresh call for every role, shortly before the access token expires.
  useEffect(() => {
    if (!user?.expiresAtUtc || !tokenStore.getRefresh()) return;
    const remaining = new Date(user.expiresAtUtc).getTime() - Date.now();
    const delay = Math.min(Math.max(remaining - 30_000, 0), 2_147_483_647);
    const id = window.setTimeout(() => {
      if (Date.now() - lastProactiveRefresh.current < 15_000) return;
      lastProactiveRefresh.current = Date.now();
      refreshSession().catch((err) => {
        if (err instanceof ApiError && err.status !== 0) logout();
      });
    }, delay);
    return () => window.clearTimeout(id);
  }, [user?.expiresAtUtc, logout]);

  const login = async (
    email: string,
    password: string,
  ): Promise<LoginResult> => {
    const res = await signIn(email, password);
    const next = toAuthUser(res, email.trim());

    if (
      email.trim().toLowerCase().split("@")[0]?.includes("superadmin") &&
      next.role !== "SuperAdmin"
    ) {
      throw new ApiError("This account is not a platform admin.", 403);
    }

    tokenStore.set(res.accessToken, res.refreshToken);
    setUser(next);
    setMustChangePassword(false);
    return { role: next.role, mustChangePassword: false };
  };

  const completePasswordChange = async (newPassword: string) => {
    void newPassword; // TODO: call API
    logout();
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
