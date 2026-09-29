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
  parseUnitKind,
  type AccommodationType,
  type CreateAccommodationTypePayload,
  type UpdateAccommodationTypePayload,
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
