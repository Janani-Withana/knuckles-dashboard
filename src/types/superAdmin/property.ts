export interface Property {
  uid: string;
  organizationUid: string;
  code: string;
  name: string;
  slug: string;
  propertyType: number;
  description: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  district: string;
  province: string;
  postalCode: string;
  countryCode: string;
  latitude: number | null;
  longitude: number | null;
  phone: string;
  email: string;
  timezone: string;
  defaultCurrency: string;
  status: number;
  isActive: boolean;
  creationDate: string;
}

/** Body for PUT /api/v1/properties/{propertyUid}. */
export interface UpdatePropertyPayload {
  name: string;
  propertyType: number;
  description: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  district: string;
  province: string;
  postalCode: string;
  countryCode: string;
  latitude: number | null;
  longitude: number | null;
  phone: string;
  email: string;
  timezone: string;
  defaultCurrency: string;
  status: number;
}

/** GET /api/v1/properties/{propertyUid}/settings */
export interface PropertySettings {
  propertyUid: string;
  checkInTime: string;
  checkOutTime: string;
  bookingNumberPrefix: string;
  invoiceNumberPrefix: string;
  taxRate: number;
  serviceChargeRate: number;
  allowOverbooking: boolean;
  extraSettings: Record<string, unknown>;
}

/** Body for PUT /api/v1/properties/{propertyUid}/settings */
export interface UpdatePropertySettingsPayload {
  checkInTime: string;
  checkOutTime: string;
  bookingNumberPrefix: string;
  invoiceNumberPrefix: string;
  taxRate: number;
  serviceChargeRate: number;
  allowOverbooking: boolean;
  extraSettings: Record<string, unknown>;
}

/** Body for POST /api/v1/organizations/{organizationUid}/properties */
export type CreatePropertyPayload = Omit<
  Property,
  | "uid"
  | "organizationUid"
  | "status"
  | "addressLine2"
  | "latitude"
  | "longitude"
  | "isActive"
  | "creationDate"
>;

// ASSUMED labels: confirm against the backend enums and adjust.
export const PROPERTY_TYPE_LABELS: Record<number, string> = {
  0: "Hotel",
  1: "Guest house",
  2: "Villa",
  3: "Apartment",
  4: "Hostel",
  5: "Homestay",
  6: "Resort",
  7: "Campsite",
  8: "Lodge",
  9: "Bungalow",
  10: "Other",
};

export const PROPERTY_STATUS_LABELS: Record<number, string> = {
  0: "Inactive",
  1: "Active",
};

const PROPERTY_TYPE_BY_NAME: Record<string, number> = {
  HOTEL: 0,
  GUESTHOUSE: 1,
  VILLA: 2,
  APARTMENT: 3,
  HOSTEL: 4,
  HOMESTAY: 5,
  RESORT: 6,
  CAMPSITE: 7,
  LODGE: 8,
  BUNGALOW: 9,
  OTHER: 10,
};

const PROPERTY_TYPE_API = ["HOTEL", "GUESTHOUSE", "VILLA", "APARTMENT", "HOSTEL", "HOMESTAY",
         'RESORT', 'CAMPSITE', 'LODGE', 'BUNGALOW', 'OTHER'] as const;

export const propertyTypeLabel = (n: number) =>
  PROPERTY_TYPE_LABELS[n] ?? `Type ${n}`;

export const propertyStatusLabel = (n: number) =>
  PROPERTY_STATUS_LABELS[n] ?? `Status ${n}`;

export function parsePropertyType(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const named =
      PROPERTY_TYPE_BY_NAME[value.trim().toUpperCase().replace(/[\s-]+/g, "_")];
    if (named !== undefined) return named;
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return numeric;
  }
  return 0;
}

export function parsePropertyStatus(status: unknown, isActive?: unknown): number {
  if (typeof status === "number" && Number.isFinite(status)) return status;
  if (typeof status === "string") {
    const key = status.trim().toUpperCase();
    if (key === "ACTIVE" || key === "1") return 1;
    if (key === "INACTIVE" || key === "0") return 0;
  }
  if (typeof isActive === "boolean") return isActive ? 1 : 0;
  return 0;
}

export const propertyTypeApi = (value: number) =>
  PROPERTY_TYPE_API[value] ?? "HOTEL";

export const propertyStatusApi = (value: number) =>
  value === 1 ? "ACTIVE" : "INACTIVE";