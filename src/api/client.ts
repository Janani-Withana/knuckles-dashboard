import axios, {
  AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
import { ApiError, extractApiMessage } from "../utils/errors";
import { tokenStorage } from "../utils/tokenStorage";

declare module "axios" {
  export interface AxiosRequestConfig {
    skipAuth?: boolean;
    _retry?: boolean;
  }
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const AUTH_SKIP_PATHS = [
  "/api/hotel/auth/super-admin/login",
  "/api/hotel/auth/admin/login",
  "/api/hotel/auth/staff/login",
  "/api/hotel/auth/login",
  "/api/hotel/auth/refresh-token",
];

const shouldSkipAuth = (config: AxiosRequestConfig) => {
  if (config.skipAuth) return true;
  const url = config.url ?? "";
  return AUTH_SKIP_PATHS.some((path) => url.includes(path));
};

function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    if (!axiosError.response) {
      return new ApiError(
        "Can't reach the server. Check the API is running and CORS allows this site.",
        0,
      );
    }
    const data = axiosError.response.data;
    const details =
      data && typeof data === "object"
        ? (data as { errors?: Record<string, string[]> }).errors
        : undefined;
    return new ApiError(
      extractApiMessage(data) ??
        `Request failed (${axiosError.response.status})`,
      axiosError.response.status,
      details,
    );
  }
  return new ApiError("Something went wrong.", 0);
}

apiClient.interceptors.request.use((config) => {
  if (!shouldSkipAuth(config)) {
    const token = tokenStorage.getAccess();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const refreshToken = tokenStorage.getRefresh();
  if (!refreshToken) {
    throw new ApiError("Session expired. Please sign in again.", 401);
  }

  const { data } = await axios.post<{
    accessToken: string;
    refreshToken?: string;
  }>(`${BASE_URL}/api/hotel/auth/refresh-token`, { refreshToken });

  if (!data.accessToken) {
    throw new ApiError("Session expired. Please sign in again.", 401);
  }

  tokenStorage.set(data.accessToken, data.refreshToken);
  const { useAuthStore } = await import("../store/auth.store");
  useAuthStore.getState().setTokens(data.accessToken, data.refreshToken);
  return data.accessToken;
}

function queueRefresh(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

async function expireSession() {
  tokenStorage.clear();
  const { useAuthStore } = await import("../store/auth.store");
  useAuthStore.getState().clearSession();
  if (window.location.pathname !== "/login") {
    window.location.assign("/login");
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig | undefined;
    if (!original || error.response?.status !== 401 || original._retry) {
      return Promise.reject(toApiError(error));
    }
    if (shouldSkipAuth(original)) {
      return Promise.reject(toApiError(error));
    }

    original._retry = true;
    try {
      const accessToken = await queueRefresh();
      original.headers.Authorization = `Bearer ${accessToken}`;
      return apiClient(original);
    } catch {
      await expireSession();
      return Promise.reject(
        new ApiError("Session expired. Please sign in again.", 401),
      );
    }
  },
);
