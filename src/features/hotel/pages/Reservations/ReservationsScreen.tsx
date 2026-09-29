import { useNavigate } from "react-router-dom";
import { useReservations } from "@/hooks/useReservations";
import { ROUTES } from "@/routes/paths";
import ReservationCharts from "./components/ReservationCharts";
import ReservationSummary from "./components/ReservationSummary";
import ReservationTable from "./components/ReservationTable";
import "@/styles/reservations.css";

export default function ReservationsScreen() {
  const { reservations, removeReservation } = useReservations();
  const navigate = useNavigate();

  return (
    <div className="rsv-page">
      <div className="rsv-header">
        <div>
          <p className="rsv-eyebrow">Front desk</p>
          <h2>Reservations</h2>
          <p className="rsv-sub">
            Track bookings, revenue and profit for Knuckles Retreat.
          </p>
        </div>
        <button
          className="rsv-btn"
          onClick={() => navigate(ROUTES.ADMIN_RESERVATION_NEW)}
        >
          + New reservation
        </button>
      </div>

      <ReservationSummary items={reservations} />

      {reservations.length > 0 && <ReservationCharts items={reservations} />}

      <ReservationTable items={reservations} onDelete={removeReservation} />
    </div>
  );
}
