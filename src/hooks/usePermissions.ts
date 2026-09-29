import { useAuthStore } from "../store/auth.store";
import type { UserRole } from "../types/auth.types";
import {
  roleHasPermission,
  type Permission,
} from "../utils/permissions";

export function usePermissions() {
  const user = useAuthStore((s) => s.user);

  const can = (permission: Permission) =>
    Boolean(user?.roles.some((role) => roleHasPermission(role, permission)));

  const hasRole = (role: UserRole) => Boolean(user?.roles.includes(role));

  return { can, hasRole, roles: user?.roles ?? [] };
}
