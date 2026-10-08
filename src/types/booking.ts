/** Shared by GET property bookings and GET booking. */
export interface BookingSummary {
  guestName: string;
  guestType: string;
  contactNumber: string;
  checkInDate: string;
  checkOutDate: string;
  numberOfPeople: number;
  nights: number;
  bookingType: string;
  roomRatePerNight: number | null;
  totalRoomRevenue: number | null;
  paymentMethod: string;
  cookingCharges: number | null;
  extraCharges: number | null;
  totalBookingValue: number | null;
  averagePerPerson: number | null;
  notes: string;
  extraIncome: number;
  serviceCharge: number;
  discountAmount: number;
  taxAmount: number;
  paymentsReceived: number;
  refundsPaid: number;
  netPaid: number;
  outstandingBalance: number;
}

export interface Booking {
  uid: string;
  propertyUid: string;
  bookingNumber: string;
  leadGuestUid: string;
  leadGuestName: string;
  /** Single, Couple, Family, Group, Corporate, or Travel Agent. */
  guestType: string;
  /** BYO, Half Board, Full Board, or a meal plan name. */
  bookingType: string;
  bookingSource: number;
  status: string;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  adults: number;
  children: number;
  infants: number;
  currency: string;
  quotedTotal: number | null;
  specialRequests: string;
  summary: BookingSummary | null;
}

export interface CreateBookingUnitPayload {
  accommodationTypeUid: string;
  unitUid: string | null;
  ratePlanUid: string;
  adults: number;
  children: number;
  unitQuantity: number;
  guestCount: number;
}

/** Body for POST /api/v1/properties/{propertyUid}/bookings */
export interface CreateBookingPayload {
  leadGuestUid: string;
  guestType: string;
  cookingCharges: number;
  extraCharges: number;
  bookingSource: number;
  checkInDate: string;
  checkOutDate: string;
  adults: number;
  children: number;
  infants: number;
  currency: string;
  specialRequests: string | null;
  units: CreateBookingUnitPayload[];
}

/** Body for PUT /api/v1/bookings/{bookingUid}. status is the booking status number. */
export interface UpdateBookingPayload {
  leadGuestUid: string;
  guestType: string;
  bookingSource: number;
  status: number;
  checkInDate: string;
  checkOutDate: string;
  adults: number;
  children: number;
  infants: number;
  currency: string;
  discountAmount: number;
  taxAmount: number;
  serviceCharge: number;
  quotedTotal: number;
  specialRequests: string | null;
  cancellationReason: string | null;
}

/** Confirmed=3, CheckedIn=4, CheckedOut=5, Cancelled=7. */
export const BOOKING_STATUS_BY_NAME: Record<string, number> = {
  INQUIRY: 0,
  PENDING: 1,
  TENTATIVE: 2,
  CONFIRMED: 3,
  CHECKED_IN: 4,
  CHECKED_OUT: 5,
  COMPLETED: 6,
  CANCELLED: 7,
  NO_SHOW: 8,
};

export const parseBookingStatus = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;
  const key = value.trim().toUpperCase().replace(/[\s-]+/g, "_");
  if (BOOKING_STATUS_BY_NAME[key] !== undefined) return BOOKING_STATUS_BY_NAME[key];
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

export interface BookingCalendarSegment {
  segmentType: string;
  bookingUid: string;
  bookingNumber: string;
  label: string;
  status: string;
  startDate: string;
  endDate: string;
}

export interface BookingCalendarUnit {
  unitUid: string;
  unitCode: string;
  unitName: string;
  accommodationTypeUid: string;
  accommodationTypeName: string;
  segments: BookingCalendarSegment[];
}

export interface BookingCalendar {
  propertyUid: string;
  from: string;
  to: string;
  units: BookingCalendarUnit[];
}

/** BookingSource. The API returns the name; create sends the number. Direct = 3. */
export const BOOKING_SOURCE_LABELS: Record<number, string> = {
  0: "Walk-in",
  1: "Phone",
  2: "WhatsApp",
  3: "Direct",
  4: "Website",
  5: "Travel agent",
  6: "Booking.com",
  7: "Airbnb",
  8: "Other",
};

