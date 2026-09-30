import { apiFetch } from "../../lib/api";
import type {
  InvitePropertyAdminPayload,
  PropertyAdminResult,
  RegisterPropertyAdminPayload,
} from "../../types/propertyAdmin";

export const invitePropertyAdmin = (payload: InvitePropertyAdminPayload) =>
  apiFetch<PropertyAdminResult>("/api/hotel/auth/admin/invite", {
    method: "POST",
    body: payload,
  });

export const registerPropertyAdmin = (payload: RegisterPropertyAdminPayload) =>
  apiFetch<PropertyAdminResult>("/api/hotel/auth/admin/register", {
    method: "POST",
    body: payload,
  });