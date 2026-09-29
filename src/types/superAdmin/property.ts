export interface Property {
  uid: string;
  organizationUid: string;
  code: string;
  name: string;
  slug: string;
  propertyType: number;
  description: string;
  addressLine1: string;
  city: string;
  district: string;
  province: string;
  postalCode: string;
  countryCode: string;
  phone: string;
  email: string;
  timezone: string;
  defaultCurrency: string;
  status: number;
}

/** Body for POST /api/v1/organizations/{organizationUid}/properties */
export type CreatePropertyPayload = Omit<
  Property,
  "uid" | "organizationUid" | "status"
>;

// ASSUMED labels: confirm against the backend enums and adjust.
export const PROPERTY_TYPE_LABELS: Record<number, string> = {
  0: "Hotel",
  1: "Resort",
  2: "Villa",
  3: "Guest house",
};

export const PROPERTY_STATUS_LABELS: Record<number, string> = {
  0: "Inactive",
  1: "Active",
};

export const propertyTypeLabel = (n: number) =>
  PROPERTY_TYPE_LABELS[n] ?? `Type ${n}`;

export const propertyStatusLabel = (n: number) =>
  PROPERTY_STATUS_LABELS[n] ?? `Status ${n}`;