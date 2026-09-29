import type { AuthUser } from "../types/auth.types";
import { isHotelAdmin, isPlatformAdmin } from "../types/auth.types";

export const ROUTES = {
  LOGIN: "/login",
  CHANGE_PASSWORD: "/change-password",

  PLATFORM: "/platform",
  SUPER_DASHBOARD: "/platform",
  SUPER_ORGANIZATIONS: "/platform/organizations",
  SUPER_ORGANIZATION_NEW: "/platform/organizations/new",
  SUPER_ORGANIZATION_DETAIL: "/platform/organizations/:organizationUid",
  SUPER_PROPERTY_NEW:
    "/platform/organizations/:organizationUid/properties/new",
  SUPER_PROPERTIES: "/platform/properties",
  SUPER_PROPERTY_DETAIL:
    "/platform/organizations/:organizationUid/properties/:propertyUid",
  SUPER_PROPERTY_BY_ID: "/platform/properties/:propertyUid",
  SUPER_PROPERTY_ADMINS: "/platform/admins",
  SUPER_CREATE_PROPERTY_ADMIN: "/platform/admins/invite",
  SUPER_BILLING: "/platform/billing",
  SUPER_SETTINGS: "/platform/settings",

  ADMIN_DASHBOARD: "/property/dashboard",
  ADMIN_PROPERTY_DETAILS: "/property/details",
  ADMIN_PROPERTY_SETTINGS: "/property/property-settings",
  ADMIN_ACCOMMODATION_TYPES: "/property/accommodation/types",
  ADMIN_ROOMS: "/property/accommodation/rooms",
  ADMIN_AVAILABILITY: "/property/accommodation/availability",
  ADMIN_MEAL_PLANS: "/property/accommodation/meal-plans",
  ADMIN_RATE_PLANS: "/property/accommodation/rate-plans",
  ADMIN_RESERVATIONS: "/property/reservations",
  ADMIN_RESERVATION_NEW: "/property/reservations/new",
  ADMIN_GUESTS: "/property/guests",
  ADMIN_FRONT_DESK: "/property/front-desk",
  ADMIN_FINANCE: "/property/finance",
  ADMIN_STAFF: "/property/staff",
  ADMIN_REPORTS: "/property/reports",
  ADMIN_SETTINGS: "/property/account",

  STAFF_DASHBOARD: "/staff/dashboard",
} as const;

export const homeRouteForUser = (user: AuthUser | null) => {
  if (isPlatformAdmin(user)) return ROUTES.PLATFORM;
  if (isHotelAdmin(user)) return ROUTES.ADMIN_DASHBOARD;
  return ROUTES.STAFF_DASHBOARD;
};

export const superOrganizationPath = (organizationUid: string) =>
  ROUTES.SUPER_ORGANIZATION_DETAIL.replace(":organizationUid", organizationUid);

export const superPropertyNewPath = (organizationUid: string) =>
  ROUTES.SUPER_PROPERTY_NEW.replace(":organizationUid", organizationUid);

export const superPropertyPath = (
  organizationUid: string,
  propertyUid: string,
) =>
  ROUTES.SUPER_PROPERTY_DETAIL.replace(
    ":organizationUid",
    organizationUid,
  ).replace(":propertyUid", propertyUid);

export const superPropertyByIdPath = (propertyUid: string) =>
  ROUTES.SUPER_PROPERTY_BY_ID.replace(":propertyUid", propertyUid);
