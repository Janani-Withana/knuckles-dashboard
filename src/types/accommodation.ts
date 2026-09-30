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
  return parseCoded(value, UNIT_KIND_BY_NAME, 0);
}

export interface AccommodationUnit {
  uid: string;
  propertyUid: string;
  accommodationTypeUid: string;
  unitCode: string;
  unitName: string;
  floorOrArea: string;
  status: number;
  housekeepingStatus: number;
  notes: string;
  isActive: boolean;
}

/** Body for POST /api/v1/properties/{propertyUid}/units */
export interface CreateAccommodationUnitPayload {
  accommodationTypeUid: string;
  unitCode: string;
  unitName: string | null;
  floorOrArea: string | null;
  status: number;
  housekeepingStatus: number;
  notes: string | null;
}

/** Body for PUT /api/v1/units/{unitUid} */
export interface UpdateAccommodationUnitPayload extends CreateAccommodationUnitPayload {
  isActive: boolean;
}

export interface UnitBlock {
  uid: string;
  unitUid: string;
  propertyUid: string;
  startDate: string;
  endDate: string;
  blockType: number;
  reason: string;
  isActive: boolean;
}

/** Body for POST /api/v1/units/{unitUid}/blocks */
export interface CreateUnitBlockPayload {
  startDate: string;
  endDate: string;
  blockType: number;
  reason: string | null;
}

/** AccommodationUnitStatus. The API returns the name; create and update send the number. */
export const UNIT_STATUS_LABELS: Record<number, string> = {
  0: "Available",
  1: "Occupied",
  2: "Out of service",
  3: "Maintenance",
  4: "Inactive",
};

const UNIT_STATUS_BY_NAME: Record<string, number> = {
  AVAILABLE: 0,
  OCCUPIED: 1,
  OUT_OF_SERVICE: 2,
  OUTOFSERVICE: 2,
  MAINTENANCE: 3,
  INACTIVE: 4,
};

/** HousekeepingStatus. */
export const HOUSEKEEPING_STATUS_LABELS: Record<number, string> = {
  0: "Clean",
  1: "Dirty",
  2: "Inspected",
  3: "In progress",
  4: "Not applicable",
};

const HOUSEKEEPING_STATUS_BY_NAME: Record<string, number> = {
  CLEAN: 0,
  DIRTY: 1,
  INSPECTED: 2,
  IN_PROGRESS: 3,
  INPROGRESS: 3,
  NOT_APPLICABLE: 4,
  NOTAPPLICABLE: 4,
};

/** UnitBlockType. Other plus a free-text reason covers any block. */
export const BLOCK_TYPE_LABELS: Record<number, string> = {
  0: "Maintenance",
  1: "Owner use",
  2: "Closed",
  3: "Other",
};

const BLOCK_TYPE_BY_NAME: Record<string, number> = {
  MAINTENANCE: 0,
  OWNER_USE: 1,
  OWNERUSE: 1,
  CLOSED: 2,
  OTHER: 3,
};

export const unitStatusLabel = (value: number) =>
  UNIT_STATUS_LABELS[value] ?? `Status ${value}`;

export const housekeepingStatusLabel = (value: number) =>
  HOUSEKEEPING_STATUS_LABELS[value] ?? `Housekeeping ${value}`;

export const blockTypeLabel = (value: number) =>
  BLOCK_TYPE_LABELS[value] ?? `Block ${value}`;

export const parseUnitStatus = (value: unknown) =>
  parseCoded(value, UNIT_STATUS_BY_NAME, 0);

export const parseHousekeepingStatus = (value: unknown) =>
  parseCoded(value, HOUSEKEEPING_STATUS_BY_NAME, 0);

export const parseBlockType = (value: unknown) =>
  parseCoded(value, BLOCK_TYPE_BY_NAME, 0);

