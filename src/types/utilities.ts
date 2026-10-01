export interface UtilityType {
    uid: string;
    code: string;
    name: string;
    /** kWh, m3, kg ... empty for non-metered types */
    unitOfMeasure: string;
    isMetered: boolean;
    isActive: boolean;
  }
  
  /** Body for POST /api/v1/properties/{propertyUid}/utility-types and the matching PUT. */
  export interface UtilityTypePayload {
    code: string;
    name: string;
    /** Send null when isMetered is false (for example Internet). */
    unitOfMeasure: string | null;
    isMetered: boolean;
  }
  
  export interface UtilityBill {
    uid: string;
    propertyUid: string;
    utilityTypeUid: string;
    utilityTypeName: string;
    /** yyyy-mm-dd */
    periodStart: string;
    /** yyyy-mm-dd */
    periodEnd: string;
    previousReading: number | null;
    currentReading: number | null;
    /** Current minus previous. Calculated by the API when both readings are sent. */
    unitsUsed: number | null;
    amount: number;
    currency: string;
    /** yyyy-mm-dd, empty when not set */
    dueDate: string;
    /** ISO date-time, empty when unpaid */
    paidAt: string;
    referenceNumber: string;
  }
  
  /** Body for POST /api/v1/properties/{propertyUid}/utility-bills */
  export interface CreateUtilityBillPayload {
    utilityTypeUid: string;
    periodStart: string;
    periodEnd: string;
    previousReading: number | null;
    currentReading: number | null;
    amount: number;
    currency: string;
    dueDate: string | null;
    referenceNumber: string | null;
  }
  
  /** Body for PUT /api/v1/utility-bills/{utilityBillUid}. Set paidAt to null to mark unpaid. */
  export interface UpdateUtilityBillPayload extends CreateUtilityBillPayload {
    paidAt: string | null;
  }
  
  export type UtilityBillStatus = "paid" | "overdue" | "due";
  
  /** Paid wins. Otherwise a bill is overdue once its due date has passed. */
  export const utilityBillStatus = (
    bill: Pick<UtilityBill, "paidAt" | "dueDate">,
    today: string,
  ): UtilityBillStatus => {
    if (bill.paidAt) return "paid";
    if (bill.dueDate && bill.dueDate < today) return "overdue";
    return "due";
  };
  
  export const UTILITY_BILL_STATUS_LABELS: Record<UtilityBillStatus, string> = {
    paid: "Paid",
    overdue: "Overdue",
    due: "Due",
  };