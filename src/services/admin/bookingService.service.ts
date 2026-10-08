import { apiFetch } from "../../lib/api";
import { asRecord, pickList, pickUid, str, type Raw } from "../../lib/normalize";
import {
  parseBookingGuestType,
  parseBookingSource,
  parseBookingType,
  type Booking,
  type BookingCalendar,
  type BookingCalendarSegment,
  type BookingCalendarUnit,
  type BookingSummary,
  type CreateBookingPayload,
} from "../../types/booking";

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

const toSummary = (value: unknown): BookingSummary | null => {
  const raw = asRecord(value);
  if (!Object.keys(raw).length) return null;
  return {
    guestName: str(raw.guestName),
    guestType: parseBookingGuestType(raw.guestType),
    contactNumber: str(raw.contactNumber),
    checkInDate: dateOnly(raw.checkInDate ?? raw.checkIn),
    checkOutDate: dateOnly(raw.checkOutDate ?? raw.checkOut),
    numberOfPeople: num(raw.numberOfPeople),
    nights: num(raw.nights),
    bookingType: parseBookingType(raw.bookingType),
    roomRatePerNight: optionalNum(raw.roomRatePerNight),
    totalRoomRevenue: optionalNum(raw.totalRoomRevenue),
    paymentMethod: str(raw.paymentMethod),
    cookingCharges: optionalNum(raw.cookingCharges),
    extraCharges: optionalNum(raw.extraCharges),
    extraIncome: num(raw.extraIncome),
    discountAmount: num(raw.discountAmount),
    taxAmount: num(raw.taxAmount),
    serviceCharge: num(raw.serviceCharge),
    totalBookingValue: optionalNum(raw.totalBookingValue),
    paymentsReceived: num(raw.paymentsReceived),
    refundsPaid: num(raw.refundsPaid),
    netPaid: num(raw.netPaid),
    outstandingBalance: num(raw.outstandingBalance),
    averagePerPerson: optionalNum(raw.averagePerPerson),
    notes: str(raw.notes),
  };
};

export const toBooking = (raw: Raw, fallbackPropertyUid = ""): Booking => {
  const summary = toSummary(raw.summary);
  const nights = num(raw.nights) || summary?.nights || 0;
  return {
    uid: pickUid(raw, ["bookingUid"]),
    propertyUid: str(raw.propertyUid, fallbackPropertyUid),
    bookingNumber: str(raw.bookingNumber),
    leadGuestUid: str(raw.leadGuestUid),
    leadGuestName: str(raw.leadGuestName) || summary?.guestName || "",
    guestType: parseBookingGuestType(raw.guestType) || summary?.guestType || "",
    bookingType: parseBookingType(raw.bookingType) || summary?.bookingType || "",
    bookingSource: parseBookingSource(raw.bookingSource),
    status: str(raw.status),
    checkInDate: dateOnly(raw.checkInDate) || summary?.checkInDate || "",
    checkOutDate: dateOnly(raw.checkOutDate) || summary?.checkOutDate || "",
    nights,
    adults: num(raw.adults),
    children: num(raw.children),
    infants: num(raw.infants),
    currency: str(raw.currency, "LKR").trim().toUpperCase() || "LKR",
    quotedTotal: optionalNum(raw.quotedTotal) ?? summary?.totalRoomRevenue ?? null,
    specialRequests: str(raw.specialRequests),
    summary,
  };
};

const toSegment = (raw: Raw): BookingCalendarSegment => ({
  segmentType: str(raw.segmentType).toUpperCase(),
  bookingUid: str(raw.bookingUid),
  bookingNumber: str(raw.bookingNumber),
  label: str(raw.label),
  status: str(raw.status),
  startDate: dateOnly(raw.startDate),
  endDate: dateOnly(raw.endDate),
});

const toCalendarUnit = (raw: Raw): BookingCalendarUnit => ({
  unitUid: pickUid(raw, ["unitUid"]),
  unitCode: str(raw.unitCode),
  unitName: str(raw.unitName),
  accommodationTypeUid: str(raw.accommodationTypeUid),
  accommodationTypeName: str(raw.accommodationTypeName),
  segments: Array.isArray(raw.segments) ? raw.segments.map((item) => toSegment(asRecord(item))) : [],
});

const toCalendar = (data: unknown, propertyUid: string): BookingCalendar => {
  const raw = asRecord(data);
  const nested = raw.units ? raw : asRecord(raw.calendar);
  const units = Array.isArray(nested.units) ? nested.units.map((item) => toCalendarUnit(asRecord(item))) : [];
  return {
    propertyUid: str(nested.propertyUid, propertyUid),
    from: dateOnly(nested.from),
    to: dateOnly(nested.to),
    units: units.filter((unit) => unit.unitUid),
  };
};

/** GET /api/v1/properties/{propertyUid}/bookings */
export async function listBookings(propertyUid: string): Promise<Booking[]> {
  const data = await apiFetch<unknown>(`/api/v1/properties/${propertyUid}/bookings`);
  const list = pickList(data);
  const bookings = asRecord(data).bookings;
  const rows: Raw[] = list.length ? list : Array.isArray(bookings) ? bookings.map(asRecord) : [];
  return rows.map((raw) => toBooking(raw, propertyUid)).filter((booking) => booking.uid);
}

/** GET /api/v1/properties/{propertyUid}/booking-calendar?from=&to= */
export async function getBookingCalendar(
  propertyUid: string,
  from: string,
  to: string,
  accommodationTypeUid?: string,
): Promise<BookingCalendar> {
  const params = new URLSearchParams({ from, to });
  if (accommodationTypeUid) params.set("accommodationTypeUid", accommodationTypeUid);
  const data = await apiFetch<unknown>(
    `/api/v1/properties/${propertyUid}/booking-calendar?${params.toString()}`,
  );
  return toCalendar(data, propertyUid);
}

/** POST /api/v1/properties/{propertyUid}/bookings */
export async function createBooking(
  propertyUid: string,
  payload: CreateBookingPayload,
): Promise<Booking> {
  const data = await apiFetch<unknown>(`/api/v1/properties/${propertyUid}/bookings`, {
    method: "POST",
    body: {
      ...payload,
      guestType: parseBookingGuestType(payload.guestType) || "Single",
      cookingCharges: Number.isFinite(payload.cookingCharges) ? payload.cookingCharges : 0,
      extraCharges: Number.isFinite(payload.extraCharges) ? payload.extraCharges : 0,
      currency: payload.currency.trim().toUpperCase(),
      specialRequests: blank(payload.specialRequests),
      units: payload.units.map((unit) => ({
        accommodationTypeUid: unit.accommodationTypeUid,
        unitUid: unit.unitUid || null,
        ratePlanUid: unit.ratePlanUid,
        adults: unit.adults,
        children: unit.children,
        unitQuantity: unit.unitQuantity,
        guestCount: unit.guestCount,
      })),
    },
  });
  const booking = toBooking(asRecord(data), propertyUid);
  return { ...booking, propertyUid: booking.propertyUid || propertyUid };
}
