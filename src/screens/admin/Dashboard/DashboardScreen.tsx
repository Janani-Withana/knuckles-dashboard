import { useEffect, useState } from "react";
import { Users, LogOut, BedDouble, Wallet } from "lucide-react";

import DashboardHero from "../../../components/dashboard/DashboardHero";
import StatCard from "../../../components/dashboard/StatCard";
import BookingOverview from "../../../components/dashboard/BookingOverview";
import RevenueOverview, { type MonthProgress } from "../../../components/dashboard/RevenueOverview";
import QuickActions from "../../../components/dashboard/QuickActions";
import RecentBookings from "../../../components/dashboard/RecentBookings";
import BookingStatus from "../../../components/dashboard/BookingStatus";
//import BottomBanner from "../../../components/dashboard/BottomBanner";
import FinanceOverview from "../../../components/dashboard/FinanceOverview";
import { PageError, PageLoading } from "../../../components/common/PageState";
import { useAuth } from "../../../context/AuthContext";
import { ApiError } from "../../../lib/api";
import { getBookingFinancialSummary } from "../../../services/admin/paymentsService.service";
import {
  getBookingRevenue,
  getMonthlySummary,
  getOccupancy,
  getOutstandingBalances,
  getPaymentSummary,
} from "../../../services/admin/reportsService.service";
import { bookingStatusLabel } from "../../../types/booking";
import type { BookingData } from "../../../types/dashboard";
import { formatDate, isoDate } from "../Reservations/bookingDates";
import "./DashboardScreen.css";

const STATUS_COLORS: Record<string, string> = {
  Pending: "#F2A52B",
  Inquiry: "#C4A15A",
  Tentative: "#E0B15A",
  Confirmed: "#5A9D85",
  "Checked in": "#4E91D5",
  "Checked out": "#8B7BA7",
  Completed: "#6E8B74",
  Cancelled: "#EA5D5D",
  "No show": "#C4704F",
};

