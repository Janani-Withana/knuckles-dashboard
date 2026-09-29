import { Routes, Route, Navigate } from "react-router-dom";

import ProtectedRoute from "../components/routing/ProtectedRoute";
import RequirePasswordChange from "../components/routing/RequirePasswordChange";
import DashboardLayout from "../components/layout/DashboardLayout";

import SignInScreen from "../screens/Auth/SignInScreen";
import ChangePasswordScreen from "../screens/Auth/ChangePasswordScreen";

import { adminRoutes } from "./adminRoutes";
import { superAdminRoutes } from "./superAdminRoutes";
import { ROUTES } from "./paths";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path={ROUTES.LOGIN} element={<SignInScreen />} />

      <Route element={<RequirePasswordChange />}>
        <Route
          path={ROUTES.CHANGE_PASSWORD}
          element={<ChangePasswordScreen />}
        />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["PropertyAdmin"]} />}>
        <Route element={<DashboardLayout />}>{adminRoutes}</Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["SuperAdmin"]} />}>
        <Route element={<DashboardLayout />}>{superAdminRoutes}</Route>
      </Route>

      <Route path="/" element={<Navigate to={ROUTES.LOGIN} replace />} />
      <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
    </Routes>
  );
}
