export interface ReportPeriod {
    year: number;
    /** 1 to 12 */
    month: number;
  }
  
  /** GET .../reports/monthly-summary?year=&month= */
  export interface MonthlyPropertySummary extends ReportPeriod {
    currency: string;
    bookingIncome: number;
    staffCost: number;
    utilityCost: number;
    otherExpenses: number;
    totalExpenses: number;
    netProfit: number;
  }
  
  /** GET .../reports/expenses?year=&month= */
  export interface ExpenseReport extends ReportPeriod {
    currency: string;
    staffCost: number;
    utilityCost: number;
    generalExpenses: number;
    total: number;
  }
  
  /** Rows of booking-revenue and outstanding-balances (hotel.vw_booking_financial_summary). */
  export interface BookingFinancialRow {
    bookingUid: string;
    bookingNumber: string;
    leadGuestName: string;
    status: string;
    checkInDate: string;
    checkOutDate: string;
    currency: string;
    roomRevenue: number;
    extraCharges: number;
    discountAmount: number;
    taxAmount: number;
    serviceCharge: number;
    /** Room revenue + extras - discount + tax + service charge */
    totalBookingValue: number;
    /** Completed payments only */
    paymentsReceived: number;
    /** Completed refunds only */
    refundsPaid: number;
    outstandingBalance: number;
  }
  
  /** GET .../reports/booking-profitability */
  export interface BookingProfitabilityRow {
    bookingUid: string;
    bookingNumber: string;
    leadGuestName: string;
    checkInDate: string;
    checkOutDate: string;
    nights: number;
    currency: string;
    totalBookingValue: number;
    directExpenses: number;
    allocatedOverhead: number;
    /** Booking value minus direct expenses and allocated overhead */
    estimatedProfit: number;
    /** null when there are no guests or no nights */
    profitPerGuestNight: number | null;
  }
  
  /** GET .../reports/guest-profitability (each booking counted once, on its lead guest) */
  export interface GuestProfitabilityRow {
    guestUid: string;
    guestName: string;
    bookingCount: number;
    currency: string;
    totalBookingValue: number;
    estimatedProfit: number;
  }
  
  /** GET .../reports/occupancy (guest stays, newest check-in first) */
  export interface OccupancyRow {
    bookingUid: string;
    bookingNumber: string;
    guestUid: string;
    guestName: string;
    status: string;
    checkInDate: string;
    checkOutDate: string;
    nights: number;
    isLeadGuest: boolean;
  }
  
  /** GET .../reports/payment-summary?year=&month= (one row per method and currency) */
  export interface PaymentMethodSummary {
    paymentMethod: string;
    currency: string;
    paymentCount: number;
    totalAmount: number;
  }
  
  /** GET .../reports/utilities?year=&month= (one row per utility type) */
  export interface UtilityReportRow {
    utilityTypeUid: string;
    utilityTypeName: string;
    unitOfMeasure: string;
    billCount: number;
    unitsUsed: number | null;
    totalAmount: number;
    currency: string;
  }
  
  const METHOD_LABELS: Record<string, string> = {
    CASH: "Cash",
    CARD: "Card",
    BANK_TRANSFER: "Bank transfer",
    BANKTRANSFER: "Bank transfer",
    ONLINE: "Online",
    OTHER: "Other",
  };
  
  /** The API may send the method as a name or a number; unknown values are shown as sent. */
  export const paymentMethodName = (value: string) => {
    const key = value.trim().toUpperCase().replace(/[\s-]+/g, "_");
    return METHOD_LABELS[key] ?? (value || "Other");
  };