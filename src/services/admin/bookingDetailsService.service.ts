import { apiFetch } from "../../lib/api";
import { asRecord, pickList, pickUid, str, type Raw } from "../../lib/normalize";
import type {
  BookingDetail,
  BookingGuestLine,
  BookingHistoryEntry,
  BookingUnitLine,
} from "../../types/bookingDetails";
import { parsePricingBasis } from "../../types/accommodation";
import { parseBookingGuestType, parseBookingType, type UpdateBookingPayload } from "../../types/booking";
import { toBooking } from "./bookingService.service";

const num = (value: unknown, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const optionalNum = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const rows = (value: unknown): Raw[] => (Array.isArray(value) ? value.map(asRecord) : []);

const actorName = (value: unknown) => {
  const text = str(value);
  return /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(text) ? "" : text;
};

const toUnitLine = (raw: Raw): BookingUnitLine => ({
  uid: pickUid(raw, ["bookingUnitUid"]),
  accommodationTypeUid: str(raw.accommodationTypeUid),
  accommodationTypeName: str(raw.accommodationTypeName),
  unitUid: str(raw.unitUid),
  unitCode: str(raw.unitCode),
  unitName: str(raw.unitName),
  unitQuantity: num(raw.unitQuantity, 1),
  unitRate: optionalNum(raw.unitRate),
  totalAmount: optionalNum(raw.totalAmount),
  pricingBasis: parsePricingBasis(raw.pricingBasis),
  adults: num(raw.adults),
  children: num(raw.children),
  guestCount: num(raw.guestCount),
  status: str(raw.allocationStatus ?? raw.status),
});

const toGuestLine = (raw: Raw): BookingGuestLine => {
  const nested = asRecord(raw.guest);
  return {
    guestUid: pickUid(raw, ["guestUid"]) || pickUid(nested, ["guestUid"]),
    displayName: str(raw.displayName ?? raw.guestName ?? nested.displayName),
    guestType: parseBookingGuestType(raw.guestType ?? nested.guestType),
    email: str(raw.email ?? nested.email),
    isLeadGuest: raw.isLeadGuest === true,
    bookingUnitUid: str(raw.bookingUnitUid),
  };
};

const toDetail = (data: unknown, propertyUid = ""): BookingDetail => {
  const envelope = asRecord(data);
  const raw = asRecord(envelope.booking ?? data);
  const merged = raw.summary ? raw : { ...raw, summary: envelope.summary };
  return {
    ...toBooking(merged, propertyUid),
    discountAmount: num(raw.discountAmount),
    taxAmount: num(raw.taxAmount),
    serviceCharge: num(raw.serviceCharge),
    internalNotes: str(raw.internalNotes),
    cancellationReason: str(raw.cancellationReason),
    arrivalTime: str(raw.arrivalTime).slice(0, 5),
    departureTime: str(raw.departureTime).slice(0, 5),
    units: rows(raw.units ?? raw.bookingUnits).map(toUnitLine),
    guests: rows(raw.guests ?? raw.bookingGuests).map(toGuestLine),
  };
};

const toHistory = (raw: Raw, index: number): BookingHistoryEntry => ({
  key: str(raw.uid ?? raw.id, String(index)),
  kind: str(raw.eventType ?? raw.event ?? raw.type),
  fromStatus: str(raw.fromStatus ?? raw.oldStatus),
  toStatus: str(raw.toStatus ?? raw.newStatus ?? raw.status),
  reason: str(raw.reason ?? raw.notes),
  changedAt: str(raw.changedAt ?? raw.createdAt ?? raw.occurredAt),
  changedBy: actorName(raw.changedByName ?? raw.changedBy),
});

const base = (bookingUid: string) => `/api/v1/bookings/${bookingUid}`;

/** GET /api/v1/bookings/{bookingUid} */
export async function getBooking(bookingUid: string): Promise<BookingDetail> {
  return toDetail(await apiFetch<unknown>(base(bookingUid)));
}

/** PUT /api/v1/bookings/{bookingUid} */
export async function updateBooking(bookingUid: string, payload: UpdateBookingPayload): Promise<void> {
  await apiFetch<unknown>(base(bookingUid), {
    method: "PUT",
    body: {
      ...payload,
      guestType: parseBookingGuestType(payload.guestType) || "Single",
      bookingType: parseBookingType(payload.bookingType) || null,
      cookingCharges: Number.isFinite(payload.cookingCharges) ? payload.cookingCharges : 0,
      extraCharges: Number.isFinite(payload.extraCharges) ? payload.extraCharges : 0,
      currency: payload.currency.trim().toUpperCase(),
      specialRequests: payload.specialRequests?.trim() || null,
      cancellationReason: payload.cancellationReason?.trim() || null,
    },
  });
}

/** GET /api/v1/bookings/{bookingUid}/history */
export async function getBookingHistory(bookingUid: string): Promise<BookingHistoryEntry[]> {
  const data = await apiFetch<unknown>(`${base(bookingUid)}/history`);
  const record = asRecord(data);
  const list = Array.isArray(data)
    ? data.map(asRecord)
    : pickList(data).length
      ? pickList(data)
      : rows(record.statusChanges ?? record.history ?? record.events);
  return list.map(toHistory);
}

/** POST /api/v1/bookings/{bookingUid}/confirm */
export const confirmBooking = (bookingUid: string) =>
  apiFetch<unknown>(`${base(bookingUid)}/confirm`, { method: "POST" });

/** POST /api/v1/bookings/{bookingUid}/check-in */
export const checkInBooking = (bookingUid: string) =>
  apiFetch<unknown>(`${base(bookingUid)}/check-in`, { method: "POST" });

/** POST /api/v1/bookings/{bookingUid}/check-out */
export const checkOutBooking = (bookingUid: string) =>
  apiFetch<unknown>(`${base(bookingUid)}/check-out`, { method: "POST" });

/** POST /api/v1/bookings/{bookingUid}/cancel */
export const cancelBooking = (bookingUid: string, reason: string) =>
  apiFetch<unknown>(`${base(bookingUid)}/cancel`, {
    method: "POST",
    body: { reason: reason.trim() },
  });

/** POST /api/v1/bookings/{bookingUid}/assign-unit */
export const assignBookingUnit = (bookingUid: string, bookingUnitUid: string, unitUid: string) =>
  apiFetch<unknown>(`${base(bookingUid)}/assign-unit`, {
    method: "POST",
    body: { bookingUnitUid, unitUid },
  });

/** POST /api/v1/bookings/{bookingUid}/guests */
export const addBookingGuest = (bookingUid: string, guestUid: string, isLeadGuest: boolean) =>
  apiFetch<unknown>(`${base(bookingUid)}/guests`, {
    method: "POST",
    body: { guestUid, bookingUnitUid: null, isLeadGuest },
  });

/** DELETE /api/v1/bookings/{bookingUid}/guests/{guestUid} */
export const removeBookingGuest = (bookingUid: string, guestUid: string) =>
  apiFetch<unknown>(`${base(bookingUid)}/guests/${guestUid}`, { method: "DELETE" });
