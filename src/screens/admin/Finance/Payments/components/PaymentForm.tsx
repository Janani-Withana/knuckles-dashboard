import {
  useEffect,
  useId,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { ApiError } from "../../../../../lib/api";
import { createBookingPayment } from "../../../../../services/admin/paymentsService.service";
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_PARTIALLY_REFUNDED,
  PAYMENT_STATUS_REFUNDED,
  PAYMENT_TYPE_LABELS,
} from "../../../../../types/payments";

interface Props {
  bookingUid: string;
  defaultCurrency: string;
  onClose: () => void;
  onSaved: () => void;
}

export default function PaymentForm({
  bookingUid,
  defaultCurrency,
  onClose,
  onSaved,
}: Props) {
  const titleId = useId();
  const [form, setForm] = useState({
    paymentMethod: "0",
    paymentType: "1",
    amount: "",
    currency: defaultCurrency || "LKR",
    status: "1",
    referenceNumber: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [saving, onClose]);

  const onChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((f) => ({
      ...f,
      [name]: name === "currency" ? value.toUpperCase() : value,
    }));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount <= 0)
      return setError("Enter an amount greater than 0.");
    if (form.currency.trim().length !== 3)
      return setError("Currency must be a 3-letter code.");
    if (!form.referenceNumber.trim())
      return setError("Enter a reference number.");

    setSaving(true);
    try {
      await createBookingPayment(bookingUid, {
        paymentMethod: Number(form.paymentMethod),
        paymentType: Number(form.paymentType),
        amount,
        currency: form.currency.trim().toUpperCase(),
        status: Number(form.status),
        referenceNumber: form.referenceNumber.trim(),
      });
      onSaved();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not record this payment.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pay-backdrop" onClick={() => !saving && onClose()}>
      <div
        className="pay-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pay-dialog-head">
          <h2 id={titleId}>Record payment</h2>
          <button
            type="button"
            className="pay-close"
            aria-label="Close"
            onClick={() => !saving && onClose()}
          >
            ×
          </button>
        </div>
        <form className="pay-form" onSubmit={onSubmit}>
          <label>
            Payment type
            <select
              name="paymentType"
              value={form.paymentType}
              onChange={onChange}
            >
              {Object.entries(PAYMENT_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Payment method
            <select
              name="paymentMethod"
              value={form.paymentMethod}
              onChange={onChange}
            >
              {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Amount
            <input
              name="amount"
              type="number"
              min={0}
              value={form.amount}
              onChange={onChange}
            />
          </label>
          <label>
            Currency
            <input
              name="currency"
              value={form.currency}
              onChange={onChange}
              maxLength={3}
            />
          </label>
          <label>
            Status
            <select name="status" value={form.status} onChange={onChange}>
              {Object.entries(PAYMENT_STATUS_LABELS)
                .filter(([value]) => {
                  const status = Number(value);
                  return status !== PAYMENT_STATUS_REFUNDED && status !== PAYMENT_STATUS_PARTIALLY_REFUNDED;
                })
                .map(([value, label]) => (
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
              onChange={onChange}
              placeholder="RCPT-1001"
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
            <button type="submit" className="pay-save" disabled={saving}>
              {saving ? "Saving…" : "Record payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
