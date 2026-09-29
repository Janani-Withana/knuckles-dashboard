import { authApi } from "../api/auth.api";
import { useAuthStore } from "../store/auth.store";
import {
  isHotelAdmin,
  isPlatformAdmin,
  toAuthUser,
  type AuthUser,
  type LoginRequest,
} from "../types/auth.types";
import { ApiError } from "../utils/errors";
import { queryClient } from "../api/queryClient";

async function loginWithPassword(data: LoginRequest): Promise<AuthUser> {
  const email = data.email.trim();
  const payload = { email, password: data.password };
  const looksLikePlatform = email.toLowerCase().includes("super");

  const attempts = looksLikePlatform
    ? [authApi.superAdminLogin, authApi.hotelAdminLogin, authApi.staffLogin]
    : [authApi.hotelAdminLogin, authApi.staffLogin, authApi.superAdminLogin];

  let lastError: unknown;
  for (const attempt of attempts) {
    try {
      const res = await attempt(payload);
      const user = toAuthUser(res, email);
      if (attempt === authApi.superAdminLogin && user.roles.length === 0) {
        user.roles = ["PLATFORM_ADMIN"];
      }
      if (attempt === authApi.hotelAdminLogin && user.roles.length === 0) {
        user.roles = ["HOTEL_ADMIN"];
      }
      if (attempt === authApi.staffLogin && user.roles.length === 0) {
        user.roles = ["STAFF"];
      }
      useAuthStore
        .getState()
        .setSession(user, res.accessToken, res.refreshToken);
      return user;
    } catch (error) {
      lastError = error;
      if (error instanceof ApiError && (error.status === 401 || error.status === 403 || error.status === 400)) {
        continue;
      }
      throw error;
    }
  }

  throw lastError instanceof ApiError
    ? lastError
    : new ApiError("That email and password don't match.", 401);
}

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const mustChangePassword = useAuthStore((s) => s.mustChangePassword);
  const clearSession = useAuthStore((s) => s.clearSession);
  const setMustChangePassword = useAuthStore((s) => s.setMustChangePassword);

  const login = (email: string, password: string) =>
    loginWithPassword({ email, password });

  const logout = () => {
    clearSession();
    queryClient.clear();
  };

  const completePasswordChange = async (newPassword: string) => {
    await authApi.resetAdminPassword(newPassword);
    setMustChangePassword(false);
    logout();
  };

  return {
    user,
    isAuthenticated,
    mustChangePassword,
    login,
    logout,
    completePasswordChange,
    isPlatformAdmin: isPlatformAdmin(user),
    isHotelAdmin: isHotelAdmin(user),
  };
}
