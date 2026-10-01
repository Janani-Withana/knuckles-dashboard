export interface ExpenseCategory {
  uid: string;
  parentUid: string;
  code: string;
  name: string;
  expenseGroup: number;
  isActive: boolean;
}

export interface Expense {
  uid: string;
  propertyUid: string;
  expenseCategoryUid: string;
  expenseCategoryName: string;
  supplierUid: string;
  supplierName: string;
  bookingUid: string;
  expenseDate: string;
  description: string;
  amount: number;
  currency: string;
  paymentMethod: number | null;
  referenceNumber: string;
  receiptUrl: string;
  notes: string;
}

export interface ExpensePayload {
  expenseCategoryUid: string;
  expenseDate: string;
  description: string;
  amount: number;
  currency: string;
  paymentMethod: number | null;
  supplierUid: string | null;
  bookingUid: string | null;
  referenceNumber: string | null;
  receiptUrl: string | null;
  notes: string | null;
}

export interface CreateExpenseCategoryPayload {
  code: string;
  name: string;
  expenseGroup: number;
  parentUid: string | null;
}

export const EXPENSE_GROUP_LABELS: Record<number, string> = {
  0: "Staff",
  1: "Utility",
  2: "Food",
  3: "Maintenance",
  4: "Transport",
  5: "Marketing",
  6: "Supplies",
  7: "Administration",
  8: "Other",
};

const EXPENSE_GROUP_BY_NAME: Record<string, number> = {
  STAFF: 0,
  UTILITY: 1,
  FOOD: 2,
  MAINTENANCE: 3,
  TRANSPORT: 4,
  MARKETING: 5,
  SUPPLIES: 6,
  ADMINISTRATION: 7,
  OTHER: 8,
};

export const PAYMENT_METHOD_LABELS: Record<number, string> = {
  0: "Cash",
  1: "Bank transfer",
  2: "Card",
  3: "Cheque",
  4: "Other",
};

const PAYMENT_METHOD_BY_NAME: Record<string, number> = {
  CASH: 0,
  BANK_TRANSFER: 1,
  BANKTRANSFER: 1,
  CARD: 2,
  CHEQUE: 3,
  CHECK: 3,
  OTHER: 4,
};

const parseCoded = (value: unknown, byName: Record<string, number>): number | null => {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const key = value.trim().toUpperCase().replace(/[\s-]+/g, "_");
    if (byName[key] !== undefined) return byName[key];
    const compact = key.replace(/_/g, "");
    if (byName[compact] !== undefined) return byName[compact];
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return numeric;
  }
  return null;
};

export const parseExpenseGroup = (value: unknown) => parseCoded(value, EXPENSE_GROUP_BY_NAME) ?? 8;

export const parsePaymentMethod = (value: unknown) => parseCoded(value, PAYMENT_METHOD_BY_NAME);

export const expenseGroupLabel = (value: number) => EXPENSE_GROUP_LABELS[value] ?? "Other";

export const paymentMethodLabel = (value: number | null) =>
  value === null ? "—" : PAYMENT_METHOD_LABELS[value] ?? "Other";
