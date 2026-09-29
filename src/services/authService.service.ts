import { ApiError, apiFetch } from "../lib/api";
import type { LoginRequest, LoginResponse, Role } from "../types/auth";

const credentials = (email: string, password: string): LoginRequest => ({
  email: email.trim(),
  password,
});

export const superAdminLogin = (email: string, password: string) =>
  apiFetch<LoginResponse>("/api/hotel/auth/super-admin/login", {
    method: "POST",
    body: credentials(email, password),
    auth: false,
  });

export const adminLogin = (email: string, password: string) =>
  apiFetch<LoginResponse>("/api/hotel/auth/admin/login", {
    method: "POST",
    body: credentials(email, password),
    auth: false,
  });

export const staffLogin = (email: string, password: string) =>
  apiFetch<LoginResponse>("/api/hotel/auth/staff/login", {
    method: "POST",
    body: credentials(email, password),
    auth: false,
  });

/** POST /api/hotel/auth/admin/credentials. Password only; email stays the same. */
export const resetAdminPassword = (password: string) =>
  apiFetch<unknown>("/api/hotel/auth/admin/credentials", {
    method: "POST",
    body: { password },
  });

function isSuperAdminEmail(email: string): boolean {
  const local = email.trim().toLowerCase().split("@")[0] ?? "";
  return local.includes("superadmin");
}

/**
 * Super admin, hotel admin, and staff each have their own login route.
 * All of them return an access token and a refresh token.
 */
export async function signIn(
  email: string,
  password: string,
): Promise<LoginResponse> {
  if (isSuperAdminEmail(email)) return superAdminLogin(email, password);

  try {
    return await adminLogin(email, password);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      return staffLogin(email, password);
    }
    throw err;
  }
}

export function roleFromLogin(res: LoginResponse): Role {
  return (res.roles ?? []).includes("PLATFORM_ADMIN")
    ? "SuperAdmin"
    : "PropertyAdmin";
}
