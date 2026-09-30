import { apiFetch } from "../lib/api";
import {
  asRecord,
  pickCreatedUid,
  pickList,
  pickUid,
  str,
  type Raw,
} from "../lib/normalize";
import {
  parseBlockType,
  parseHousekeepingStatus,
  parsePricingBasis,
  parseUnitKind,
  parseUnitStatus,
  type AccommodationType,
  type AccommodationUnit,
  type CreateAccommodationTypePayload,
  type CreateAccommodationUnitPayload,
  type CreateMealPlanPayload,
  type CreateRatePlanPayload,
  type CreateRatePlanPricePayload,
  type UpdateRatePlanPayload,
  type CreateUnitBlockPayload,
  type MealPlan,
  type RatePlan,
  type RatePlanPrice,
  type UnitBlock,
  type UpdateAccommodationTypePayload,
  type UpdateAccommodationUnitPayload,
  type UpdateMealPlanPayload,
} from "../types/accommodation";

const num = (value: unknown, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

export const toAccommodationType = (
  raw: Raw,
  fallbackPropertyUid = "",
): AccommodationType => ({
  uid: pickUid(raw, ["accommodationTypeUid"]),
  propertyUid: str(raw.propertyUid, fallbackPropertyUid),
  code: str(raw.code),
  name: str(raw.name),
  unitKind: parseUnitKind(raw.unitKind),
  description: str(raw.description),
  maxAdults: num(raw.maxAdults),
  maxChildren: num(raw.maxChildren),
  maxOccupancy: num(raw.maxOccupancy),
  defaultQuantity: num(raw.defaultQuantity),
  baseRate: num(raw.baseRate),
  sortOrder: num(raw.sortOrder),
  isActive: raw.isActive !== false,
});

const unwrap = (data: unknown, nestedKey: string): Raw => {
  const raw = asRecord(data);
  if (raw[nestedKey]) return asRecord(raw[nestedKey]);
  if (raw.data) return asRecord(raw.data);
  return raw;
};

const pickTypes = (data: unknown): Raw[] => {
  const list = pickList(data);
  if (list.length) return list;
  const raw = asRecord(data);
  for (const key of ["accommodationTypes", "types"]) {
    if (Array.isArray(raw[key])) return raw[key].map(asRecord);
  }
  return [];
};

/** GET /api/v1/properties/{propertyUid}/accommodation-types */
export async function listAccommodationTypes(
  propertyUid: string,
): Promise<AccommodationType[]> {
  const data = await apiFetch<unknown>(
    `/api/v1/properties/${propertyUid}/accommodation-types`,
  );
  return pickTypes(data).map((raw) => toAccommodationType(raw, propertyUid));
}

/** GET /api/v1/accommodation-types/{accommodationTypeUid} */
export async function getAccommodationType(
  accommodationTypeUid: string,
): Promise<AccommodationType> {
  const data = await apiFetch<unknown>(
    `/api/v1/accommodation-types/${accommodationTypeUid}`,
  );
  const type = toAccommodationType(unwrap(data, "accommodationType"));
  return { ...type, uid: type.uid || accommodationTypeUid };
}

/** POST /api/v1/properties/{propertyUid}/accommodation-types */
export async function createAccommodationType(
  propertyUid: string,
  payload: CreateAccommodationTypePayload,
): Promise<string> {
  const data = await apiFetch<unknown>(
    `/api/v1/properties/${propertyUid}/accommodation-types`,
    { method: "POST", body: payload },
  );
  return pickCreatedUid(data, ["accommodationTypeUid"]);
}

/** PUT /api/v1/accommodation-types/{accommodationTypeUid} */
export async function updateAccommodationType(
  accommodationTypeUid: string,
  payload: UpdateAccommodationTypePayload,
): Promise<void> {
  await apiFetch(`/api/v1/accommodation-types/${accommodationTypeUid}`, {
    method: "PUT",
    body: payload,
  });
}

/** DELETE /api/v1/accommodation-types/{accommodationTypeUid}. Soft-archives. */
export async function deleteAccommodationType(
  accommodationTypeUid: string,
): Promise<void> {
  await apiFetch(`/api/v1/accommodation-types/${accommodationTypeUid}`, {
    method: "DELETE",
  });
}

const blank = (value: unknown) => {
  const text = str(value).trim();
  return text || null;
};

export const toAccommodationUnit = (
  raw: Raw,
  fallbackPropertyUid = "",
): AccommodationUnit => ({
  uid: pickUid(raw, ["unitUid"]),
  propertyUid: str(raw.propertyUid, fallbackPropertyUid),
  accommodationTypeUid: str(raw.accommodationTypeUid),
  unitCode: str(raw.unitCode),
  unitName: str(raw.unitName),
  floorOrArea: str(raw.floorOrArea),
  status: parseUnitStatus(raw.status),
  housekeepingStatus: parseHousekeepingStatus(raw.housekeepingStatus),
  notes: str(raw.notes),
  isActive: raw.isActive !== false,
});

export const toUnitBlock = (raw: Raw, fallbackUnitUid = ""): UnitBlock => ({
  uid: pickUid(raw, ["unitBlockUid"]),
  unitUid: str(raw.unitUid, fallbackUnitUid),
  propertyUid: str(raw.propertyUid),
  startDate: str(raw.startDate).slice(0, 10),
  endDate: str(raw.endDate).slice(0, 10),
  blockType: parseBlockType(raw.blockType),
  reason: str(raw.reason),
  isActive: raw.isActive !== false,
});

const pickUnits = (data: unknown): Raw[] => {
  const list = pickList(data);
  if (list.length) return list;
  const raw = asRecord(data);
  if (Array.isArray(raw.units)) return raw.units.map(asRecord);
  return [];
};

/** GET /api/v1/properties/{propertyUid}/units */
export async function listAccommodationUnits(
  propertyUid: string,
): Promise<AccommodationUnit[]> {
  const data = await apiFetch<unknown>(`/api/v1/properties/${propertyUid}/units`);
  return pickUnits(data).map((raw) => toAccommodationUnit(raw, propertyUid));
}

/** GET /api/v1/units/{unitUid} */
export async function getAccommodationUnit(unitUid: string): Promise<AccommodationUnit> {
  const data = await apiFetch<unknown>(`/api/v1/units/${unitUid}`);
  const unit = toAccommodationUnit(unwrap(data, "unit"));
  return { ...unit, uid: unit.uid || unitUid };
}

/** POST /api/v1/properties/{propertyUid}/units */
export async function createAccommodationUnit(
  propertyUid: string,
  payload: CreateAccommodationUnitPayload,
): Promise<AccommodationUnit> {
  const data = await apiFetch<unknown>(`/api/v1/properties/${propertyUid}/units`, {
    method: "POST",
    body: {
      ...payload,
      unitName: blank(payload.unitName),
      floorOrArea: blank(payload.floorOrArea),
      notes: blank(payload.notes),
    },
  });
  const unit = toAccommodationUnit(asRecord(data), propertyUid);
  return { ...unit, propertyUid: unit.propertyUid || propertyUid };
}

/** PUT /api/v1/units/{unitUid} */
export async function updateAccommodationUnit(
  unitUid: string,
  payload: UpdateAccommodationUnitPayload,
): Promise<void> {
  await apiFetch(`/api/v1/units/${unitUid}`, {
    method: "PUT",
    body: {
      ...payload,
      unitName: blank(payload.unitName),
      floorOrArea: blank(payload.floorOrArea),
      notes: blank(payload.notes),
    },
  });
}

/** POST /api/v1/units/{unitUid}/blocks */
export async function createUnitBlock(
  unitUid: string,
  payload: CreateUnitBlockPayload,
): Promise<UnitBlock> {
  const data = await apiFetch<unknown>(`/api/v1/units/${unitUid}/blocks`, {
    method: "POST",
    body: { ...payload, reason: blank(payload.reason) },
  });
  const block = toUnitBlock(asRecord(data), unitUid);
  return {
    ...block,
    unitUid: block.unitUid || unitUid,
    startDate: block.startDate || payload.startDate,
    endDate: block.endDate || payload.endDate,
    blockType: block.blockType,
    reason: block.reason || payload.reason || "",
  };
}

/** DELETE /api/v1/unit-blocks/{unitBlockUid}. Soft-archives the block. */
export async function deleteUnitBlock(unitBlockUid: string): Promise<void> {
  await apiFetch(`/api/v1/unit-blocks/${unitBlockUid}`, { method: "DELETE" });
}

const flag = (value: unknown) => value === true;

export const toMealPlan = (raw: Raw, fallbackPropertyUid = ""): MealPlan => ({
  uid: pickUid(raw, ["mealPlanUid"]),
  propertyUid: str(raw.propertyUid, fallbackPropertyUid),
  code: str(raw.code),
  name: str(raw.name),
  description: str(raw.description),
  includesBreakfast: flag(raw.includesBreakfast),
  includesLunch: flag(raw.includesLunch),
  includesDinner: flag(raw.includesDinner),
  allowByo: flag(raw.allowByo),
  isActive: raw.isActive !== false,
});

const pickMealPlans = (data: unknown): Raw[] => {
  const list = pickList(data);
  if (list.length) return list;
  const raw = asRecord(data);
  if (Array.isArray(raw.mealPlans)) return raw.mealPlans.map(asRecord);
  return [];
};

/** GET /api/v1/properties/{propertyUid}/meal-plans */
export async function listMealPlans(propertyUid: string): Promise<MealPlan[]> {
  const data = await apiFetch<unknown>(`/api/v1/properties/${propertyUid}/meal-plans`);
  return pickMealPlans(data).map((raw) => toMealPlan(raw, propertyUid));
}

/** POST /api/v1/properties/{propertyUid}/meal-plans */
export async function createMealPlan(
  propertyUid: string,
  payload: CreateMealPlanPayload,
): Promise<MealPlan> {
  const data = await apiFetch<unknown>(`/api/v1/properties/${propertyUid}/meal-plans`, {
    method: "POST",
    body: { ...payload, description: blank(payload.description) },
  });
  const plan = toMealPlan(asRecord(data), propertyUid);
  return { ...plan, propertyUid: plan.propertyUid || propertyUid };
}

/** GET /api/v1/properties/{propertyUid}/meal-plans/{mealPlanUid} */
export async function getMealPlan(
  propertyUid: string,
  mealPlanUid: string,
): Promise<MealPlan> {
  const data = await apiFetch<unknown>(
    `/api/v1/properties/${propertyUid}/meal-plans/${mealPlanUid}`,
  );
  const plan = toMealPlan(unwrap(data, "mealPlan"), propertyUid);
  return { ...plan, uid: plan.uid || mealPlanUid };
}

/** PUT /api/v1/properties/{propertyUid}/meal-plans/{mealPlanUid} */
export async function updateMealPlan(
  propertyUid: string,
  mealPlanUid: string,
  payload: UpdateMealPlanPayload,
): Promise<void> {
  await apiFetch(`/api/v1/properties/${propertyUid}/meal-plans/${mealPlanUid}`, {
    method: "PUT",
    body: { ...payload, description: blank(payload.description) },
  });
}

/** DELETE /api/v1/properties/{propertyUid}/meal-plans/{mealPlanUid}. Archives the plan. */
export async function deleteMealPlan(
  propertyUid: string,
  mealPlanUid: string,
): Promise<void> {
  await apiFetch(`/api/v1/properties/${propertyUid}/meal-plans/${mealPlanUid}`, {
    method: "DELETE",
  });
}

const optionalNum = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

export const toRatePlan = (raw: Raw, fallbackPropertyUid = ""): RatePlan => ({
  uid: pickUid(raw, ["ratePlanUid"]),
  propertyUid: str(raw.propertyUid, fallbackPropertyUid),
  accommodationTypeUid: str(raw.accommodationTypeUid),
  mealPlanUid: str(raw.mealPlanUid),
  code: str(raw.code),
  name: str(raw.name),
  pricingBasis: parsePricingBasis(raw.pricingBasis),
  currency: str(raw.currency, "LKR").toUpperCase() || "LKR",
  description: str(raw.description),
  isRefundable: raw.isRefundable !== false,
  isActive: raw.isActive !== false,
});

export const toRatePlanPrice = (raw: Raw, fallbackRatePlanUid = ""): RatePlanPrice => ({
  uid: pickUid(raw, ["ratePlanPriceUid"]),
  ratePlanUid: str(raw.ratePlanUid, fallbackRatePlanUid),
  propertyUid: str(raw.propertyUid),
  startDate: str(raw.startDate).slice(0, 10),
  endDate: str(raw.endDate).slice(0, 10),
  dayOfWeek: optionalNum(raw.dayOfWeek),
  adultRate: optionalNum(raw.adultRate),
  childRate: optionalNum(raw.childRate),
  unitRate: num(raw.unitRate),
  minimumStay: num(raw.minimumStay, 1),
  isActive: raw.isActive !== false,
});

const pickRatePlans = (data: unknown): Raw[] => {
  const list = pickList(data);
  if (list.length) return list;
  const raw = asRecord(data);
  if (Array.isArray(raw.ratePlans)) return raw.ratePlans.map(asRecord);
  return [];
};

/** GET /api/v1/properties/{propertyUid}/rate-plans */
export async function listRatePlans(propertyUid: string): Promise<RatePlan[]> {
  const data = await apiFetch<unknown>(`/api/v1/properties/${propertyUid}/rate-plans`);
  return pickRatePlans(data).map((raw) => toRatePlan(raw, propertyUid));
}

/** POST /api/v1/properties/{propertyUid}/rate-plans */
export async function createRatePlan(
  propertyUid: string,
  payload: CreateRatePlanPayload,
): Promise<RatePlan> {
  const data = await apiFetch<unknown>(`/api/v1/properties/${propertyUid}/rate-plans`, {
    method: "POST",
    body: {
      ...payload,
      mealPlanUid: payload.mealPlanUid || null,
      description: blank(payload.description),
      currency: payload.currency.trim().toUpperCase(),
    },
  });
  const plan = toRatePlan(asRecord(data), propertyUid);
  return { ...plan, propertyUid: plan.propertyUid || propertyUid };
}

/** GET /api/v1/rate-plans/{ratePlanUid} */
export async function getRatePlan(ratePlanUid: string): Promise<RatePlan> {
  const data = await apiFetch<unknown>(`/api/v1/rate-plans/${ratePlanUid}`);
  const plan = toRatePlan(unwrap(data, "ratePlan"));
  return { ...plan, uid: plan.uid || ratePlanUid };
}

/** PUT /api/v1/rate-plans/{ratePlanUid} */
export async function updateRatePlan(
  ratePlanUid: string,
  payload: UpdateRatePlanPayload,
): Promise<RatePlan> {
  const data = await apiFetch<unknown>(`/api/v1/rate-plans/${ratePlanUid}`, {
    method: "PUT",
    body: {
      ...payload,
      description: blank(payload.description),
      currency: payload.currency.trim().toUpperCase(),
    },
  });
  const plan = toRatePlan(unwrap(data, "ratePlan"));
  return { ...plan, uid: plan.uid || ratePlanUid };
}

/** DELETE /api/v1/rate-plans/{ratePlanUid}. Archives the plan. */
export async function deleteRatePlan(ratePlanUid: string): Promise<void> {
  await apiFetch(`/api/v1/rate-plans/${ratePlanUid}`, { method: "DELETE" });
}

/** POST /api/v1/rate-plans/{ratePlanUid}/prices */
export async function createRatePlanPrice(
  ratePlanUid: string,
  payload: CreateRatePlanPricePayload,
): Promise<RatePlanPrice> {
  const data = await apiFetch<unknown>(`/api/v1/rate-plans/${ratePlanUid}/prices`, {
    method: "POST",
    body: payload,
  });
  const price = toRatePlanPrice(asRecord(data), ratePlanUid);
  return {
    ...price,
    ratePlanUid: price.ratePlanUid || ratePlanUid,
    startDate: price.startDate || payload.startDate,
    endDate: price.endDate || payload.endDate,
    unitRate: price.uid ? price.unitRate : payload.unitRate,
    minimumStay: price.minimumStay || payload.minimumStay,
  };
}


