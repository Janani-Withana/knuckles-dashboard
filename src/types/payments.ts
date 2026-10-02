export interface BookingFinancialSummary {
  bookingUid: string;
  bookingNumber: string;
  leadGuestName: string;
  totalBookingValue: number;
  totalCharges: number;
  totalPayments: number;
  totalRefunds: number;
  outstandingBalance: number;
  currency: string;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

// ASSUMED shape — no sample invoice response was available; adjust to match the API.
export interface Invoice {
  bookingUid: string;
  invoiceNumber: string;
  issuedDate: string;
  dueDate: string;
  currency: string;
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  lineItems: InvoiceLineItem[];
}

export interface BookingCharge {
  uid: string;
  bookingUid: string;
  chargeTypeUid: string;
  chargeTypeName: string;
  bookingUnitUid: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  notes: string;
}

/** Body for POST /api/v1/bookings/{bookingUid}/charges */
export interface CreateChargePayload {
  chargeTypeUid: string;
  bookingUnitUid: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  taxAmount: number;
  notes: string;
}

/** Body for PUT /api/v1/booking-charges/{chargeUid} — no bookingUnitUid or notes here. */
export interface UpdateChargePayload {
  chargeTypeUid: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  taxAmount: number;
}

export interface BookingPayment {
  uid: string;
  bookingUid: string;
  paymentMethod: number;
  paymentType: number;
  amount: number;
  currency: string;
  status: number;
  referenceNumber: string;
  refundedAmount: number;
  createdAt: string;
}

/** Body for POST /api/v1/bookings/{bookingUid}/payments */
export interface CreatePaymentPayload {
  paymentMethod: number;
  paymentType: number;
  amount: number;
  currency: string;
  status: number;
  referenceNumber: string;
}

/** Body for POST /api/v1/booking-payments/{paymentUid}/refund */
export interface RefundPaymentPayload {
  amount: number;
  reason: string;
}

// ASSUMED labels — confirm against the backend enums and adjust.
export const PAYMENT_TYPE_LABELS: Record<number, string> = {
  0: "Deposit",
  1: "Payment",
  2: "Refund",
};

export const PAYMENT_STATUS_LABELS: Record<number, string> = {
  0: "Pending",
  1: "Completed",
  2: "Failed",
  3: "Refunded",
};

export const paymentTypeLabel = (n: number) =>
  PAYMENT_TYPE_LABELS[n] ?? `Type ${n}`;

export const paymentStatusLabel = (n: number) =>
  PAYMENT_STATUS_LABELS[n] ?? `Status ${n}`;