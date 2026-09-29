export type UserRole =
  | "PLATFORM_ADMIN"
  | "HOTEL_ADMIN"
  | "MANAGER"
  | "STAFF"
  | "FRONT_DESK"
  | "HOUSEKEEPING"
  | "RESTAURANT"
  | "BAR"
  | "CASHIER";

const USER_ROLES = new Set<string>([
  "PLATFORM_ADMIN",
  "HOTEL_ADMIN",
  "MANAGER",
  "STAFF",
  "FRONT_DESK",
  "HOUSEKEEPING",
  "RESTAURANT",
  "BAR",
  "CASHIER",
]);

export const isUserRole = (value: string): value is UserRole =>
  USER_ROLES.has(value);

export interface AuthUser {
  staffUid: string;
  email: string;
  fullName: string;
  roles: UserRole[];
  propertyUid?: string;
  propertyUids?: string[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  staffUid: string;
  email: string;
  fullName: string;
  roles: string[];
  accessToken: string;
  refreshToken?: string;
  expiresAtUtc?: string;
  propertyUid?: string;
  propertyUids?: string[];
}

export interface SignInFormData {
  email: string;
  password: string;
}

export interface ChangePasswordFormData {
  newPassword: string;
  confirmPassword: string;
}

export interface SignUpFormData {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

export const EMPTY_GUID = "00000000-0000-0000-0000-000000000000";

export const isEmptyGuid = (value?: string) =>
  !value || value === EMPTY_GUID;

export function toAuthUser(
  res: LoginResponse,
  fallbackEmail: string,
): AuthUser {
  const roles = (res.roles ?? [])
    .map((role) => role.toUpperCase())
    .filter(isUserRole);

  return {
    staffUid: res.staffUid ?? "",
    email: res.email || fallbackEmail,
    fullName: res.fullName ?? "",
    roles,
    propertyUid: isEmptyGuid(res.propertyUid) ? undefined : res.propertyUid,
    propertyUids: res.propertyUids,
  };
}

export function hasRole(user: AuthUser | null, role: UserRole): boolean {
  return Boolean(user?.roles.includes(role));
}

export function isPlatformAdmin(user: AuthUser | null): boolean {
  return hasRole(user, "PLATFORM_ADMIN");
}

export function isHotelAdmin(user: AuthUser | null): boolean {
  return hasRole(user, "HOTEL_ADMIN") || hasRole(user, "MANAGER");
}
