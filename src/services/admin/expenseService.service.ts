import { apiFetch } from "../../lib/api";
import { asRecord, pickList, pickUid, str, type Raw } from "../../lib/normalize";
import {
  parseExpenseGroup,
  parsePaymentMethod,
  type CreateExpenseCategoryPayload,
  type Expense,
  type ExpenseCategory,
  type ExpensePayload,
} from "../../types/expense";

const num = (value: unknown, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const blank = (value: string | null | undefined) => {
  const text = value?.trim() ?? "";
  return text || null;
};

const toCategory = (raw: Raw): ExpenseCategory => ({
  uid: pickUid(raw, ["expenseCategoryUid"]),
  parentUid: str(raw.parentUid),
  code: str(raw.code),
  name: str(raw.name),
  expenseGroup: parseExpenseGroup(raw.expenseGroup),
  isActive: raw.isActive !== false,
});

const toExpense = (raw: Raw): Expense => ({
  uid: pickUid(raw, ["expenseUid"]),
  propertyUid: str(raw.propertyUid),
  expenseCategoryUid: str(raw.expenseCategoryUid),
  expenseCategoryName: str(raw.expenseCategoryName),
  supplierUid: str(raw.supplierUid),
  supplierName: str(raw.supplierName),
  bookingUid: str(raw.bookingUid),
  expenseDate: str(raw.expenseDate).slice(0, 10),
  description: str(raw.description),
  amount: num(raw.amount),
  currency: str(raw.currency, "LKR").toUpperCase(),
  paymentMethod: parsePaymentMethod(raw.paymentMethod),
  referenceNumber: str(raw.referenceNumber),
  receiptUrl: str(raw.receiptUrl),
  notes: str(raw.notes),
});

const expenseBody = (payload: ExpensePayload) => ({
  expenseCategoryUid: payload.expenseCategoryUid,
  supplierUid: blank(payload.supplierUid),
  bookingUid: blank(payload.bookingUid),
  expenseDate: payload.expenseDate,
  description: payload.description.trim(),
  amount: payload.amount,
  currency: payload.currency.trim().toUpperCase() || "LKR",
  paymentMethod: payload.paymentMethod,
  referenceNumber: blank(payload.referenceNumber),
  receiptUrl: blank(payload.receiptUrl),
  notes: blank(payload.notes),
});

const rows = (data: unknown, key: string): Raw[] => {
  const list = pickList(data);
  if (list.length) return list;
  const nested = asRecord(data)[key];
  return Array.isArray(nested) ? nested.map(asRecord) : [];
};

/** GET /api/v1/properties/{propertyUid}/expense-categories */
export async function listExpenseCategories(propertyUid: string): Promise<ExpenseCategory[]> {
  const data = await apiFetch<unknown>(`/api/v1/properties/${propertyUid}/expense-categories`);
  return rows(data, "expenseCategories")
    .map(toCategory)
    .filter((category) => category.uid);
}

/** POST /api/v1/properties/{propertyUid}/expense-categories */
export async function createExpenseCategory(
  propertyUid: string,
  payload: CreateExpenseCategoryPayload,
): Promise<ExpenseCategory> {
  const data = await apiFetch<unknown>(`/api/v1/properties/${propertyUid}/expense-categories`, {
    method: "POST",
    body: {
      code: payload.code.trim().toUpperCase(),
      name: payload.name.trim(),
      expenseGroup: payload.expenseGroup,
      parentUid: blank(payload.parentUid),
    },
  });
  const category = toCategory(asRecord(data));
  return category.uid ? category : { ...category, code: payload.code.trim().toUpperCase(), name: payload.name.trim() };
}

/** GET /api/v1/properties/{propertyUid}/expenses */
export async function listExpenses(propertyUid: string): Promise<Expense[]> {
  const data = await apiFetch<unknown>(`/api/v1/properties/${propertyUid}/expenses`);
  return rows(data, "expenses")
    .map(toExpense)
    .filter((expense) => expense.uid);
}

/** POST /api/v1/properties/{propertyUid}/expenses */
export async function createExpense(propertyUid: string, payload: ExpensePayload): Promise<Expense> {
  const data = await apiFetch<unknown>(`/api/v1/properties/${propertyUid}/expenses`, {
    method: "POST",
    body: expenseBody(payload),
  });
  const expense = toExpense(asRecord(data));
  return expense;
}

/** GET /api/v1/expenses/{expenseUid} */
export async function getExpense(expenseUid: string): Promise<Expense> {
  const data = await apiFetch<unknown>(`/api/v1/expenses/${expenseUid}`);
  const expense = toExpense(asRecord(asRecord(data).expense ?? data));
  return { ...expense, uid: expense.uid || expenseUid };
}

/** PUT /api/v1/expenses/{expenseUid} */
export async function updateExpense(expenseUid: string, payload: ExpensePayload): Promise<Expense> {
  const data = await apiFetch<unknown>(`/api/v1/expenses/${expenseUid}`, {
    method: "PUT",
    body: expenseBody(payload),
  });
  const expense = toExpense(asRecord(asRecord(data).expense ?? data));
  return { ...expense, uid: expense.uid || expenseUid };
}

/** DELETE /api/v1/expenses/{expenseUid}. Archives the expense. */
export async function deleteExpense(expenseUid: string): Promise<void> {
  await apiFetch(`/api/v1/expenses/${expenseUid}`, { method: "DELETE" });
}
