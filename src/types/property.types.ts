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
export type CreatePropertyRequest = Omit<
  Property,
  "uid" | "organizationUid" | "status"
>;

/** Matches the backend PropertyType enum from the HMS collection. */
export const PROPERTY_TYPE_LABELS: Record<number, string> = {
  0: "Hotel",
  1: "Guesthouse",
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

/** Matches the backend PropertyStatus enum from the HMS collection. */
export const PROPERTY_STATUS_LABELS: Record<number, string> = {
  0: "Draft",
  1: "Active",
  2: "Suspended",
  3: "Closed",
};

export const propertyTypeLabel = (n: number) =>
  PROPERTY_TYPE_LABELS[n] ?? `Type ${n}`;

export const propertyStatusLabel = (n: number) =>
  PROPERTY_STATUS_LABELS[n] ?? `Status ${n}`;

const typeByName = Object.fromEntries(
  Object.entries(PROPERTY_TYPE_LABELS).map(([key, label]) => [
    label.toLowerCase(),
    Number(key),
  ]),
);

const statusByName = Object.fromEntries(
  Object.entries(PROPERTY_STATUS_LABELS).map(([key, label]) => [
    label.toLowerCase(),
    Number(key),
  ]),
);

function parseEnum(
  value: unknown,
  byName: Record<string, number>,
  fallback = 0,
): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const named = byName[value.toLowerCase()];
    if (named !== undefined) return named;
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return numeric;
  }
  return fallback;
}

export const parsePropertyType = (value: unknown) =>
  parseEnum(value, typeByName, 0);

export const parsePropertyStatus = (value: unknown) =>
  parseEnum(value, statusByName, 0);
