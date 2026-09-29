import { ROUTES } from "../routes/paths";

const BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5094";

const TOKEN_KEY = "hms_access_token";
const USER_KEY = "hms_user";

export const tokenStore = {
  get: () => sessionStorage.getItem(TOKEN_KEY),
  set: (token: string) => sessionStorage.setItem(TOKEN_KEY, token),
  clear: () => {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  },
};

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

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  auth?: boolean;
}

export async function apiFetch<T>(
  path: string,
  { method = "GET", body, auth = true }: RequestOptions = {},
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

  if (res.status === 401 && auth) {
    // Session expired or token rejected
    tokenStore.clear();
    window.location.assign(ROUTES.LOGIN);
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