import { apiFetch } from "../../lib/api";
import { asRecord, pickCreatedUid, pickList, pickUid, str, type Raw } from "../../lib/normalize";
import {
  parsePaymentMethod,
  parsePaymentStatus,
  parsePaymentType,
  type BookingCharge,
  type BookingFinancialSummary,
  type BookingPayment,
  type BookingChargeType,
  type BookingChargeTypePayload,
  type CreateChargePayload,
  type CreatePaymentPayload,
  type Invoice,
  type InvoiceLine,
  type InvoiceParty,
  type InvoicePayment,
  type InvoiceRefund,
  type RefundPaymentPayload,
  type UpdateChargePayload,
} from "../../types/payments";

const num = (value: unknown, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const toSummary = (raw: Raw, fallbackBookingUid = ""): BookingFinancialSummary => ({
  bookingUid: str(raw.bookingUid, fallbackBookingUid),
  bookingNumber: str(raw.bookingNumber),
  leadGuestName: str(raw.leadGuestName),
  totalBookingValue: num(raw.totalBookingValue),
  totalCharges: num(raw.totalCharges),
  totalPayments: num(raw.totalPayments ?? raw.paymentsReceived),
  totalRefunds: num(raw.totalRefunds ?? raw.refundsPaid),
  outstandingBalance: num(raw.outstandingBalance),
  currency: str(raw.currency, "LKR"),
});

const rows = (value: unknown): Raw[] =>
  Array.isArray(value) ? value.map(asRecord) : pickList(value);

const toParty = (value: unknown): InvoiceParty => {
  const raw = asRecord(value);
  return {
    name: str(raw.name),
    phone: str(raw.phone),
    email: str(raw.email),
    address: str(raw.address),
  };
};

const toLine = (raw: Raw): InvoiceLine => ({
  lineType: str(raw.lineType),
  description: str(raw.description),
  quantity: num(raw.quantity, 1),
  unitPrice: num(raw.unitPrice),
  discountAmount: num(raw.discountAmount),
  taxAmount: num(raw.taxAmount),
  totalAmount: num(raw.totalAmount ?? raw.amount),
});

const toInvoicePayment = (raw: Raw): InvoicePayment => ({
  uid: pickUid(raw, ["paymentUid"]),
  paidAt: str(raw.paidAt ?? raw.createdAt),
  paymentMethod: parsePaymentMethod(raw.paymentMethod),
  paymentType: parsePaymentType(raw.paymentType),
  amount: num(raw.amount),
  status: parsePaymentStatus(raw.status),
  referenceNumber: str(raw.referenceNumber),
});

const toInvoiceRefund = (raw: Raw): InvoiceRefund => ({
  uid: pickUid(raw, ["refundUid"]),
  paidAt: str(raw.paidAt ?? raw.refundedAt ?? raw.createdAt),
  amount: num(raw.amount),
  reason: str(raw.reason),
  referenceNumber: str(raw.referenceNumber),
  status: parsePaymentStatus(raw.status),
});

const toInvoice = (raw: Raw, fallbackBookingUid = ""): Invoice => ({
  invoiceNumber: str(raw.invoiceNumber),
  invoiceDate: str(raw.invoiceDate ?? raw.issuedDate),
  bookingUid: str(raw.bookingUid, fallbackBookingUid),
  bookingNumber: str(raw.bookingNumber),
  status: str(raw.status),
  checkInDate: str(raw.checkInDate),
  checkOutDate: str(raw.checkOutDate),
  nights: num(raw.nights),
  adults: num(raw.adults),
  children: num(raw.children),
  infants: num(raw.infants),
  currency: str(raw.currency, "LKR"),
  property: toParty(raw.property),
  billTo: toParty(raw.billTo),
  lines: rows(raw.lines ?? raw.lineItems).map(toLine),
  roomRevenue: num(raw.roomRevenue),
  extraIncome: num(raw.extraIncome),
  discountAmount: num(raw.discountAmount ?? raw.discountTotal),
  taxAmount: num(raw.taxAmount ?? raw.taxTotal),
  serviceCharge: num(raw.serviceCharge),
  totalBookingValue: num(raw.totalBookingValue ?? raw.totalAmount),
  payments: rows(raw.payments).map(toInvoicePayment),
  refunds: rows(raw.refunds).map(toInvoiceRefund),
  paymentsReceived: num(raw.paymentsReceived ?? raw.amountPaid),
  refundsPaid: num(raw.refundsPaid),
  netPaid: num(raw.netPaid),
  outstandingBalance: num(raw.outstandingBalance ?? raw.balanceDue),
});

const toCharge = (raw: Raw, fallbackBookingUid = ""): BookingCharge => {
  const quantity = num(raw.quantity, 1);
  const unitPrice = num(raw.unitPrice);
  const discountAmount = num(raw.discountAmount);
  const taxAmount = num(raw.taxAmount);
  return {
    uid: pickUid(raw, ["chargeUid"]),
    bookingUid: str(raw.bookingUid, fallbackBookingUid),
    chargeTypeUid: str(raw.chargeTypeUid),
    chargeTypeName: str(raw.chargeTypeName),
    bookingUnitUid: raw.bookingUnitUid ? str(raw.bookingUnitUid) : null,
    description: str(raw.description),
    quantity,
    unitPrice,
    discountAmount,
    taxAmount,
    totalAmount: num(raw.totalAmount, quantity * unitPrice - discountAmount + taxAmount),
    notes: str(raw.notes),
  };
};

const toPayment = (raw: Raw, fallbackBookingUid = ""): BookingPayment => ({
  uid: pickUid(raw, ["paymentUid"]),
  bookingUid: str(raw.bookingUid, fallbackBookingUid),
  paymentMethod: parsePaymentMethod(raw.paymentMethod),
  paymentType: parsePaymentType(raw.paymentType),
  amount: num(raw.amount),
  currency: str(raw.currency, "LKR"),
  status: parsePaymentStatus(raw.status),
  referenceNumber: str(raw.referenceNumber),
  refundedAmount: num(raw.refundedAmount),
  createdAt: str(raw.createdAt ?? raw.paidAt ?? raw.creationDate),
});

export async function getBookingFinancialSummary(
  bookingUid: string,
): Promise<BookingFinancialSummary> {
  const data = await apiFetch<unknown>(`/api/v1/bookings/${bookingUid}/financial-summary`);
  return toSummary(asRecord(data), bookingUid);
}

export async function getBookingInvoice(bookingUid: string): Promise<Invoice> {
  const data = await apiFetch<unknown>(`/api/v1/bookings/${bookingUid}/invoice`);
  return toInvoice(asRecord(data), bookingUid);
}

const toChargeType = (raw: Raw, fallbackPropertyUid = ""): BookingChargeType => ({
  uid: pickUid(raw, ["chargeTypeUid"]),
  propertyUid: str(raw.propertyUid, fallbackPropertyUid),
  code: str(raw.code),
  name: str(raw.name),
  category: num(raw.category),
  isTaxable: raw.isTaxable === true,
  defaultPrice: num(raw.defaultPrice),
  isActive: raw.isActive !== false,
});

const chargeTypeBody = (payload: BookingChargeTypePayload) => ({
  code: payload.code.trim().toUpperCase(),
  name: payload.name.trim(),
  category: payload.category,
  isTaxable: payload.isTaxable,
  defaultPrice: payload.defaultPrice,
  isActive: payload.isActive,
});

const chargeTypesPath = (propertyUid: string) =>
  `/api/v1/properties/${propertyUid}/booking-charge-types`;

/** GET /api/v1/properties/{propertyUid}/booking-charge-types (active types only) */
export async function listBookingChargeTypes(propertyUid: string): Promise<BookingChargeType[]> {
  const data = await apiFetch<unknown>(chargeTypesPath(propertyUid));
  return pickList(data)
    .map((row) => toChargeType(row, propertyUid))
    .filter((type) => type.uid);
}

/** GET /api/v1/properties/{propertyUid}/booking-charge-types/{chargeTypeUid} */
export async function getBookingChargeType(
  propertyUid: string,
  chargeTypeUid: string,
): Promise<BookingChargeType> {
  const data = await apiFetch<unknown>(`${chargeTypesPath(propertyUid)}/${chargeTypeUid}`);
  return toChargeType(asRecord(data), propertyUid);
}

/** POST /api/v1/properties/{propertyUid}/booking-charge-types */
export async function createBookingChargeType(
  propertyUid: string,
  payload: BookingChargeTypePayload,
): Promise<BookingChargeType> {
  const data = await apiFetch<unknown>(chargeTypesPath(propertyUid), {
    method: "POST",
    body: chargeTypeBody(payload),
  });
  const type = toChargeType(asRecord(data), propertyUid);
  return type.uid ? type : { ...type, uid: pickCreatedUid(data, ["chargeTypeUid"]) };
}

/** PUT /api/v1/properties/{propertyUid}/booking-charge-types/{chargeTypeUid} */
export async function updateBookingChargeType(
  propertyUid: string,
  chargeTypeUid: string,
  payload: BookingChargeTypePayload,
): Promise<BookingChargeType> {
  const data = await apiFetch<unknown>(`${chargeTypesPath(propertyUid)}/${chargeTypeUid}`, {
    method: "PUT",
    body: chargeTypeBody(payload),
  });
  const type = toChargeType(asRecord(data), propertyUid);
  return { ...type, uid: type.uid || chargeTypeUid };
}

/** DELETE /api/v1/properties/{propertyUid}/booking-charge-types/{chargeTypeUid} (archives, returns 204) */
export async function deleteBookingChargeType(
  propertyUid: string,
  chargeTypeUid: string,
): Promise<void> {
  await apiFetch<unknown>(`${chargeTypesPath(propertyUid)}/${chargeTypeUid}`, { method: "DELETE" });
}

export async function listBookingCharges(bookingUid: string): Promise<BookingCharge[]> {
  const data = await apiFetch<unknown>(`/api/v1/bookings/${bookingUid}/charges`);
  return pickList(data).map((r) => toCharge(r, bookingUid));
}

export async function createBookingCharge(
  bookingUid: string,
  payload: CreateChargePayload,
): Promise<BookingCharge> {
  const data = await apiFetch<unknown>(`/api/v1/bookings/${bookingUid}/charges`, {
    method: "POST",
    body: payload,
  });
  const charge = toCharge(asRecord(data), bookingUid);
  return charge.uid ? charge : { ...charge, uid: pickCreatedUid(data, ["chargeUid"]) };
}

export async function updateBookingCharge(
  chargeUid: string,
  payload: UpdateChargePayload,
): Promise<BookingCharge> {
  const data = await apiFetch<unknown>(`/api/v1/booking-charges/${chargeUid}`, {
    method: "PUT",
    body: payload,
  });
  const charge = toCharge(asRecord(data));
  return { ...charge, uid: charge.uid || chargeUid };
}

export async function deleteBookingCharge(chargeUid: string): Promise<void> {
  await apiFetch<unknown>(`/api/v1/booking-charges/${chargeUid}`, { method: "DELETE" });
}

export async function listBookingPayments(bookingUid: string): Promise<BookingPayment[]> {
  const data = await apiFetch<unknown>(`/api/v1/bookings/${bookingUid}/payments`);
  return pickList(data).map((r) => toPayment(r, bookingUid));
}

export async function createBookingPayment(
  bookingUid: string,
  payload: CreatePaymentPayload,
): Promise<BookingPayment> {
  const data = await apiFetch<unknown>(`/api/v1/bookings/${bookingUid}/payments`, {
    method: "POST",
    body: payload,
  });
  const payment = toPayment(asRecord(data), bookingUid);
  return payment.uid ? payment : { ...payment, uid: pickCreatedUid(data, ["paymentUid"]) };
}

export async function refundBookingPayment(
  paymentUid: string,
  payload: RefundPaymentPayload,
): Promise<BookingPayment> {
  const data = await apiFetch<unknown>(`/api/v1/booking-payments/${paymentUid}/refund`, {
    method: "POST",
    body: payload,
  });
  const payment = toPayment(asRecord(data));
  return { ...payment, uid: payment.uid || paymentUid };
}