const BOOKING_SOURCE_BY_NAME: Record<string, number> = {
  WALK_IN: 0,
  WALKIN: 0,
  PHONE: 1,
  WHATSAPP: 2,
  DIRECT: 3,
  WEBSITE: 4,
  TRAVEL_AGENT: 5,
  TRAVELAGENT: 5,
  BOOKING_COM: 6,
  BOOKINGCOM: 6,
  AIRBNB: 7,
  OTHER: 8,
};

export const BOOKING_STATUS_LABELS: Record<string, string> = {
  INQUIRY: "Inquiry",
  PENDING: "Pending",
  TENTATIVE: "Tentative",
  CONFIRMED: "Confirmed",
  CHECKED_IN: "Checked in",
  CHECKED_OUT: "Checked out",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  NO_SHOW: "No show",
};

export const bookingSourceLabel = (value: number) =>
  BOOKING_SOURCE_LABELS[value] ?? `Source ${value}`;

export const bookingStatusLabel = (value: string) => {
  const key = value.trim().toUpperCase().replace(/[\s-]+/g, "_");
  return BOOKING_STATUS_LABELS[key] ?? value;
};

/** Values accepted by create and update booking. Saved on the lead guest. */
export const BOOKING_GUEST_TYPES = [
  "Single",
  "Couple",
  "Family",
  "Group",
  "Corporate",
  "Travel Agent",
] as const;

const BOOKING_GUEST_TYPE_BY_KEY: Record<string, (typeof BOOKING_GUEST_TYPES)[number]> = {
  SINGLE: "Single",
  INDIVIDUAL: "Single",
  "0": "Single",
  COUPLE: "Couple",
  "1": "Couple",
  FAMILY: "Family",
  "2": "Family",
  GROUP: "Group",
  "3": "Group",
  CORPORATE: "Corporate",
  "4": "Corporate",
  TRAVEL_AGENT: "Travel Agent",
  TRAVELAGENT: "Travel Agent",
  "5": "Travel Agent",
};

export const parseBookingGuestType = (value: unknown): string => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return BOOKING_GUEST_TYPE_BY_KEY[String(value)] ?? "";
  }
  if (typeof value !== "string") return "";
  const text = value.trim();
  if (!text) return "";
  const key = text.toUpperCase().replace(/[\s-]+/g, "_");
  return BOOKING_GUEST_TYPE_BY_KEY[key] ?? text;
};

/** Guest API still stores guest type as a number. Single = 0. */
export const bookingGuestTypeNumber = (value: string) => {
  const canonical = parseBookingGuestType(value);
  const index = BOOKING_GUEST_TYPES.indexOf(canonical as (typeof BOOKING_GUEST_TYPES)[number]);
  return index >= 0 ? index : 0;
};

/** Sent on create and update. A meal plan name is also accepted. */
export const BOOKING_TYPES = ["BYO", "Half Board", "Full Board"] as const;

const BOOKING_TYPE_BY_KEY: Record<string, string> = {
  BYO: "BYO",
  HALF_BOARD: "Half Board",
  HALFBOARD: "Half Board",
  FULL_BOARD: "Full Board",
  FULLBOARD: "Full Board",
};

export const parseBookingType = (value: unknown): string => {
  if (typeof value !== "string") return "";
  const text = value.trim();
  if (!text) return "";
  const key = text.toUpperCase().replace(/[\s-]+/g, "_");
  return BOOKING_TYPE_BY_KEY[key] ?? text;
};

export const summaryGuestTypeLabel = (value: string) => parseBookingGuestType(value) || value;

export const bookingTypeLabel = (value: string) => parseBookingType(value) || value;

export const paymentMethodLabel = (value: string) => {
  const text = value.trim();
  if (!text) return "";
  return text
    .replace(/[_-]+/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

export const parseBookingSource = (value: unknown) =>
  parseCoded(value, BOOKING_SOURCE_BY_NAME, 3);

function parseCoded(value: unknown, byName: Record<string, number>, fallback: number): number {
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
