import {
  LayoutDashboard, Building2, BedDouble, CalendarDays, Users,
  // BriefcaseBusiness,
  CircleDollarSign, UserRoundCog, BarChart3, Settings,

} from "lucide-react";
import type { MenuItem } from "../types/dashboard";
import { ROUTES } from "../routes/paths";

export const adminMenuItems: MenuItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, path: ROUTES.ADMIN_DASHBOARD },
  {
    label: "Property", icon: Building2,
    children: [
      { label: "Property Details", path: ROUTES.ADMIN_PROPERTY_DETAILS },
      { label: "Property Settings", path: ROUTES.ADMIN_PROPERTY_SETTINGS },
    ],
  },
  {
    label: "Accommodation", icon: BedDouble,
    children: [
      { label: "Accommodation Types", path: ROUTES.ADMIN_ACCOMMODATION_TYPES },
      { label: "Rooms / Units", path: ROUTES.ADMIN_ROOMS },
      { label: "Availability", path: ROUTES.ADMIN_AVAILABILITY },
      { label: "Meal Plans", path: ROUTES.ADMIN_MEAL_PLANS },
      { label: "Rate Plans & Pricing", path: ROUTES.ADMIN_RATE_PLANS },
    ],
  },
  { label: "Reservations", icon: CalendarDays, path: ROUTES.ADMIN_RESERVATIONS },
  { label: "Guests", icon: Users, path: ROUTES.ADMIN_GUESTS },
  // { label: "Front Desk", icon: BriefcaseBusiness, path: ROUTES.ADMIN_FRONT_DESK },
  {
    label: "Finance", icon: CircleDollarSign,
    children: [
      { label: "Expenses", path: ROUTES.ADMIN_FINANCE_EXPENSES },
      { label: "Utilities", path: ROUTES.ADMIN_FINANCE_UTILITIES },
    ],
  },
  { label: "Staff", icon: UserRoundCog, path: ROUTES.ADMIN_STAFF },
  { label: "Reports", icon: BarChart3, path: ROUTES.ADMIN_REPORTS },
  { label: "Settings", icon: Settings, path: ROUTES.ADMIN_SETTINGS },
];