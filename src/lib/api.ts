import { ROUTES } from "../routes/paths";
import type { LoginResponse } from "../types/auth";

const BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5094";

const TOKEN_KEY = "hms_access_token";
const REFRESH_KEY = "hms_refresh_token";
const USER_KEY = "hms_user";

type SessionListener = (session: LoginResponse) => void;
const sessionListeners = new Set<SessionListener>();

export const tokenStore = {
  get: () => sessionStorage.getItem(TOKEN_KEY),
  getRefresh: () => sessionStorage.getItem(REFRESH_KEY),
  set: (accessToken: string, refreshToken?: string) => {
    sessionStorage.setItem(TOKEN_KEY, accessToken);
    if (refreshToken) sessionStorage.setItem(REFRESH_KEY, refreshToken);
  },
  clear: () => {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_KEY);
    sessionStorage.removeItem(USER_KEY);
  },
};

/** Fired after a successful refresh so the signed-in user can pick up the new expiry. */
export function onSessionRefreshed(listener: SessionListener): () => void {
  sessionListeners.add(listener);
  return () => sessionListeners.delete(listener);
}

export class ApiError extends Error {
  status: number;
  details?: Record<string, string[]>;

  constructor(message: string, status: number, details?: Record<string, string[]>) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function extractMessage(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const d = data as {
    detail?: string;
    title?: string;
    message?: string;
    errors?: Record<string, string[]>;
  };
  if (d.errors) {
    const first = Object.values(d.errors).flat()[0];
    if (first) return first;
  }
  return d.detail ?? d.message ?? d.title ?? null;
}

function redirectToLogin() {
  if (window.location.pathname !== ROUTES.LOGIN) {
    window.location.assign(ROUTES.LOGIN);
  }
}

let refreshInFlight: Promise<LoginResponse> | null = null;

/**
 * POST /api/hotel/auth/refresh-token.
 * One endpoint for super admin, hotel admin, and staff. The previous refresh
 * token is revoked, so the new pair is stored immediately.
 */
export function refreshSession(): Promise<LoginResponse> {
  const refreshToken = tokenStore.getRefresh();
  if (!refreshToken) {
    return Promise.reject(new ApiError("Your session has expired. Sign in again.", 401));
  }
  if (!refreshInFlight) {
    refreshInFlight = performRefresh(refreshToken).finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

async function performRefresh(refreshToken: string): Promise<LoginResponse> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/api/hotel/auth/refresh-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
  } catch {
    throw new ApiError(
      "Can't reach the server. Check the API is running and CORS allows this site.",
      0,
    );
  }

  const text = await res.text();
  const data = text ? safeJson(text) : null;
  const accessToken =
    data && typeof data === "object" && "accessToken" in data
      ? String((data as { accessToken?: unknown }).accessToken ?? "")
      : "";

  if (!res.ok || !accessToken) {
    throw new ApiError(
      extractMessage(data) ?? "Your session has expired. Sign in again.",
      res.status || 401,
    );
  }

  const session = data as LoginResponse;
  tokenStore.set(session.accessToken, session.refreshToken);
  sessionListeners.forEach((listener) => listener(session));
  return session;
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  auth?: boolean;
  /** Login and the refresh call itself must not trigger another refresh. */
  skipRefresh?: boolean;
  retried?: boolean;
}

export async function apiFetch<T>(
  path: string,
  { method = "GET", body, auth = true, skipRefresh = false, retried = false }: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = tokenStore.get();
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(
      "Can't reach the server. Check the API is running and CORS allows this site.",
      0,
    );
  }

  const text = await res.text();
  const data = text ? safeJson(text) : null;

  if (res.status === 401 && auth && !skipRefresh) {
    if (!retried && tokenStore.getRefresh()) {
      try {
        await refreshSession();
        return apiFetch<T>(path, { method, body, auth, skipRefresh, retried: true });
      } catch (err) {
        if (err instanceof ApiError && err.status === 0) throw err;
      }
    }
    tokenStore.clear();
    redirectToLogin();
    throw new ApiError("Your session has expired. Sign in again.", 401);
  }

  if (!res.ok) {
    const details =
      data && typeof data === "object"
        ? (data as { errors?: Record<string, string[]> }).errors
        : undefined;
    throw new ApiError(
      extractMessage(data) ?? `Request failed (${res.status})`,
      res.status,
      details,
    );
  }

  return data as T;
}
