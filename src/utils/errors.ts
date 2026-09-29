export class ApiError extends Error {
  status: number;
  code?: string;
  errors?: Record<string, string[]>;

  constructor(
    message: string,
    status: number,
    errors?: Record<string, string[]>,
    code?: string,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
    this.code = code;
  }
}

export function extractApiMessage(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const body = data as {
    detail?: string;
    title?: string;
    message?: string;
    code?: string;
    errors?: Record<string, string[]>;
  };
  if (body.errors) {
    const first = Object.values(body.errors).flat()[0];
    if (first) return first;
  }
  return body.detail ?? body.message ?? body.title ?? null;
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
