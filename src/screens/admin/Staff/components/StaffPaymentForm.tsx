import { useState, type ChangeEvent, type FormEvent } from "react";
import { ApiError } from "../../../../lib/api";
import { createStaffPayment } from "../../../../services/admin/staffService.service";
import { PAYMENT_METHOD_LABELS } from "../../../../types/staff";

const empty = {
  periodStart: "",
  periodEnd: "",
  basicAmount: "",
  overtimeAmount: "0",
  bonusAmount: "0",
  deductionAmount: "0",
  paymentMethod: "0",
  referenceNumber: "",
};

export default function StaffPaymentForm({
  staffUid,
  onSaved,
}: {
  staffUid: string;
  onSaved: () => void;
}) {
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.periodStart || !form.periodEnd)
      return setError("Select the pay period.");
    if (!form.basicAmount || Number(form.basicAmount) <= 0)
      return setError("Enter the basic amount.");
    if (!form.referenceNumber.trim())
      return setError("Enter a reference number.");

    setLoading(true);
    try {
      await createStaffPayment(staffUid, {
        periodStart: form.periodStart,
        periodEnd: form.periodEnd,
        basicAmount: Number(form.basicAmount),
        overtimeAmount: Number(form.overtimeAmount) || 0,
        bonusAmount: Number(form.bonusAmount) || 0,
        deductionAmount: Number(form.deductionAmount) || 0,
        paymentMethod: Number(form.paymentMethod),
        referenceNumber: form.referenceNumber.trim(),
      });
      setForm(empty);
      onSaved();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not save the payment.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="rsv-form sa-flat" onSubmit={handleSubmit}>
      <div className="rsv-grid">
        <label>
          Period start
          <input
            name="periodStart"
            type="date"
            value={form.periodStart}
            onChange={handleChange}
          />
        </label>
        <label>
          Period end
          <input
            name="periodEnd"
            type="date"
            value={form.periodEnd}
            onChange={handleChange}
          />
        </label>
        <label>
          Basic amount
          <input
            name="basicAmount"
            type="number"
            min={0}
            value={form.basicAmount}
            onChange={handleChange}
          />
        </label>
        <label>
          Overtime amount
          <input
            name="overtimeAmount"
            type="number"
            min={0}
            value={form.overtimeAmount}
            onChange={handleChange}
          />
        </label>
        <label>
          Bonus amount
          <input
            name="bonusAmount"
            type="number"
            min={0}
            value={form.bonusAmount}
            onChange={handleChange}
          />
        </label>
        <label>
          Deduction amount
          <input
            name="deductionAmount"
            type="number"
            min={0}
            value={form.deductionAmount}
            onChange={handleChange}
          />
        </label>
        <label>
          Payment method
          <select
            name="paymentMethod"
            value={form.paymentMethod}
            onChange={handleChange}
          >
            {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Reference number
          <input
            name="referenceNumber"
            value={form.referenceNumber}
            onChange={handleChange}
            placeholder="SAL-0826"
          />
        </label>
      </div>

      {error && <p className="rsv-error">{error}</p>}

      <div className="rsv-actions">
        <button type="submit" className="rsv-btn" disabled={loading}>
          {loading ? "Saving…" : "Record payment"}
        </button>
      </div>
    </form>
  );
}
