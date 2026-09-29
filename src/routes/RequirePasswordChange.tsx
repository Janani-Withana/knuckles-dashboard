import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { homeRouteForUser, ROUTES } from "@/routes/paths";

export default function RequirePasswordChange() {
  const { user, isAuthenticated, mustChangePassword } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }
  if (!mustChangePassword) {
    return <Navigate to={homeRouteForUser(user)} replace />;
  }
  return <Outlet />;
}
