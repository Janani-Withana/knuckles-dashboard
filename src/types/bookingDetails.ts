import type { Booking } from "./booking";

export interface BookingUnitLine {
  uid: string;
  accommodationTypeUid: string;
  accommodationTypeName: string;
  unitUid: string;
  unitCode: string;
  unitName: string;
  ratePlanUid: string;
  unitQuantity: number;
  unitRate: number | null;
  totalAmount: number | null;
  pricingBasis: number;
  adults: number;
  children: number;
  guestCount: number;
  status: string;
}

export interface BookingGuestLine {
  guestUid: string;
  displayName: string;
  guestType: string;
  email: string;
  isLeadGuest: boolean;
  bookingUnitUid: string;
}

export interface BookingHistoryEntry {
  key: string;
  kind: string;
  fromStatus: string;
  toStatus: string;
  reason: string;
  changedAt: string;
  changedBy: string;
}

export interface BookingDetail extends Booking {
  discountAmount: number;
  taxAmount: number;
  serviceCharge: number;
  internalNotes: string;
  cancellationReason: string;
  arrivalTime: string;
  departureTime: string;
  units: BookingUnitLine[];
  guests: BookingGuestLine[];
  charges: BookingCharge[];
}

// types/bookingDetails.ts
export type BookingCharge = {
  uid: string;
  bookingUnitUid: string | null;
  chargeTypeUid: string;
  chargeTypeName: string;
  serviceDate: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  notes: string | null;
  creationDate: string;
};
