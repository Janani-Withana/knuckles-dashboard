import { apiFetch } from "../../lib/api";
import { asRecord, pickCreatedUid, pickList, pickUid, str, type Raw } from "../../lib/normalize";
import type {
  BookingCharge,
  BookingFinancialSummary,
  BookingPayment,
  CreateChargePayload,
  CreatePaymentPayload,
  Invoice,
  InvoiceLineItem,
  RefundPaymentPayload,
  UpdateChargePayload,
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

const toLineItem = (raw: Raw): InvoiceLineItem => ({
  description: str(raw.description),
  quantity: num(raw.quantity, 1),
  unitPrice: num(raw.unitPrice),
  amount: num(raw.amount ?? raw.totalAmount),
});

const toInvoice = (raw: Raw, fallbackBookingUid = ""): Invoice => ({
  bookingUid: str(raw.bookingUid, fallbackBookingUid),
  invoiceNumber: str(raw.invoiceNumber),
  issuedDate: str(raw.issuedDate),
  dueDate: str(raw.dueDate),
  currency: str(raw.currency, "LKR"),
  subtotal: num(raw.subtotal),
  taxTotal: num(raw.taxTotal),
  discountTotal: num(raw.discountTotal),
  totalAmount: num(raw.totalAmount),
  amountPaid: num(raw.amountPaid),
  balanceDue: num(raw.balanceDue),
  lineItems: pickList(raw.lineItems ?? raw.items ?? raw.lines).map(toLineItem),
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
  paymentMethod: Number(raw.paymentMethod ?? 0),
  paymentType: Number(raw.paymentType ?? 0),
  amount: num(raw.amount),
  currency: str(raw.currency, "LKR"),
  status: Number(raw.status ?? 0),
  referenceNumber: str(raw.referenceNumber),
  refundedAmount: num(raw.refundedAmount),
  createdAt: str(raw.createdAt ?? raw.paidAt),
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