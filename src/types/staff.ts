export interface StaffMember {
  uid: string;
  propertyUid: string;
  staffRoleUid: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  employmentType: number;
  basicSalary: number;
  joinedDate: string; // yyyy-mm-dd
  status: number;
}

/** Body for POST /api/v1/properties/{propertyUid}/staff */
export type CreateStaffPayload = Omit<StaffMember, "uid" | "propertyUid">;

/** Body for PUT /api/v1/staff/{staffUid} — this endpoint does not accept phone/email. */
export interface UpdateStaffPayload {
  staffRoleUid: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  employmentType: number;
  basicSalary: number;
  joinedDate: string;
  status: number;
}

export interface WorkLog {
  uid: string;
  staffUid: string;
  workDate: string;
  startTime: string;
  endTime: string;
  hoursWorked: number;
  overtimeHours: number;
  bookingUid: string | null;
  notes: string;
}

/** Body for POST /api/v1/staff/{staffUid}/work-logs */
export type CreateWorkLogPayload = Omit<WorkLog, "uid" | "staffUid">;

export interface StaffPayment {
  uid: string;
  staffUid: string;
  periodStart: string;
  periodEnd: string;
  basicAmount: number;
  overtimeAmount: number;
  bonusAmount: number;
  deductionAmount: number;
  paymentMethod: number;
  referenceNumber: string;
}

/** Body for POST /api/v1/staff/{staffUid}/payments */
export type CreateStaffPaymentPayload = Omit<StaffPayment, "uid" | "staffUid">;

// ASSUMED labels — confirm against the backend enums and adjust.
export const EMPLOYMENT_TYPE_LABELS: Record<number, string> = {
  0: "Full-time",
  1: "Part-time",
  2: "Contract",
  3: "Casual",
};

export const STAFF_STATUS_LABELS: Record<number, string> = {
  0: "Active",
  1: "Inactive",
  2: "On leave",
  3: "Terminated",
};

export const PAYMENT_METHOD_LABELS: Record<number, string> = {
  0: "Cash",
  1: "Bank transfer",
  2: "Card",
};

export const employmentTypeLabel = (n: number) =>
  EMPLOYMENT_TYPE_LABELS[n] ?? `Type ${n}`;

export const staffStatusLabel = (n: number) =>
  STAFF_STATUS_LABELS[n] ?? `Status ${n}`;

export const paymentMethodLabel = (n: number) =>
  PAYMENT_METHOD_LABELS[n] ?? `Method ${n}`;