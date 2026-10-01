import { apiFetch } from "../../lib/api";
import { asRecord, pickList, pickUid, str, type Raw } from "../../lib/normalize";
import type {
  CreateUtilityBillPayload,
  UpdateUtilityBillPayload,
  UtilityBill,
  UtilityType,
  UtilityTypePayload,
} from "../../types/utilities";

const num = (value: unknown, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const optionalNum = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const dateOnly = (value: unknown) => str(value).slice(0, 10);

const blank = (value: string | null) => {
  const text = value?.trim() ?? "";
  return text || null;
};

const toUtilityBill = (raw: Raw, fallbackPropertyUid = ""): UtilityBill => ({
  uid: pickUid(raw, ["utilityBillUid"]),
  propertyUid: str(raw.propertyUid, fallbackPropertyUid),
  utilityTypeUid: str(raw.utilityTypeUid),
  utilityTypeName: str(raw.utilityTypeName ?? raw.utilityType),
  periodStart: dateOnly(raw.periodStart),
  periodEnd: dateOnly(raw.periodEnd),
  previousReading: optionalNum(raw.previousReading),
  currentReading: optionalNum(raw.currentReading),
  unitsUsed: optionalNum(raw.unitsUsed),
  amount: num(raw.amount),
  currency: str(raw.currency, "LKR").trim().toUpperCase() || "LKR",
  dueDate: dateOnly(raw.dueDate),
  paidAt: str(raw.paidAt),
  referenceNumber: str(raw.referenceNumber),
});

const body = (payload: CreateUtilityBillPayload) => ({
  utilityTypeUid: payload.utilityTypeUid,
  periodStart: payload.periodStart,
  periodEnd: payload.periodEnd,
  previousReading: payload.previousReading,
  currentReading: payload.currentReading,
  amount: payload.amount,
  currency: payload.currency.trim().toUpperCase(),
  dueDate: payload.dueDate || null,
  referenceNumber: blank(payload.referenceNumber),
});

/** GET /api/v1/properties/{propertyUid}/utility-bills */
export async function listUtilityBills(propertyUid: string): Promise<UtilityBill[]> {
  const data = await apiFetch<unknown>(`/api/v1/properties/${propertyUid}/utility-bills`);
  const list = pickList(data);
  const bills = asRecord(data).utilityBills;
  const rows: Raw[] = list.length ? list : Array.isArray(bills) ? bills.map(asRecord) : [];
  return rows.map((raw) => toUtilityBill(raw, propertyUid)).filter((bill) => bill.uid);
}

/** GET /api/v1/utility-bills/{utilityBillUid} */
export async function getUtilityBill(utilityBillUid: string): Promise<UtilityBill> {
  const data = await apiFetch<unknown>(`/api/v1/utility-bills/${utilityBillUid}`);
  return toUtilityBill(asRecord(data));
}

/** POST /api/v1/properties/{propertyUid}/utility-bills */
export async function createUtilityBill(
  propertyUid: string,
  payload: CreateUtilityBillPayload,
): Promise<UtilityBill> {
  const data = await apiFetch<unknown>(`/api/v1/properties/${propertyUid}/utility-bills`, {
    method: "POST",
    body: body(payload),
  });
  return toUtilityBill(asRecord(data), propertyUid);
}

/** DELETE /api/v1/utility-bills/{utilityBillUid} (archives, returns 204) */
export async function deleteUtilityBill(utilityBillUid: string): Promise<void> {
  await apiFetch<unknown>(`/api/v1/utility-bills/${utilityBillUid}`, { method: "DELETE" });
}

/** PUT /api/v1/utility-bills/{utilityBillUid} */
export async function updateUtilityBill(
  utilityBillUid: string,
  payload: UpdateUtilityBillPayload,
): Promise<UtilityBill> {
  const data = await apiFetch<unknown>(`/api/v1/utility-bills/${utilityBillUid}`, {
    method: "PUT",
    body: { ...body(payload), paidAt: payload.paidAt || null },
  });
  return toUtilityBill(asRecord(data));
}

const toUtilityType = (raw: Raw): UtilityType => ({
  uid: pickUid(raw, ["utilityTypeUid"]),
  code: str(raw.code),
  name: str(raw.name),
  unitOfMeasure: str(raw.unitOfMeasure),
  isMetered: raw.isMetered === true,
  isActive: raw.isActive !== false,
});

const typeBody = (payload: UtilityTypePayload) => ({
  code: payload.code.trim().toUpperCase(),
  name: payload.name.trim(),
  unitOfMeasure: payload.isMetered ? blank(payload.unitOfMeasure) : null,
  isMetered: payload.isMetered,
});

const typesPath = (propertyUid: string) => `/api/v1/properties/${propertyUid}/utility-types`;

/** GET /api/v1/properties/{propertyUid}/utility-types (active types only) */
export async function listUtilityTypes(propertyUid: string): Promise<UtilityType[]> {
  const data = await apiFetch<unknown>(typesPath(propertyUid));
  const list = pickList(data);
  const types = asRecord(data).utilityTypes;
  const rows: Raw[] = list.length ? list : Array.isArray(types) ? types.map(asRecord) : [];
  return rows.map(toUtilityType).filter((type) => type.uid);
}

/** GET /api/v1/properties/{propertyUid}/utility-types/{utilityTypeUid} */
export async function getUtilityType(
  propertyUid: string,
  utilityTypeUid: string,
): Promise<UtilityType> {
  const data = await apiFetch<unknown>(`${typesPath(propertyUid)}/${utilityTypeUid}`);
  return toUtilityType(asRecord(data));
}

/** POST /api/v1/properties/{propertyUid}/utility-types */
export async function createUtilityType(
  propertyUid: string,
  payload: UtilityTypePayload,
): Promise<UtilityType> {
  const data = await apiFetch<unknown>(typesPath(propertyUid), {
    method: "POST",
    body: typeBody(payload),
  });
  return toUtilityType(asRecord(data));
}

/** PUT /api/v1/properties/{propertyUid}/utility-types/{utilityTypeUid} */
export async function updateUtilityType(
  propertyUid: string,
  utilityTypeUid: string,
  payload: UtilityTypePayload,
): Promise<UtilityType> {
  const data = await apiFetch<unknown>(`${typesPath(propertyUid)}/${utilityTypeUid}`, {
    method: "PUT",
    body: typeBody(payload),
  });
  return toUtilityType(asRecord(data));
}

/** DELETE /api/v1/properties/{propertyUid}/utility-types/{utilityTypeUid} (archives, returns 204) */
export async function deleteUtilityType(
  propertyUid: string,
  utilityTypeUid: string,
): Promise<void> {
  await apiFetch<unknown>(`${typesPath(propertyUid)}/${utilityTypeUid}`, { method: "DELETE" });
}