import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { homeRouteForUser, ROUTES } from "@/routes/paths";
import type { UserRole } from "@/types/auth.types";

interface RoleRouteProps {
  allowedRoles: UserRole[];
}

export default function RoleRoute({ allowedRoles }: RoleRouteProps) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }
  if (!user.roles.some((role) => allowedRoles.includes(role))) {
    return <Navigate to={homeRouteForUser(user)} replace />;
  }
  return <Outlet />;
}
