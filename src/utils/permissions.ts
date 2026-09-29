import type { UserRole } from "../types/auth.types";

export const permissions = {
  PLATFORM_ADMIN: [
    "organization.read",
    "organization.create",
    "property.read",
    "property.create",
    "admin.create",
    "admin.invite",
  ],
  HOTEL_ADMIN: ["property.read", "staff.read", "staff.create"],
  MANAGER: ["property.read", "staff.read", "staff.create"],
  STAFF: ["property.read"],
  FRONT_DESK: ["property.read"],
  HOUSEKEEPING: ["property.read"],
  RESTAURANT: ["property.read"],
  BAR: ["property.read"],
  CASHIER: ["property.read"],
} as const;

export type Permission = (typeof permissions)[UserRole][number];

export function roleHasPermission(
  role: UserRole,
  permission: Permission,
): boolean {
  const list = permissions[role] as readonly string[] | undefined;
  return Boolean(list?.includes(permission));
}
