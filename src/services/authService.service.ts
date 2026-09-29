import { apiFetch } from "../lib/api";
import type { LoginRequest, LoginResponse } from "../types/auth";

export const superAdminLogin = (email: string, password: string) =>
  apiFetch<LoginResponse>("/api/hotel/auth/super-admin/login", {
    method: "POST",
    body: { email, password } satisfies LoginRequest,
    auth: false,
  });