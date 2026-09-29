import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ROUTES, homeRouteForRole } from "../../routes/paths";
import type { Role } from "../../types/auth";

interface ProtectedRouteProps {
  allowedRoles?: Role[];
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated, mustChangePassword } = useAuth();

  if (!isAuthenticated || !user) {
    const signInPath =
      allowedRoles?.includes("PropertyAdmin") &&
      !allowedRoles.includes("SuperAdmin")
        ? ROUTES.ADMIN_LOGIN
        : ROUTES.LOGIN;
    return <Navigate to={signInPath} replace />;
  }
  if (mustChangePassword) {
    return <Navigate to={ROUTES.CHANGE_PASSWORD} replace />;
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={homeRouteForRole(user.role)} replace />;
  }
  return <Outlet />;
}
