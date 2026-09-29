import type { LoginRequest, LoginResponse } from "../types/auth.types";
import { apiClient } from "./client";

export const authApi = {
  superAdminLogin: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>(
      "/api/hotel/auth/super-admin/login",
      data,
      { skipAuth: true },
    );
    return response.data;
  },

  hotelAdminLogin: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>(
      "/api/hotel/auth/admin/login",
      data,
      { skipAuth: true },
    );
    return response.data;
  },

  staffLogin: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>(
      "/api/hotel/auth/staff/login",
      data,
      { skipAuth: true },
    );
    return response.data;
  },

  refreshToken: async (refreshToken: string): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>(
      "/api/hotel/auth/refresh-token",
      { refreshToken },
      { skipAuth: true },
    );
    return response.data;
  },

  resetAdminPassword: async (password: string) => {
    const response = await apiClient.post("/api/hotel/auth/admin/credentials", {
      password,
    });
    return response.data;
  },
};
