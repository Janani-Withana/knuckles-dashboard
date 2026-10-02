export interface IncomeCategory {
  uid: string;
  code: string;
  name: string;
  isActive: boolean;
}

/** Body for POST and PUT /api/v1/properties/{propertyUid}/income-categories */
export interface IncomeCategoryPayload {
  code: string;
  name: string;
  isActive: boolean;
}

export interface OtherIncome {
  uid: string;
  propertyUid: string;
  incomeCategoryUid: string;
  incomeCategoryName: string;
  bookingUid: string;
  bookingNumber: string;
  incomeDate: string;
  description: string;
  amount: number;
  currency: string;
  paymentMethod: number | null;
  referenceNumber: string;
  notes: string;
}

/** Body for POST and PUT /api/v1/properties/{propertyUid}/other-income */
export interface OtherIncomePayload {
  incomeCategoryUid: string;
  bookingUid: string | null;
  incomeDate: string;
  description: string;
  amount: number;
  currency: string;
  paymentMethod: number | null;
  referenceNumber: string | null;
  notes: string | null;
}
