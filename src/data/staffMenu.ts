import { LayoutDashboard } from "lucide-react";
import type { MenuItem } from "../types/dashboard";
import { ROUTES } from "../routes/paths";

export const staffMenuItems: MenuItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, path: ROUTES.STAFF_DASHBOARD },
];
