import React, { useState } from "react";
import {
  MEAL_PLANS,
  PAYMENT_METHODS,
  type MealPlan,
  type PaymentMethod,
  type Reservation,
} from "@/types/reservation";
import { calcTotals, formatLKR } from "@/utils/reservationCalc";

interface Props {
  onSubmit: (data: Omit<Reservation, "id">) => void;
  onCancel: () => void;
}

const empty = {
  guestName: "",
  contactNo: "",
  checkIn: "",
  checkOut: "",
  occupancy: "2",
  mealPlan: "BB" as MealPlan,
  roomRate: "",
  paymentMethod: "Cash" as PaymentMethod,
  cookingCharges: "0",
  discount: "0",
  foodCost: "0",
  staffCost: "0",
  utilitiesCost: "0",
  notes: "",
};

export default function ReservationForm({ onSubmit, onCancel }: Props) {
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");

  const totals = calcTotals(form);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.guestName.trim()) return setError("Enter the guest name.");
    if (!form.checkIn || !form.checkOut)
      return setError("Select check-in and check-out dates.");
    if (totals.nights < 1) return setError("Check-out must be after check-in.");
    if (!Number(form.roomRate))
      return setError("Enter the room rate per night.");

    setError("");
    onSubmit({
      guestName: form.guestName.trim(),
      contactNo: form.contactNo.trim(),
      checkIn: form.checkIn,
      checkOut: form.checkOut,
      occupancy: Number(form.occupancy) || 1,
      mealPlan: form.mealPlan,
      roomRate: Number(form.roomRate),
      paymentMethod: form.paymentMethod,
      cookingCharges: Number(form.cookingCharges) || 0,
      discount: Number(form.discount) || 0,
      foodCost: Number(form.foodCost) || 0,
      staffCost: Number(form.staffCost) || 0,
      utilitiesCost: Number(form.utilitiesCost) || 0,
      notes: form.notes.trim(),
    });
    setForm(empty);
  };

  return (
    <form className="rsv-form" onSubmit={handleSubmit}>
      <h3>Guest & stay</h3>
      <div className="rsv-grid">
        <label>
          Guest name
          <input
            name="guestName"
            value={form.guestName}
            onChange={handleChange}
          />
        </label>
        <label>
          Contact no
          <input
            name="contactNo"
            type="tel"
            value={form.contactNo}
            onChange={handleChange}
          />
        </label>
        <label>
          Check-in
          <input
            name="checkIn"
            type="date"
            value={form.checkIn}
            onChange={handleChange}
          />
        </label>
        <label>
          Check-out
          <input
            name="checkOut"
            type="date"
            value={form.checkOut}
            min={form.checkIn}
            onChange={handleChange}
          />
        </label>
        <label>
          No. of nights
          <input value={totals.nights} readOnly />
        </label>
        <label>
          Occupancy (guests)
          <input
            name="occupancy"
            type="number"
            min={1}
            value={form.occupancy}
            onChange={handleChange}
          />
        </label>
        <label>
          Meal type
          <select name="mealPlan" value={form.mealPlan} onChange={handleChange}>
            {MEAL_PLANS.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </label>
        <label>
          Payment method
          <select
            name="paymentMethod"
            value={form.paymentMethod}
            onChange={handleChange}
          >
            {PAYMENT_METHODS.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </label>
      </div>

      <h3>Charges</h3>
      <div className="rsv-grid">
        <label>
          Room rate / night (LKR)
          <input
            name="roomRate"
            type="number"
            min={0}
            value={form.roomRate}
            onChange={handleChange}
          />
        </label>
        <label>
          Total room revenue
          <input value={formatLKR(totals.roomRevenue)} readOnly />
        </label>
        <label>
          Cooking charges (LKR)
          <input
            name="cookingCharges"
            type="number"
            min={0}
            value={form.cookingCharges}
            onChange={handleChange}
          />
        </label>
        <label>
          Discount (LKR)
          <input
            name="discount"
            type="number"
            min={0}
            value={form.discount}
            onChange={handleChange}
          />
        </label>
        <label>
          Total booking value
          <input value={formatLKR(totals.bookingValue)} readOnly />
        </label>
        <label>
          Average per person
          <input value={formatLKR(totals.avgPerPerson)} readOnly />
        </label>
      </div>

      <h3>Costs & profit</h3>
      <div className="rsv-grid">
        <label>
          Food cost (LKR)
          <input
            name="foodCost"
            type="number"
            min={0}
            value={form.foodCost}
            onChange={handleChange}
          />
        </label>
        <label>
          Staff cost (LKR)
          <input
            name="staffCost"
            type="number"
            min={0}
            value={form.staffCost}
            onChange={handleChange}
          />
        </label>
        <label>
          Utilities cost (LKR)
          <input
            name="utilitiesCost"
            type="number"
            min={0}
            value={form.utilitiesCost}
            onChange={handleChange}
          />
        </label>
        <label>
          Total cost
          <input value={formatLKR(totals.totalCost)} readOnly />
        </label>
        <label>
          Total revenue
          <input value={formatLKR(totals.bookingValue)} readOnly />
        </label>
        <label>
          Profit
          <input
            value={formatLKR(totals.profit)}
            readOnly
            className={totals.profit < 0 ? "rsv-negative" : "rsv-positive"}
          />
        </label>
      </div>

      <label className="rsv-notes">
        Notes
        <textarea
          name="notes"
          rows={3}
          value={form.notes}
          onChange={handleChange}
        />
      </label>

      {error && <p className="rsv-error">{error}</p>}

      <div className="rsv-actions">
        <button
          type="button"
          className="rsv-btn rsv-btn-ghost"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button type="submit" className="rsv-btn">
          Save reservation
        </button>
      </div>
    </form>
  );
}
