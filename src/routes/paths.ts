export const ROUTES = {
  LOGIN: "/login",
  ADMIN_LOGIN: "/admin/login",
  CHANGE_PASSWORD: "/change-password",

  ADMIN_DASHBOARD: "/admin/dashboard",
  ADMIN_PROFILE: "/admin/profile",
  ADMIN_PROPERTY_DETAILS: "/admin/property/details",
  ADMIN_PROPERTY_SETTINGS: "/admin/property/settings",
  ADMIN_ACCOMMODATION_TYPES: "/admin/accommodation/types",
  ADMIN_ROOMS: "/admin/accommodation/rooms",
  ADMIN_AVAILABILITY: "/admin/accommodation/availability",
  ADMIN_MEAL_PLANS: "/admin/accommodation/meal-plans",
  ADMIN_RATE_PLANS: "/admin/accommodation/rate-plans",
  ADMIN_RESERVATIONS: "/admin/reservations",
  ADMIN_RESERVATION_NEW: "/admin/reservations/new",
  ADMIN_RESERVATION_DETAIL: "/admin/reservations/:bookingUid",
  ADMIN_GUESTS: "/admin/guests",
  ADMIN_FRONT_DESK: "/admin/front-desk",
  ADMIN_FINANCE: "/admin/finance",
  ADMIN_FINANCE_EXPENSES: "/admin/finance/expenses",
  ADMIN_FINANCE_EXPENSE_DETAIL: "/admin/finance/expenses/:expenseUid",
  ADMIN_FINANCE_PAYMENTS: "/admin/finance/payments",
  ADMIN_FINANCE_PAYMENTS_DETAIL: "/admin/finance/payments/:bookingUid",
  ADMIN_STAFF: "/admin/staff",
  ADMIN_STAFF_ROLES: "/admin/staff/roles",
  ADMIN_STAFF_NEW: "/admin/staff/new",
  ADMIN_STAFF_DETAIL: "/admin/staff/:staffUid",
  ADMIN_FINANCE_UTILITIES: "/admin/finance/utilities",
  ADMIN_FINANCE_UTILITY_TYPES: "/admin/finance/utilities/types",
  ADMIN_FINANCE_UTILITY_BILL: "/admin/finance/utilities/:utilityBillUid",
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

export const adminReservationPath = (bookingUid: string) =>
  ROUTES.ADMIN_RESERVATION_DETAIL.replace(":bookingUid", bookingUid);

export const adminExpensePath = (expenseUid: string) =>
  ROUTES.ADMIN_FINANCE_EXPENSE_DETAIL.replace(":expenseUid", expenseUid);

export const adminStaffPath = (staffUid: string) =>
  ROUTES.ADMIN_STAFF_DETAIL.replace(":staffUid", staffUid);
export const adminUtilityBillPath = (utilityBillUid: string) =>
  ROUTES.ADMIN_FINANCE_UTILITY_BILL.replace(":utilityBillUid", utilityBillUid);

export const adminBookingPaymentsPath = (bookingUid: string) =>
  ROUTES.ADMIN_FINANCE_PAYMENTS_DETAIL.replace(":bookingUid", bookingUid);