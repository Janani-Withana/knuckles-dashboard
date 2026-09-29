export type Role = "SuperAdmin" | "PropertyAdmin";

export interface SignInFormData {
  email: string;
  password: string;
}

export interface ChangePasswordFormData {
  newPassword: string;
  confirmPassword: string;
}

export interface AuthUser {
  email: string;
  fullName?: string;
  role: Role;
  /** API role names, e.g. ["HOTEL_ADMIN"]. */
  roles: string[];
  staffUid?: string;
  propertyUid?: string;
  propertyUids: string[];
  expiresAtUtc?: string;
  refreshTokenExpiresAtUtc?: string;
}

/** Body for super-admin, admin, and staff login. */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Shared by super-admin, hotel admin, and staff login, and by
 * POST /api/hotel/auth/refresh-token.
 */
export interface LoginResponse {
  staffUid: string;
  propertyUid: string;
  propertyUids: string[];
  email: string;
  fullName: string;
  roles: string[]; // e.g. ["PLATFORM_ADMIN"], ["HOTEL_ADMIN"]
  accessToken: string;
  refreshToken?: string;
  expiresAtUtc: string;
  refreshTokenExpiresAtUtc?: string;
}

/** Body for POST /api/hotel/auth/refresh-token. Same call for every role. */
export interface RefreshSessionRequest {
  refreshToken: string;
}