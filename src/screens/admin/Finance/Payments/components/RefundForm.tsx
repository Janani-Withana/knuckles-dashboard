import {
  useEffect,
  useId,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { ApiError } from "../../../../../lib/api";
import { refundBookingPayment } from "../../../../../services/admin/paymentsService.service";
import type { BookingPayment } from "../../../../../types/payments";

interface Props {
  payment: BookingPayment;
  onClose: () => void;
  onSaved: () => void;
}

export default function RefundForm({ payment, onClose, onSaved }: Props) {
  const titleId = useId();
  const refundable = payment.amount - payment.refundedAmount;
  const [amount, setAmount] = useState(String(refundable));
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [saving, onClose]);

  const onAmountChange = (e: ChangeEvent<HTMLInputElement>) =>
    setAmount(e.target.value);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0)
      return setError("Enter an amount greater than 0.");
    if (value > refundable)
      return setError(
        `Cannot refund more than ${refundable.toLocaleString()}.`,
      );
    if (!reason.trim()) return setError("Enter a reason for the refund.");

    setSaving(true);
    try {
      await refundBookingPayment(payment.uid, {
        amount: value,
        reason: reason.trim(),
      });
      onSaved();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not process this refund.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pay-backdrop" onClick={() => !saving && onClose()}>
      <div
        className="pay-dialog pay-confirm"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id={titleId}>Refund payment</h2>
        <p>
          Reference {payment.referenceNumber || "—"} · up to{" "}
          {refundable.toLocaleString()} {payment.currency} refundable.
        </p>
        <form className="pay-form" onSubmit={onSubmit}>
          <label className="pay-span">
            Amount
            <input
              type="number"
              min={0}
              max={refundable}
              value={amount}
              onChange={onAmountChange}
            />
          </label>
          <label className="pay-span">
            Reason
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Overpayment"
            />
          </label>

          {error && <p className="pay-error">{error}</p>}

          <div className="pay-form-actions">
            <button
              type="button"
              className="pay-ghost"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button type="submit" className="pay-danger" disabled={saving}>
              {saving ? "Processing…" : "Refund"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
