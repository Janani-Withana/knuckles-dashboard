import type {
  InviteAdminRequest,
  InviteAdminResponse,
  RegisterAdminRequest,
  RegisterStaffRequest,
} from "../types/staff.types";
import { apiClient } from "./client";

export const usersApi = {
  inviteAdmin: async (
    data: InviteAdminRequest,
  ): Promise<InviteAdminResponse> => {
    const response = await apiClient.post<InviteAdminResponse>(
      "/api/hotel/auth/admin/invite",
      data,
    );
    return response.data;
  },

  /** Kept for the backend contract. The UI uses inviteAdmin, which creates or reuses the admin. */
  registerAdmin: async (data: RegisterAdminRequest) => {
    const response = await apiClient.post(
      "/api/hotel/auth/admin/register",
      data,
    );
    return response.data;
  },

  registerStaff: async (data: RegisterStaffRequest) => {
    const response = await apiClient.post(
      "/api/hotel/auth/staff/register",
      data,
    );
    return response.data;
  },
};
