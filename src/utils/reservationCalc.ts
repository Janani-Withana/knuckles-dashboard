type Numish = number | string;

export interface CalcInput {
  checkIn: string;
  checkOut: string;
  occupancy: Numish;
  roomRate: Numish;
  cookingCharges: Numish;
  discount: Numish;
  foodCost: Numish;
  staffCost: Numish;
  utilitiesCost: Numish;
}

const n = (v: Numish) => Number(v) || 0;

export const calcNights = (checkIn: string, checkOut: string): number => {
  if (!checkIn || !checkOut) return 0;
  const ms = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  return Math.max(0, Math.round(ms / 86_400_000));
};

export function calcTotals(r: CalcInput) {
  const nights = calcNights(r.checkIn, r.checkOut);
  const roomRevenue = nights * n(r.roomRate);
  const bookingValue = Math.max(
    0,
    roomRevenue + n(r.cookingCharges) - n(r.discount),
  );
  const occupancy = n(r.occupancy);
  const avgPerPerson = occupancy > 0 ? bookingValue / occupancy : 0;
  const totalCost = n(r.foodCost) + n(r.staffCost) + n(r.utilitiesCost);
  const profit = bookingValue - totalCost;

  return { nights, roomRevenue, bookingValue, avgPerPerson, totalCost, profit };
}

export const formatLKR = (value: number): string =>
  `LKR ${value.toLocaleString("en-LK", { maximumFractionDigits: 2 })}`;