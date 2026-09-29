export type MealPlan = "Room Only" | "BB" | "HB" | "FB" | "BYOB";
export type PaymentMethod = "Cash" | "Card" | "Bank Transfer";

export const MEAL_PLANS: MealPlan[] = ["Room Only", "BB", "HB", "FB", "BYOB"];
export const PAYMENT_METHODS: PaymentMethod[] = ["Cash", "Card", "Bank Transfer"];

export interface Reservation {
  id: string;
  guestName: string;
  contactNo: string;
  checkIn: string; // yyyy-mm-dd
  checkOut: string;
  occupancy: number;
  mealPlan: MealPlan;
  roomRate: number; // per night
  paymentMethod: PaymentMethod;
  cookingCharges: number;
  discount: number;
  foodCost: number;
  staffCost: number;
  utilitiesCost: number;
  notes: string;
}