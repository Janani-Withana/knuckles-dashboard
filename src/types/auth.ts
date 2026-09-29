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
  staffUid?: string;
  expiresAtUtc?: string;
}

/** Body for POST /api/hotel/auth/super-admin/login */
export interface LoginRequest {
  email: string;
  password: string;
}

/** Response from POST /api/hotel/auth/super-admin/login */
export interface LoginResponse {
  staffUid: string;
  propertyUid: string;
  propertyUids: string[];
  email: string;
  fullName: string;
  roles: string[]; // e.g. ["PLATFORM_ADMIN"]
  accessToken: string;
  refreshToken?: string;
  expiresAtUtc: string;
}