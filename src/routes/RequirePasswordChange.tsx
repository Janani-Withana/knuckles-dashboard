import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ROUTES, homeRouteForRole } from "../../routes/paths";

export default function RequirePasswordChange() {
  const { user, isAuthenticated, mustChangePassword } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }
  if (!mustChangePassword) {
    return <Navigate to={homeRouteForRole(user.role)} replace />;
  }
  return <Outlet />;
}
