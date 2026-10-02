import { apiFetch } from "../../lib/api";
import { asRecord, pickList, pickUid, str, type Raw } from "../../lib/normalize";

export interface Guest {
  uid: string;
  guestType: number;
  title: string;
  firstName: string;
  lastName: string;
  displayName: string;
  phone: string;
  alternatePhone: string;
  email: string;
  nationalityCode: string;
  dateOfBirth: string;
  preferredLanguage: string;
  address: string;
  city: string;
  countryCode: string;
  identityNumber: string;
  notes: string;
  isActive: boolean;
}

export interface CreateGuestPayload {
  displayName: string;
  phone?: string | null;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  title?: string | null;
  guestType?: number;
  alternatePhone?: string | null;
  nationalityCode?: string | null;
  dateOfBirth?: string | null;
  preferredLanguage?: string | null;
  address?: string | null;
  city?: string | null;
  countryCode?: string | null;
  identityNumber?: string | null;
  notes?: string | null;
}

export interface UpdateGuestPayload extends CreateGuestPayload {
  isActive: boolean;
}

export interface GuestStay {
  bookingUid: string;
  bookingNumber: string;
  propertyName: string;
  status: string;
  checkInDate: string;
  checkOutDate: string;
  isLeadGuest: boolean;
}

export const GUEST_TYPE_LABELS: Record<number, string> = {
  0: "Individual",
  1: "Couple",
  2: "Family",
  3: "Group",
  4: "Corporate",
  5: "Travel agent",
};

const GUEST_TYPE_BY_NAME: Record<string, number> = {
  INDIVIDUAL: 0,
  SINGLE: 0,
  COUPLE: 1,
  FAMILY: 2,
  GROUP: 3,
  CORPORATE: 4,
  TRAVEL_AGENT: 5,
  TRAVELAGENT: 5,
};

export const guestTypeLabel = (value: number) => GUEST_TYPE_LABELS[value] ?? "Guest";

const parseGuestType = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const key = value.trim().toUpperCase().replace(/[\s-]+/g, "_");
    if (GUEST_TYPE_BY_NAME[key] !== undefined) return GUEST_TYPE_BY_NAME[key];
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return numeric;
  }
  return 0;
};

const blank = (value: string | null) => {
  const text = value?.trim() ?? "";
  return text || null;
};

const code = (value: string | null | undefined) => {
  const text = blank(value ?? null);
  return text ? text.toUpperCase() : null;
};

const toGuest = (raw: Raw): Guest => ({
  uid: pickUid(raw, ["guestUid"]),
  guestType: parseGuestType(raw.guestType),
  title: str(raw.title),
  firstName: str(raw.firstName),
  lastName: str(raw.lastName),
  displayName: str(raw.displayName),
  phone: str(raw.phone),
  alternatePhone: str(raw.alternatePhone),
  email: str(raw.email),
  nationalityCode: str(raw.nationalityCode).trim().toUpperCase(),
  dateOfBirth: str(raw.dateOfBirth).slice(0, 10),
  preferredLanguage: str(raw.preferredLanguage),
  address: str(raw.address),
  city: str(raw.city),
  countryCode: str(raw.countryCode).trim().toUpperCase(),
  identityNumber: str(raw.identityNumber),
  notes: str(raw.notes),
  isActive: raw.isActive !== false,
});

const guestBody = (payload: CreateGuestPayload) => ({
  displayName: blank(payload.displayName),
  firstName: blank(payload.firstName ?? null),
  lastName: blank(payload.lastName ?? null),
  title: blank(payload.title ?? null),
  guestType: payload.guestType ?? 0,
  phone: blank(payload.phone ?? null),
  alternatePhone: blank(payload.alternatePhone ?? null),
  email: blank(payload.email ?? null),
  nationalityCode: code(payload.nationalityCode),
  dateOfBirth: blank(payload.dateOfBirth ?? null),
  preferredLanguage: blank(payload.preferredLanguage ?? null),
  address: blank(payload.address ?? null),
  city: blank(payload.city ?? null),
  countryCode: code(payload.countryCode),
  identityNumber: blank(payload.identityNumber ?? null),
  notes: blank(payload.notes ?? null),
});

const guestRows = (data: unknown): Raw[] => {
  const list = pickList(data);
  if (list.length) return list;
  const guests = asRecord(data).guests;
  return Array.isArray(guests) ? guests.map(asRecord) : [];
};

/** GET /api/v1/properties/{propertyUid}/guests */
export async function listGuests(propertyUid: string, search = ""): Promise<Guest[]> {
  const params = new URLSearchParams();
  if (search.trim()) params.set("search", search.trim());
  const query = params.toString();
  const data = await apiFetch<unknown>(
    `/api/v1/properties/${propertyUid}/guests${query ? `?${query}` : ""}`,
  );
  return guestRows(data).map(toGuest).filter((guest) => guest.uid);
}

/** POST /api/v1/properties/{propertyUid}/guests */
export async function createGuest(
  propertyUid: string,
  payload: CreateGuestPayload,
): Promise<Guest> {
  const data = await apiFetch<unknown>(`/api/v1/properties/${propertyUid}/guests`, {
    method: "POST",
    body: guestBody(payload),
  });
  return toGuest(asRecord(data));
}

/** GET /api/v1/guests/{guestUid} */
export async function getGuest(guestUid: string): Promise<Guest> {
  const data = await apiFetch<unknown>(`/api/v1/guests/${guestUid}`);
  const guest = toGuest(asRecord(asRecord(data).guest ?? data));
  return { ...guest, uid: guest.uid || guestUid };
}

/** PUT /api/v1/guests/{guestUid} */
export async function updateGuest(guestUid: string, payload: UpdateGuestPayload): Promise<Guest> {
  const data = await apiFetch<unknown>(`/api/v1/guests/${guestUid}`, {
    method: "PUT",
    body: { ...guestBody(payload), isActive: payload.isActive },
  });
  const guest = toGuest(asRecord(asRecord(data).guest ?? data));
  return { ...guest, uid: guest.uid || guestUid };
}

/** GET /api/v1/guests/{guestUid}/booking-history */
export async function getGuestBookingHistory(guestUid: string): Promise<GuestStay[]> {
  const data = await apiFetch<unknown>(`/api/v1/guests/${guestUid}/booking-history`);
  return guestRows(data).map((raw) => ({
    bookingUid: pickUid(raw, ["bookingUid"]),
    bookingNumber: str(raw.bookingNumber),
    propertyName: str(raw.propertyName),
    status: str(raw.status),
    checkInDate: str(raw.checkInDate).slice(0, 10),
    checkOutDate: str(raw.checkOutDate).slice(0, 10),
    isLeadGuest: raw.isLeadGuest === true,
  }));
}
