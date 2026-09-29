export const ROUTES = {
  LOGIN: "/login",
  CHANGE_PASSWORD: "/change-password",

  ADMIN_DASHBOARD: "/admin/dashboard",
  ADMIN_PROPERTY_DETAILS: "/admin/property/details",
  ADMIN_PROPERTY_SETTINGS: "/admin/property/settings",
  ADMIN_ACCOMMODATION_TYPES: "/admin/accommodation/types",
  ADMIN_ROOMS: "/admin/accommodation/rooms",
  ADMIN_AVAILABILITY: "/admin/accommodation/availability",
  ADMIN_MEAL_PLANS: "/admin/accommodation/meal-plans",
  ADMIN_RATE_PLANS: "/admin/accommodation/rate-plans",
  ADMIN_RESERVATIONS: "/admin/reservations",
  ADMIN_RESERVATION_NEW: "/admin/reservations/new",
  ADMIN_GUESTS: "/admin/guests",
  ADMIN_FRONT_DESK: "/admin/front-desk",
  ADMIN_FINANCE: "/admin/finance",
  ADMIN_STAFF: "/admin/staff",
  ADMIN_REPORTS: "/admin/reports",
  ADMIN_SETTINGS: "/admin/settings",

  SUPER_DASHBOARD: "/super-admin/dashboard",
  SUPER_ORGANIZATIONS: "/super-admin/organizations",
  SUPER_ORGANIZATION_NEW: "/super-admin/organizations/new",
  SUPER_ORGANIZATION_DETAIL: "/super-admin/organizations/:organizationUid",
  SUPER_PROPERTY_NEW: "/super-admin/organizations/:organizationUid/properties/new",
  SUPER_PROPERTIES: "/super-admin/properties",
  SUPER_PROPERTY_DETAIL: "/super-admin/properties/:propertyId",
  SUPER_PROPERTY_ADMINS: "/super-admin/property-admins",
  SUPER_CREATE_PROPERTY_ADMIN: "/super-admin/property-admins/create",
  SUPER_BILLING: "/super-admin/billing",
  SUPER_SETTINGS: "/super-admin/settings",
} as const;

export const homeRouteForRole = (role: "SuperAdmin" | "PropertyAdmin") =>
  role === "SuperAdmin" ? ROUTES.SUPER_DASHBOARD : ROUTES.ADMIN_DASHBOARD;

export const superOrganizationPath = (organizationUid: string) =>
  ROUTES.SUPER_ORGANIZATION_DETAIL.replace(":organizationUid", organizationUid);

export const superPropertyNewPath = (organizationUid: string) =>
  ROUTES.SUPER_PROPERTY_NEW.replace(":organizationUid", organizationUid);

export const superPropertyPath = (propertyUid: string) =>
  ROUTES.SUPER_PROPERTY_DETAIL.replace(":propertyId", propertyUid);