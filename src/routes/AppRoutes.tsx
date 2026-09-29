import { Navigate, Route, Routes } from "react-router-dom";

import SignInScreen from "@/features/auth/pages/SignInScreen";
import ChangePasswordScreen from "@/features/auth/pages/ChangePasswordScreen";
import DashboardLayout from "@/components/layout/DashboardLayout";
import StaffDashboardScreen from "../features/staff/pages/StaffDashboardScreen";

import ProtectedRoute from "./ProtectedRoute";
import RequirePasswordChange from "./RequirePasswordChange";
import RoleRoute from "./RoleRoute";
import { platformRoutes } from "./platformRoutes";
import { propertyRoutes } from "./propertyRoutes";
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

      <Route element={<ProtectedRoute />}>
        <Route
          path="/platform"
          element={<RoleRoute allowedRoles={["PLATFORM_ADMIN"]} />}
        >
          <Route element={<DashboardLayout />}>{platformRoutes}</Route>
        </Route>

        <Route
          path="/property"
          element={<RoleRoute allowedRoles={["HOTEL_ADMIN", "MANAGER"]} />}
        >
          <Route element={<DashboardLayout />}>{propertyRoutes}</Route>
        </Route>

        <Route
          path="/staff"
          element={
            <RoleRoute
              allowedRoles={[
                "STAFF",
                "FRONT_DESK",
                "HOUSEKEEPING",
                "RESTAURANT",
                "BAR",
                "CASHIER",
              ]}
            />
          }
        >
          <Route element={<DashboardLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<StaffDashboardScreen />} />
          </Route>
        </Route>
      </Route>

      <Route
        path="/super-admin/*"
        element={<Navigate to={ROUTES.PLATFORM} replace />}
      />
      <Route
        path="/admin/*"
        element={<Navigate to={ROUTES.ADMIN_DASHBOARD} replace />}
      />
      <Route path="/" element={<Navigate to={ROUTES.LOGIN} replace />} />
      <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
    </Routes>
  );
}
