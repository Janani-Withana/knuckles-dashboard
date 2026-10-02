import { apiFetch } from "../../lib/api";
import { asRecord, pickCreatedUid, pickList, pickUid, str, type Raw } from "../../lib/normalize";
import { parsePaymentMethod } from "../../types/expense";
import type { IncomeCategory, IncomeCategoryPayload, OtherIncome, OtherIncomePayload } from "../../types/income";

const num = (value: unknown, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const blank = (value: string | null | undefined) => {
  const text = value?.trim() ?? "";
  return text || null;
};

const rows = (data: unknown): Raw[] => {
  if (Array.isArray(data)) return data.map(asRecord);
  const list = pickList(data);
  if (list.length) return list;
  const nested = asRecord(data).otherIncome ?? asRecord(data).incomes;
  return Array.isArray(nested) ? nested.map(asRecord) : [];
};

const toIncome = (raw: Raw, fallbackUid = ""): OtherIncome => {
  const category = asRecord(raw.incomeCategory);
  const booking = asRecord(raw.booking);
  return {
    uid: pickUid(raw, ["otherIncomeUid"]) || fallbackUid,
    propertyUid: str(raw.propertyUid),
    incomeCategoryUid: str(raw.incomeCategoryUid ?? category.uid),
    incomeCategoryName: str(raw.incomeCategoryName ?? category.name),
    bookingUid: str(raw.bookingUid ?? booking.uid),
    bookingNumber: str(raw.bookingNumber ?? booking.bookingNumber),
    incomeDate: str(raw.incomeDate).slice(0, 10),
    description: str(raw.description),
    amount: num(raw.amount),
    currency: str(raw.currency, "LKR").toUpperCase(),
    paymentMethod: parsePaymentMethod(raw.paymentMethod),
    referenceNumber: str(raw.referenceNumber),
    notes: str(raw.notes),
  };
};

const incomeBody = (payload: OtherIncomePayload) => ({
  incomeCategoryUid: payload.incomeCategoryUid,
  bookingUid: blank(payload.bookingUid),
  incomeDate: payload.incomeDate,
  description: payload.description.trim(),
  amount: payload.amount,
  currency: payload.currency.trim().toUpperCase() || "LKR",
  paymentMethod: payload.paymentMethod,
  referenceNumber: blank(payload.referenceNumber),
  notes: blank(payload.notes),
});

const incomePath = (propertyUid: string, otherIncomeUid = "") =>
  `/api/v1/properties/${propertyUid}/other-income${otherIncomeUid ? `/${otherIncomeUid}` : ""}`;

/** GET /api/v1/properties/{propertyUid}/other-income */
export async function listOtherIncome(propertyUid: string): Promise<OtherIncome[]> {
  const data = await apiFetch<unknown>(incomePath(propertyUid));
  return rows(data)
    .map((row) => toIncome(row))
    .filter((income) => income.uid);
}

/** GET /api/v1/properties/{propertyUid}/other-income/{otherIncomeUid} */
export async function getOtherIncome(propertyUid: string, otherIncomeUid: string): Promise<OtherIncome> {
  const data = await apiFetch<unknown>(incomePath(propertyUid, otherIncomeUid));
  return toIncome(asRecord(data), otherIncomeUid);
}

/** POST /api/v1/properties/{propertyUid}/other-income */
export async function createOtherIncome(
  propertyUid: string,
  payload: OtherIncomePayload,
): Promise<OtherIncome> {
  const data = await apiFetch<unknown>(incomePath(propertyUid), {
    method: "POST",
    body: incomeBody(payload),
  });
  const income = toIncome(asRecord(data));
  return income.uid ? income : { ...income, uid: pickCreatedUid(data, ["otherIncomeUid"]) };
}

/** PUT /api/v1/properties/{propertyUid}/other-income/{otherIncomeUid} */
export async function updateOtherIncome(
  propertyUid: string,
  otherIncomeUid: string,
  payload: OtherIncomePayload,
): Promise<OtherIncome> {
  const data = await apiFetch<unknown>(incomePath(propertyUid, otherIncomeUid), {
    method: "PUT",
    body: incomeBody(payload),
  });
  const income = toIncome(asRecord(data), otherIncomeUid);
  return { ...income, uid: income.uid || otherIncomeUid };
}

const toCategory = (raw: Raw, fallbackUid = ""): IncomeCategory => ({
  uid: pickUid(raw, ["incomeCategoryUid"]) || fallbackUid,
  code: str(raw.code),
  name: str(raw.name),
  isActive: raw.isActive !== false,
});

const categoryBody = (payload: IncomeCategoryPayload) => ({
  code: payload.code.trim().toUpperCase(),
  name: payload.name.trim(),
  isActive: payload.isActive,
});

const categoriesPath = (propertyUid: string, incomeCategoryUid = "") =>
  `/api/v1/properties/${propertyUid}/income-categories${incomeCategoryUid ? `/${incomeCategoryUid}` : ""}`;

/** GET /api/v1/properties/{propertyUid}/income-categories */
export async function listIncomeCategories(propertyUid: string): Promise<IncomeCategory[]> {
  const data = await apiFetch<unknown>(categoriesPath(propertyUid));
  return rows(data)
    .map((row) => toCategory(row))
    .filter((category) => category.uid);
}

/** GET /api/v1/properties/{propertyUid}/income-categories/{incomeCategoryUid} */
export async function getIncomeCategory(propertyUid: string, incomeCategoryUid: string): Promise<IncomeCategory> {
  const data = await apiFetch<unknown>(categoriesPath(propertyUid, incomeCategoryUid));
  return toCategory(asRecord(data), incomeCategoryUid);
}

/** POST /api/v1/properties/{propertyUid}/income-categories */
export async function createIncomeCategory(
  propertyUid: string,
  payload: IncomeCategoryPayload,
): Promise<IncomeCategory> {
  const data = await apiFetch<unknown>(categoriesPath(propertyUid), {
    method: "POST",
    body: categoryBody(payload),
  });
  const category = toCategory(asRecord(data));
  return category.uid ? category : { ...category, uid: pickCreatedUid(data, ["incomeCategoryUid"]) };
}

/** PUT /api/v1/properties/{propertyUid}/income-categories/{incomeCategoryUid} */
export async function updateIncomeCategory(
  propertyUid: string,
  incomeCategoryUid: string,
  payload: IncomeCategoryPayload,
): Promise<IncomeCategory> {
  const data = await apiFetch<unknown>(categoriesPath(propertyUid, incomeCategoryUid), {
    method: "PUT",
    body: categoryBody(payload),
  });
  const category = toCategory(asRecord(data), incomeCategoryUid);
  return { ...category, uid: category.uid || incomeCategoryUid };
}

/** DELETE /api/v1/properties/{propertyUid}/income-categories/{incomeCategoryUid}. Archives the category. */
export async function deleteIncomeCategory(propertyUid: string, incomeCategoryUid: string): Promise<void> {
  await apiFetch<unknown>(categoriesPath(propertyUid, incomeCategoryUid), { method: "DELETE" });
}

/** DELETE /api/v1/properties/{propertyUid}/other-income/{otherIncomeUid}. Archives the record. */
export async function deleteOtherIncome(propertyUid: string, otherIncomeUid: string): Promise<void> {
  await apiFetch<unknown>(incomePath(propertyUid, otherIncomeUid), { method: "DELETE" });
}
