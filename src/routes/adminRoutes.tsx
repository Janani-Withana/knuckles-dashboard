import { Route } from "react-router-dom";

import DashboardScreen from "../screens/admin/Dashboard/DashboardScreen";
import PropertyDetailsScreen from "../screens/admin/Property/PropertyDetailsScreen";
import PropertySettingsScreen from "../screens/admin/Property/PropertySettingsScreen";
import AccommodationTypesScreen from "../screens/admin/Accommodation/AccommodationTypesScreen";
import NewReservationScreen from "../screens/admin/Reservations/NewReservationScreen";
import RoomsScreen from "../screens/admin/Accommodation/RoomsScreen";
import AvailabilityScreen from "../screens/admin/Accommodation/AvailabilityScreen";
import MealPlansScreen from "../screens/admin/Accommodation/MealPlansScreen";
import RatePlansScreen from "../screens/admin/Accommodation/RatePlansScreen";
import ReservationsScreen from "../screens/admin/Reservations/ReservationsScreen";
import GuestsScreen from "../screens/admin/Guests/GuestsScreen";
import FrontDeskScreen from "../screens/admin/FrontDesk/FrontDeskScreen";
import FinanceScreen from "../screens/admin/Finance/FinanceScreen";
import StaffScreen from "../screens/admin/Staff/StaffScreen";
import ReportsScreen from "../screens/admin/Reports/ReportsScreen";
import SettingsScreen from "../screens/admin/Settings/SettingsScreen";

import { ROUTES } from "./paths";

export const adminRoutes = (
  <>
    <Route path={ROUTES.ADMIN_DASHBOARD} element={<DashboardScreen />} />
    <Route
      path={ROUTES.ADMIN_PROPERTY_DETAILS}
      element={<PropertyDetailsScreen />}
    />
    <Route
      path={ROUTES.ADMIN_PROPERTY_SETTINGS}
      element={<PropertySettingsScreen />}
    />
    <Route
      path={ROUTES.ADMIN_ACCOMMODATION_TYPES}
      element={<AccommodationTypesScreen />}
    />
    <Route path={ROUTES.ADMIN_ROOMS} element={<RoomsScreen />} />
    <Route path={ROUTES.ADMIN_AVAILABILITY} element={<AvailabilityScreen />} />
    <Route path={ROUTES.ADMIN_MEAL_PLANS} element={<MealPlansScreen />} />
    <Route path={ROUTES.ADMIN_RATE_PLANS} element={<RatePlansScreen />} />
    <Route path={ROUTES.ADMIN_RESERVATIONS} element={<ReservationsScreen />} />
    <Route
      path={ROUTES.ADMIN_RESERVATION_NEW}
      element={<NewReservationScreen />}
    />
    <Route path={ROUTES.ADMIN_GUESTS} element={<GuestsScreen />} />
    <Route path={ROUTES.ADMIN_FRONT_DESK} element={<FrontDeskScreen />} />
    <Route path={ROUTES.ADMIN_FINANCE} element={<FinanceScreen />} />
    <Route path={ROUTES.ADMIN_STAFF} element={<StaffScreen />} />
    <Route path={ROUTES.ADMIN_REPORTS} element={<ReportsScreen />} />
    <Route path={ROUTES.ADMIN_SETTINGS} element={<SettingsScreen />} />
  </>
);
