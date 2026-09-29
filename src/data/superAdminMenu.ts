import { LayoutDashboard, Landmark, Building2, UserPlus, CreditCard, Settings } from "lucide-react";
import type { MenuItem } from "../types/dashboard";
import { ROUTES } from "../routes/paths";

export const superAdminMenuItems: MenuItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, path: ROUTES.SUPER_DASHBOARD },
  { label: "Organizations", icon: Landmark, path: ROUTES.SUPER_ORGANIZATIONS },
  { label: "Properties", icon: Building2, path: ROUTES.SUPER_PROPERTIES },
  {
    label: "Property Admins", icon: UserPlus,
    children: [
      { label: "All Admins", path: ROUTES.SUPER_PROPERTY_ADMINS },
      { label: "Create Admin", path: ROUTES.SUPER_CREATE_PROPERTY_ADMIN },
    ],
  },
  { label: "Billing", icon: CreditCard, path: ROUTES.SUPER_BILLING },
  { label: "Settings", icon: Settings, path: ROUTES.SUPER_SETTINGS },
];