import { apiFetch } from "../../lib/api";
import { asRecord, pickList, type Raw } from "../../lib/normalize";
import type {
  BookingFinancialRow,
  BookingProfitabilityRow,
  ExpenseReport,
  GuestProfitabilityRow,
  MonthlyPropertySummary,
  OccupancyRow,
  PaymentMethodSummary,
  ReportPeriod,
  UtilityReportRow,
} from "../../types/reports";

/*
 * Field names are read from several likely spellings because the Postman
 * collection documents the endpoints but not the JSON. If a column shows 0 or
 * blank, check the real response and add its name to the matching key list.
 */

const firstKey = (raw: Raw, keys: string[]) =>
  keys.find((key) => raw[key] !== undefined && raw[key] !== null && raw[key] !== "");

const num = (raw: Raw, keys: string[], fallback = 0) => {
  const key = firstKey(raw, keys);
  if (!key) return fallback;
  const n = Number(raw[key]);
  return Number.isFinite(n) ? n : fallback;
};

const optNum = (raw: Raw, keys: string[]): number | null => {
  const key = firstKey(raw, keys);
  if (!key) return null;
  const n = Number(raw[key]);
  return Number.isFinite(n) ? n : null;
};

const text = (raw: Raw, keys: string[], fallback = "") => {
  const key = firstKey(raw, keys);
  return key ? String(raw[key]) : fallback;
};

const dateOnly = (raw: Raw, keys: string[]) => text(raw, keys).slice(0, 10);

const currencyOf = (raw: Raw) => text(raw, ["currency", "currencyCode"], "LKR").trim().toUpperCase() || "LKR";

const rows = (data: unknown, extraKeys: string[] = []): Raw[] => {
  if (Array.isArray(data)) return data.map(asRecord);
  const list = pickList(data);
  if (list.length) return list;
  const record = asRecord(data);
  for (const key of extraKeys) {
    if (Array.isArray(record[key])) return (record[key] as unknown[]).map(asRecord);
  }
  return [];
};

const base = (propertyUid: string) => `/api/v1/properties/${propertyUid}/reports`;

const periodQuery = ({ year, month }: ReportPeriod) =>
  `?${new URLSearchParams({ year: String(year), month: String(month) }).toString()}`;

const unwrap = (data: unknown, key: string) => {
  const raw = asRecord(data);
  return raw[key] ? asRecord(raw[key]) : raw;
};

const toFinancialRow = (raw: Raw): BookingFinancialRow => ({
  bookingUid: text(raw, ["bookingUid", "uid"]),
  bookingNumber: text(raw, ["bookingNumber"]),
  leadGuestName: text(raw, ["leadGuestName", "guestName"]),
  status: text(raw, ["status", "bookingStatus"]),
  checkInDate: dateOnly(raw, ["checkInDate"]),
  checkOutDate: dateOnly(raw, ["checkOutDate"]),
  currency: currencyOf(raw),
  roomRevenue: num(raw, ["roomRevenue"]),
  extraCharges: num(raw, ["extraCharges", "extraChargesTotal"]),
  discountAmount: num(raw, ["discountAmount", "bookingDiscount"]),
  taxAmount: num(raw, ["taxAmount"]),
  serviceCharge: num(raw, ["serviceCharge"]),
  totalBookingValue: num(raw, ["totalBookingValue", "totalValue"]),
  paymentsReceived: num(raw, ["paymentsReceived", "totalPaid"]),
  refundsPaid: num(raw, ["refundsPaid", "totalRefunded"]),
  outstandingBalance: num(raw, ["outstandingBalance", "balanceDue", "balance"]),
});

/** GET /api/v1/properties/{propertyUid}/reports/monthly-summary?year=&month= */
export async function getMonthlySummary(
  propertyUid: string,
  period: ReportPeriod,
): Promise<MonthlyPropertySummary> {
  const data = await apiFetch<unknown>(`${base(propertyUid)}/monthly-summary${periodQuery(period)}`);
  const raw = unwrap(data, "summary");
  const staffCost = num(raw, ["staffCost", "staffCosts", "staffExpense", "staffExpenses"]);
  const utilityCost = num(raw, ["utilityCost", "utilityCosts", "utilityExpense", "utilityExpenses"]);
  const otherExpenses = num(raw, ["otherExpenses", "otherExpense", "generalExpenses"]);
  const bookingIncome = num(raw, ["bookingIncome", "totalBookingIncome", "bookingRevenue", "totalIncome"]);
  const totalExpenses = num(raw, ["totalExpenses", "totalExpense"], staffCost + utilityCost + otherExpenses);
  return {
    ...period,
    currency: currencyOf(raw),
    bookingIncome,
    staffCost,
    utilityCost,
    otherExpenses,
    totalExpenses,
    netProfit: num(raw, ["netProfit", "netIncome", "profit"], bookingIncome - totalExpenses),
  };
}

/** GET .../reports/expenses?year=&month= */
export async function getExpenseReport(
  propertyUid: string,
  period: ReportPeriod,
): Promise<ExpenseReport> {
  const data = await apiFetch<unknown>(`${base(propertyUid)}/expenses${periodQuery(period)}`);
  const raw = unwrap(data, "expenses");
  const staffCost = num(raw, ["staffCost", "staffCosts", "staffExpense", "staffExpenses"]);
  const utilityCost = num(raw, ["utilityCost", "utilityCosts", "utilityExpense", "utilityExpenses"]);
  const generalExpenses = num(raw, ["generalExpenses", "otherExpenses", "generalExpense"]);
  return {
    ...period,
    currency: currencyOf(raw),
    staffCost,
    utilityCost,
    generalExpenses,
    total: num(raw, ["total", "totalExpenses"], staffCost + utilityCost + generalExpenses),
  };
}

