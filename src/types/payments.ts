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

export interface InvoiceParty {
  name: string;
  phone: string;
  email: string;
  address: string;
}

export interface InvoiceLine {
  lineType: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
}

export interface InvoicePayment {
  uid: string;
  paidAt: string;
  paymentMethod: number;
  paymentType: number;
  amount: number;
  status: number;
  referenceNumber: string;
}

export interface InvoiceRefund {
  uid: string;
  paidAt: string;
  amount: number;
  reason: string;
  referenceNumber: string;
  status: number;
}

export interface Invoice {
  invoiceNumber: string;
  invoiceDate: string;
  bookingUid: string;
  bookingNumber: string;
  status: string;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  adults: number;
  children: number;
  infants: number;
  currency: string;
  property: InvoiceParty;
  billTo: InvoiceParty;
  lines: InvoiceLine[];
  roomRevenue: number;
  extraIncome: number;
  discountAmount: number;
  taxAmount: number;
  serviceCharge: number;
  totalBookingValue: number;
  payments: InvoicePayment[];
  refunds: InvoiceRefund[];
  paymentsReceived: number;
  refundsPaid: number;
  netPaid: number;
  outstandingBalance: number;
}

/** Food=0, Cooking=1, Laundry=2, Beverage=3, Transport=4, Activity=5, Damage=6, Other=7 */
export const CHARGE_TYPE_CATEGORIES = [
  { value: 0, label: "Food" },
  { value: 1, label: "Cooking" },
  { value: 2, label: "Laundry" },
  { value: 3, label: "Beverage" },
  { value: 4, label: "Transport" },
  { value: 5, label: "Activity" },
  { value: 6, label: "Damage" },
  { value: 7, label: "Other" },
] as const;

export const chargeTypeCategoryLabel = (category: number) =>
  CHARGE_TYPE_CATEGORIES.find((item) => item.value === category)?.label ?? `Category ${category}`;

export interface BookingChargeType {
  uid: string;
  propertyUid: string;
  code: string;
  name: string;
  category: number;
  isTaxable: boolean;
  defaultPrice: number;
  isActive: boolean;
}

/** Body for POST and PUT /api/v1/properties/{propertyUid}/booking-charge-types */
export interface BookingChargeTypePayload {
  code: string;
  name: string;
  category: number;
  isTaxable: boolean;
  defaultPrice: number;
  isActive: boolean;
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

/** Cash=0, BankTransfer=1, Card=2, OnlineGateway=3, Cheque=4, Other=5 */
export const PAYMENT_METHOD_LABELS: Record<number, string> = {
  0: "Cash",
  1: "Bank transfer",
  2: "Card",
  3: "Online gateway",
  4: "Cheque",
  5: "Other",
};

const PAYMENT_METHOD_BY_NAME: Record<string, number> = {
  CASH: 0,
  BANK_TRANSFER: 1,
  BANKTRANSFER: 1,
  CARD: 2,
  ONLINE_GATEWAY: 3,
  ONLINEGATEWAY: 3,
  CHEQUE: 4,
  CHECK: 4,
  OTHER: 5,
};

/** Deposit=0, Payment=1, Adjustment=2 */
export const PAYMENT_TYPE_LABELS: Record<number, string> = {
  0: "Deposit",
  1: "Payment",
  2: "Adjustment",
};

const PAYMENT_TYPE_BY_NAME: Record<string, number> = {
  DEPOSIT: 0,
  PAYMENT: 1,
  ADJUSTMENT: 2,
};

/** Pending=0, Completed=1, Failed=2, Cancelled=3. Refunded=4 and Partially refunded=5 are set by the refund API. */
export const PAYMENT_STATUS_REFUNDED = 4;
export const PAYMENT_STATUS_PARTIALLY_REFUNDED = 5;

export const PAYMENT_STATUS_LABELS: Record<number, string> = {
  0: "Pending",
  1: "Completed",
  2: "Failed",
  3: "Cancelled",
  [PAYMENT_STATUS_REFUNDED]: "Refunded",
  [PAYMENT_STATUS_PARTIALLY_REFUNDED]: "Partially refunded",
};

const PAYMENT_STATUS_BY_NAME: Record<string, number> = {
  PENDING: 0,
  COMPLETED: 1,
  FAILED: 2,
  CANCELLED: 3,
  CANCELED: 3,
  REFUNDED: PAYMENT_STATUS_REFUNDED,
  PARTIALLY_REFUNDED: PAYMENT_STATUS_PARTIALLY_REFUNDED,
};

/** Accepts the numeric code sent on create, or the name returned by the list. */
const parsePaymentEnum = (value: unknown, byName: Record<string, number>): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const key = value.trim().toUpperCase().replace(/[\s-]+/g, "_");
    if (byName[key] !== undefined) return byName[key];
    const compact = key.replace(/_/g, "");
    if (byName[compact] !== undefined) return byName[compact];
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return numeric;
  }
  return Number.NaN;
};

export const parsePaymentMethod = (value: unknown) => parsePaymentEnum(value, PAYMENT_METHOD_BY_NAME);

export const parsePaymentType = (value: unknown) => parsePaymentEnum(value, PAYMENT_TYPE_BY_NAME);

export const parsePaymentStatus = (value: unknown) => parsePaymentEnum(value, PAYMENT_STATUS_BY_NAME);

export const paymentMethodLabel = (n: number) => PAYMENT_METHOD_LABELS[n] ?? "—";

export const paymentTypeLabel = (n: number) => PAYMENT_TYPE_LABELS[n] ?? "—";

export const paymentStatusLabel = (n: number) => PAYMENT_STATUS_LABELS[n] ?? "—";