export interface MealPlan {
  uid: string;
  propertyUid: string;
  code: string;
  name: string;
  description: string;
  includesBreakfast: boolean;
  includesLunch: boolean;
  includesDinner: boolean;
  allowByo: boolean;
  isActive: boolean;
}

/** Body for POST /api/v1/properties/{propertyUid}/meal-plans */
export interface CreateMealPlanPayload {
  code: string;
  name: string;
  description: string | null;
  includesBreakfast: boolean;
  includesLunch: boolean;
  includesDinner: boolean;
  allowByo: boolean;
}

/** Body for PUT /api/v1/properties/{propertyUid}/meal-plans/{mealPlanUid} */
export type UpdateMealPlanPayload = CreateMealPlanPayload;

export interface RatePlan {
  uid: string;
  propertyUid: string;
  accommodationTypeUid: string;
  mealPlanUid: string;
  code: string;
  name: string;
  pricingBasis: number;
  currency: string;
  description: string;
  isRefundable: boolean;
  isActive: boolean;
}

/** Body for POST /api/v1/properties/{propertyUid}/rate-plans */
export interface CreateRatePlanPayload {
  accommodationTypeUid: string;
  mealPlanUid: string | null;
  code: string;
  name: string;
  pricingBasis: number;
  currency: string;
  description: string | null;
  isRefundable: boolean;
}

/** Body for PUT /api/v1/rate-plans/{ratePlanUid}. Type and meal plan are not changed. */
export interface UpdateRatePlanPayload {
  code: string;
  name: string;
  pricingBasis: number;
  currency: string;
  description: string | null;
  isRefundable: boolean;
}

export interface RatePlanPrice {
  uid: string;
  ratePlanUid: string;
  propertyUid: string;
  startDate: string;
  endDate: string;
  dayOfWeek: number | null;
  adultRate: number | null;
  childRate: number | null;
  unitRate: number;
  minimumStay: number;
  isActive: boolean;
}

/** Body for POST /api/v1/rate-plans/{ratePlanUid}/prices */
export interface CreateRatePlanPricePayload {
  startDate: string;
  endDate: string;
  unitRate: number;
  dayOfWeek: number | null;
  adultRate: number | null;
  childRate: number | null;
  minimumStay: number;
}

/** PricingBasis. The API returns the name; create sends the number. */
export const PRICING_BASIS_LABELS: Record<number, string> = {
  0: "Per room / night",
  1: "Per person / night",
  2: "Per bed / night",
  3: "Flat per stay",
};

const PRICING_BASIS_BY_NAME: Record<string, number> = {
  PER_ROOM_PER_NIGHT: 0,
  PERROOMPERNIGHT: 0,
  PER_PERSON_PER_NIGHT: 1,
  PERPERSONPERNIGHT: 1,
  PER_BED_PER_NIGHT: 2,
  PERBEDPERNIGHT: 2,
  FLAT_PER_STAY: 3,
  FLATPERSTAY: 3,
};

export const pricingBasisLabel = (value: number) =>
  PRICING_BASIS_LABELS[value] ?? `Basis ${value}`;

export const parsePricingBasis = (value: unknown) =>
  parseCoded(value, PRICING_BASIS_BY_NAME, 0);

/** dayOfWeek: Sunday = 0 through Saturday = 6. Null means every day. */
export const DAY_OF_WEEK_LABELS: Record<number, string> = {
  0: "Sunday",
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
};

export const dayOfWeekLabel = (value: number | null) =>
  value === null ? "Every day" : DAY_OF_WEEK_LABELS[value] ?? `Day ${value}`;

function parseCoded(
  value: unknown,
  byName: Record<string, number>,
  fallback: number,
): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const key = value.trim().toUpperCase().replace(/[\s-]+/g, "_");
    if (byName[key] !== undefined) return byName[key];
    const compact = key.replace(/_/g, "");
    if (byName[compact] !== undefined) return byName[compact];
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return numeric;
  }
  return fallback;
}