/** GET .../reports/booking-revenue (active bookings, newest check-in first) */
export async function getBookingRevenue(propertyUid: string): Promise<BookingFinancialRow[]> {
  const data = await apiFetch<unknown>(`${base(propertyUid)}/booking-revenue`);
  return rows(data, ["bookings"]).map(toFinancialRow);
}

/** GET .../reports/outstanding-balances (balance greater than zero) */
export async function getOutstandingBalances(propertyUid: string): Promise<BookingFinancialRow[]> {
  const data = await apiFetch<unknown>(`${base(propertyUid)}/outstanding-balances`);
  return rows(data, ["bookings"]).map(toFinancialRow);
}

/** GET .../reports/booking-profitability */
export async function getBookingProfitability(
  propertyUid: string,
): Promise<BookingProfitabilityRow[]> {
  const data = await apiFetch<unknown>(`${base(propertyUid)}/booking-profitability`);
  return rows(data, ["bookings"]).map((raw) => ({
    bookingUid: text(raw, ["bookingUid", "uid"]),
    bookingNumber: text(raw, ["bookingNumber"]),
    leadGuestName: text(raw, ["leadGuestName", "guestName"]),
    checkInDate: dateOnly(raw, ["checkInDate"]),
    checkOutDate: dateOnly(raw, ["checkOutDate"]),
    nights: num(raw, ["nights"]),
    currency: currencyOf(raw),
    totalBookingValue: num(raw, ["totalBookingValue", "totalValue"]),
    directExpenses: num(raw, ["directExpenses", "directExpense"]),
    allocatedOverhead: num(raw, ["allocatedOverhead", "overheadAllocated"]),
    estimatedProfit: num(raw, ["estimatedProfit", "profit"]),
    profitPerGuestNight: optNum(raw, ["profitPerGuestNight"]),
  }));
}

/** GET .../reports/guest-profitability */
export async function getGuestProfitability(
  propertyUid: string,
): Promise<GuestProfitabilityRow[]> {
  const data = await apiFetch<unknown>(`${base(propertyUid)}/guest-profitability`);
  return rows(data, ["guests"]).map((raw) => ({
    guestUid: text(raw, ["guestUid", "leadGuestUid", "uid"]),
    guestName: text(raw, ["guestName", "leadGuestName", "displayName"]),
    bookingCount: num(raw, ["bookingCount", "bookings", "totalBookings"]),
    currency: currencyOf(raw),
    totalBookingValue: num(raw, ["totalBookingValue", "totalValue"]),
    estimatedProfit: num(raw, ["estimatedProfit", "totalEstimatedProfit", "profit"]),
  }));
}

/** GET .../reports/occupancy (guest stays, newest check-in first) */
export async function getOccupancy(propertyUid: string): Promise<OccupancyRow[]> {
  const data = await apiFetch<unknown>(`${base(propertyUid)}/occupancy`);
  return rows(data, ["stays"]).map((raw) => ({
    bookingUid: text(raw, ["bookingUid"]),
    bookingNumber: text(raw, ["bookingNumber"]),
    guestUid: text(raw, ["guestUid"]),
    guestName: text(raw, ["guestName", "displayName"]),
    status: text(raw, ["status", "bookingStatus"]),
    checkInDate: dateOnly(raw, ["checkInDate"]),
    checkOutDate: dateOnly(raw, ["checkOutDate"]),
    nights: num(raw, ["nights"]),
    isLeadGuest: raw.isLeadGuest !== false,
  }));
}

/** GET .../reports/payment-summary?year=&month= */
export async function getPaymentSummary(
  propertyUid: string,
  period: ReportPeriod,
): Promise<PaymentMethodSummary[]> {
  const data = await apiFetch<unknown>(`${base(propertyUid)}/payment-summary${periodQuery(period)}`);
  return rows(data, ["payments", "methods"]).map((raw) => ({
    paymentMethod: text(raw, ["paymentMethod", "method"]),
    currency: currencyOf(raw),
    paymentCount: num(raw, ["paymentCount", "count", "totalPayments"]),
    totalAmount: num(raw, ["totalAmount", "totalPaid", "amount"]),
  }));
}

/** GET .../reports/utilities?year=&month= */
export async function getUtilityReport(
  propertyUid: string,
  period: ReportPeriod,
): Promise<UtilityReportRow[]> {
  const data = await apiFetch<unknown>(`${base(propertyUid)}/utilities${periodQuery(period)}`);
  return rows(data, ["utilities"]).map((raw) => ({
    utilityTypeUid: text(raw, ["utilityTypeUid"]),
    utilityTypeName: text(raw, ["utilityTypeName", "utilityType", "name"]),
    unitOfMeasure: text(raw, ["unitOfMeasure", "unit"]),
    billCount: num(raw, ["billCount", "bills"]),
    unitsUsed: optNum(raw, ["unitsUsed", "totalUnitsUsed"]),
    totalAmount: num(raw, ["totalAmount", "amount", "totalCost"]),
    currency: currencyOf(raw),
  }));
}