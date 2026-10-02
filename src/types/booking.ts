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
}

export interface Booking {
  uid: string;
  propertyUid: string;
  bookingNumber: string;
  leadGuestUid: string;
  leadGuestName: string;
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
  pricingBasis: number;
  unitRate: number;
  adults: number;
  children: number;
  unitQuantity: number;
  guestCount: number;
}

/** Body for POST /api/v1/properties/{propertyUid}/bookings */
export interface CreateBookingPayload {
  leadGuestUid: string;
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

const SUMMARY_GUEST_TYPE_LABELS: Record<string, string> = {
  SINGLE: "Individual",
  INDIVIDUAL: "Individual",
  COUPLE: "Couple",
  FAMILY: "Family",
  GROUP: "Group",
  CORPORATE: "Corporate",
  TRAVEL_AGENT: "Travel agent",
};

const BOOKING_TYPE_LABELS: Record<string, string> = {
  BYO: "BYO",
  FULL_BOARD: "Full board",
  HALF_BOARD: "Half board",
};

export const summaryGuestTypeLabel = (value: string) => {
  const key = value.trim().toUpperCase().replace(/[\s-]+/g, "_");
  return SUMMARY_GUEST_TYPE_LABELS[key] ?? value;
};

export const bookingTypeLabel = (value: string) => {
  const key = value.trim().toUpperCase().replace(/[\s-]+/g, "_");
  return BOOKING_TYPE_LABELS[key] ?? value;
};

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