const money = (amount: number, currency: string) => {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "LKR",
      maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString()} ${currency}`;
  }
};

const periodFor = (date: Date) => ({ year: date.getFullYear(), month: date.getMonth() + 1 });

export default function DashboardScreen() {
  const { user } = useAuth();
  const propertyUid = user?.propertyUid || user?.propertyUids?.[0] || "";
  const today = isoDate(new Date());

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);
  const [currency, setCurrency] = useState("LKR");
  const [bookingIncome, setBookingIncome] = useState(0);
  const [lastMonthIncome, setLastMonthIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [netProfit, setNetProfit] = useState(0);
  const [paymentsReceived, setPaymentsReceived] = useState(0);
  const [outstanding, setOutstanding] = useState(0);
  const [arrivals, setArrivals] = useState(0);
  const [departures, setDepartures] = useState(0);
  const [inHouse, setInHouse] = useState(0);
  const [slices, setSlices] = useState<BookingData[]>([]);
  const [months, setMonths] = useState<MonthProgress[]>([]);
  const [recent, setRecent] = useState<
    {
      uid: string;
      name: string;
      bookingNumber: string;
      checkIn: string;
      checkOut: string;
      status: string;
      outstanding: number;
      currency: string;
    }[]
  >([]);

  useEffect(() => {
    if (!propertyUid) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    setError("");
    const now = new Date();
    const periods = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      return { date, period: periodFor(date) };
    });
    const spansYears = periods[0].date.getFullYear() !== periods[periods.length - 1].date.getFullYear();

    Promise.all([
      Promise.all(periods.map(({ period }) => getMonthlySummary(propertyUid, period))),
      getBookingRevenue(propertyUid),
      getOutstandingBalances(propertyUid),
      getOccupancy(propertyUid),
      getPaymentSummary(propertyUid, periods[periods.length - 1].period),
    ])
      .then(async ([summaries, revenue, balances, stays, payments]) => {
        if (!active) return;
        const summary = summaries[summaries.length - 1];
        const previous = summaries[summaries.length - 2];
        const code = summary.currency || "LKR";
        const counts = new Map<string, number>();
        for (const row of revenue) {
          const label = bookingStatusLabel(row.status) || "Other";
          counts.set(label, (counts.get(label) ?? 0) + 1);
        }
        const leadStays = stays.filter((stay) => stay.isLeadGuest);
        const guestNames = new Map(leadStays.map((stay) => [stay.bookingUid, stay.guestName]));
        const latest = revenue.slice(0, 5);
        const live = await Promise.all(
          latest.map((row) =>
            row.bookingUid
              ? getBookingFinancialSummary(row.bookingUid).catch(() => null)
              : Promise.resolve(null),
          ),
        );
        if (!active) return;

        setCurrency(code);
        setBookingIncome(summary.bookingIncome);
        setLastMonthIncome(previous?.bookingIncome ?? 0);
        setTotalExpenses(summary.totalExpenses);
        setNetProfit(summary.netProfit);
        setPaymentsReceived(payments.reduce((total, row) => total + (row.currency === code ? row.totalAmount : 0), 0));
        setOutstanding(balances.reduce((total, row) => total + (row.currency === code ? row.outstandingBalance : 0), 0));
        setArrivals(leadStays.filter((stay) => stay.checkInDate === today).length);
        setDepartures(leadStays.filter((stay) => stay.checkOutDate === today).length);
        setInHouse(leadStays.filter((stay) => stay.checkInDate <= today && stay.checkOutDate > today).length);
        setSlices(
          [...counts.entries()].map(([name, value]) => ({
            name,
            value,
            color: STATUS_COLORS[name] ?? "#6b807c",
          })),
        );
        setMonths(
          summaries.map((row, index) => {
            const date = periods[index].date;
            const monthName = date.toLocaleString(undefined, { month: "short" });
            return {
              label: spansYears ? `${monthName} ${String(date.getFullYear()).slice(2)}` : monthName,
              income: row.bookingIncome,
              expenses: row.totalExpenses,
              net: row.netProfit,
            };
          }),
        );
        setRecent(
          latest.map((row, index) => {
            const summaryRow = live[index];
            return {
              uid: row.bookingUid,
              name: summaryRow?.leadGuestName || row.leadGuestName || guestNames.get(row.bookingUid) || "Guest",
              bookingNumber: summaryRow?.bookingNumber || row.bookingNumber || "—",
              checkIn: formatDate(row.checkInDate),
              checkOut: formatDate(row.checkOutDate),
              status: bookingStatusLabel(row.status),
              outstanding: summaryRow?.outstandingBalance ?? row.outstandingBalance,
              currency: summaryRow?.currency || row.currency || code,
            };
          }),
        );
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof ApiError ? err.message : "Could not load the dashboard.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [propertyUid, tick, today]);

  const pending = slices.find((slice) => slice.name === "Pending")?.value ?? 0;

  return (
    <div className="dashboard-screen">
      <DashboardHero />

      {!propertyUid && <p className="dash-note">This account is not assigned to a property.</p>}
      {propertyUid && loading && <PageLoading label="Loading the property summary…" />}
      {propertyUid && !loading && error && <PageError message={error} onRetry={() => setTick((n) => n + 1)} />}

      {propertyUid && !loading && !error && (
        <>
          <div className="stats-grid">
            <StatCard icon={Users} title="Today's Arrivals" value={arrivals} subtitle="Guests checking in" theme="green" />
            <StatCard icon={LogOut} title="Today's Departures" value={departures} subtitle="Guests checking out" theme="yellow" />
            <StatCard icon={BedDouble} title="In house" value={inHouse} subtitle={`${pending} pending bookings`} theme="blue" />
            <StatCard icon={Wallet} title="Outstanding" value={money(outstanding, currency)} subtitle="Balances still due" theme="purple" />
          </div>

          <FinanceOverview
            currency={currency}
            bookingIncome={bookingIncome}
            paymentsReceived={paymentsReceived}
            totalExpenses={totalExpenses}
            bookingCount={slices.reduce((total, slice) => total + slice.value, 0)}
            netProfit={netProfit}
            lastMonthIncome={lastMonthIncome}
            thisMonthIncome={bookingIncome}
          />

          <div className="dashboard-grid top-grid">
            <BookingOverview slices={slices} />
            <RevenueOverview currency={currency} months={months} />
            <QuickActions />
          </div>

          <div className="dashboard-grid bottom-grid">
            <RecentBookings rows={recent} />
            <BookingStatus slices={slices} />
          </div>
        </>
      )}
{/* <BottomBanner /> */}
    </div>
  );
}
