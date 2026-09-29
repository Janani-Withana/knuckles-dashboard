import { useNavigate } from "react-router-dom";
import { useReservations } from "../../../hooks/useReservations";
import { ROUTES } from "../../../routes/paths";
import ReservationForm from "./components/ReservationForm";
import "./reservations.css";

export default function NewReservationScreen() {
  const { addReservation } = useReservations();
  const navigate = useNavigate();

  const goBack = () => navigate(ROUTES.ADMIN_RESERVATIONS);

  return (
    <div className="rsv-page">
      <div className="rsv-header">
        <div>
          <button type="button" className="rsv-back" onClick={goBack}>
            ← Back to reservations
          </button>
          <p className="rsv-eyebrow">Front desk</p>
          <h2>New reservation</h2>
          <p className="rsv-sub">
            Enter the stay details. Totals and profit calculate automatically.
          </p>
        </div>
      </div>

      <ReservationForm
        onSubmit={(data) => {
          addReservation(data);
          goBack();
        }}
        onCancel={goBack}
      />
    </div>
  );
}
