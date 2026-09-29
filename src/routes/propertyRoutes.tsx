import { Navigate, Route } from "react-router-dom";

import DashboardScreen from "@/features/hotel/pages/Dashboard/DashboardScreen";
import PropertyDetailsScreen from "@/features/hotel/pages/Property/PropertyDetailsScreen";
import PropertySettingsScreen from "@/features/hotel/pages/Property/PropertySettingsScreen";
import AccommodationTypesScreen from "@/features/hotel/pages/Accommodation/AccommodationTypesScreen";
import NewReservationScreen from "@/features/hotel/pages/Reservations/NewReservationScreen";
import RoomsScreen from "@/features/hotel/pages/Accommodation/RoomsScreen";
import AvailabilityScreen from "@/features/hotel/pages/Accommodation/AvailabilityScreen";
import MealPlansScreen from "@/features/hotel/pages/Accommodation/MealPlansScreen";
import RatePlansScreen from "@/features/hotel/pages/Accommodation/RatePlansScreen";
import ReservationsScreen from "@/features/hotel/pages/Reservations/ReservationsScreen";
import GuestsScreen from "@/features/hotel/pages/Guests/GuestsScreen";
import FrontDeskScreen from "@/features/hotel/pages/FrontDesk/FrontDeskScreen";
import FinanceScreen from "@/features/hotel/pages/Finance/FinanceScreen";
import StaffScreen from "@/features/hotel/pages/Staff/StaffScreen";
import ReportsScreen from "@/features/hotel/pages/Reports/ReportsScreen";
import SettingsScreen from "@/features/hotel/pages/Settings/SettingsScreen";

export const propertyRoutes = (
  <>
    <Route index element={<Navigate to="dashboard" replace />} />
    <Route path="dashboard" element={<DashboardScreen />} />
    <Route path="details" element={<PropertyDetailsScreen />} />
    <Route path="property-settings" element={<PropertySettingsScreen />} />
    <Route path="accommodation/types" element={<AccommodationTypesScreen />} />
    <Route path="accommodation/rooms" element={<RoomsScreen />} />
    <Route path="accommodation/availability" element={<AvailabilityScreen />} />
    <Route path="accommodation/meal-plans" element={<MealPlansScreen />} />
    <Route path="accommodation/rate-plans" element={<RatePlansScreen />} />
    <Route path="reservations" element={<ReservationsScreen />} />
    <Route path="reservations/new" element={<NewReservationScreen />} />
    <Route path="guests" element={<GuestsScreen />} />
    <Route path="front-desk" element={<FrontDeskScreen />} />
    <Route path="finance" element={<FinanceScreen />} />
    <Route path="staff" element={<StaffScreen />} />
    <Route path="reports" element={<ReportsScreen />} />
    <Route path="account" element={<SettingsScreen />} />
  </>
);
