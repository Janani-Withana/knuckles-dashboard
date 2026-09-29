export interface AccommodationType {
  uid: string;
  propertyUid: string;
  code: string;
  name: string;
  unitKind: number;
  description: string;
  maxAdults: number;
  maxChildren: number;
  maxOccupancy: number;
  defaultQuantity: number;
  baseRate: number;
  sortOrder: number;
  isActive: boolean;
}

/** Body for POST /api/v1/properties/{propertyUid}/accommodation-types */
export interface CreateAccommodationTypePayload {
  code: string;
  name: string;
  unitKind: number;
  description: string;
  maxAdults: number;
  maxChildren: number;
  maxOccupancy: number;
  defaultQuantity: number;
  baseRate: number;
  sortOrder: number;
}

/** Body for PUT /api/v1/accommodation-types/{accommodationTypeUid} */
export interface UpdateAccommodationTypePayload extends CreateAccommodationTypePayload {
  isActive: boolean;
}

export const UNIT_KIND_LABELS: Record<number, string> = {
  0: "Room",
  1: "Villa",
  2: "Apartment",
  3: "Cabin",
  4: "Tent",
  5: "Dorm bed",
  6: "Cottage",
  7: "Entire property",
  8: "Other",
};

const UNIT_KIND_BY_NAME: Record<string, number> = {
  ROOM: 0,
  VILLA: 1,
  APARTMENT: 2,
  CABIN: 3,
  TENT: 4,
  DORMBED: 5,
  DORM_BED: 5,
  COTTAGE: 6,
  ENTIREPROPERTY: 7,
  ENTIRE_PROPERTY: 7,
  OTHER: 8,
};

export const unitKindLabel = (value: number) =>
  UNIT_KIND_LABELS[value] ?? `Kind ${value}`;

export function parseUnitKind(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const key = value.trim().toUpperCase().replace(/[\s-]+/g, "_");
    if (UNIT_KIND_BY_NAME[key] !== undefined) return UNIT_KIND_BY_NAME[key];
    const compact = key.replace(/_/g, "");
    if (UNIT_KIND_BY_NAME[compact] !== undefined) return UNIT_KIND_BY_NAME[compact];
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return numeric;
  }
  return 0;
}
