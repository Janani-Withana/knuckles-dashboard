import {
  useEffect,
  useId,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { ApiError } from "../../../../../lib/api";
import {
  createBookingCharge,
  updateBookingCharge,
} from "../../../../../services/admin/paymentsService.service";
import type { BookingCharge } from "../../../../../types/payments";

interface Props {
  bookingUid: string;
  charge: BookingCharge | null;
  onClose: () => void;
  onSaved: () => void;
}

type Draft = {
  chargeTypeUid: string;
  description: string;
  quantity: string;
  unitPrice: string;
  discountAmount: string;
  taxAmount: string;
  notes: string;
};

const draftFrom = (charge: BookingCharge | null): Draft => ({
  chargeTypeUid: charge?.chargeTypeUid || "",
  description: charge?.description || "",
  quantity: charge ? String(charge.quantity) : "1",
  unitPrice: charge ? String(charge.unitPrice) : "",
  discountAmount: charge ? String(charge.discountAmount) : "0",
  taxAmount: charge ? String(charge.taxAmount) : "0",
  notes: charge?.notes || "",
});

const GUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function ChargeForm({
  bookingUid,
  charge,
  onClose,
  onSaved,
}: Props) {
  const titleId = useId();
  const [draft, setDraft] = useState<Draft>(draftFrom(charge));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [saving, onClose]);

  const onChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setDraft((d) => ({ ...d, [name]: value }));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!GUID_RE.test(draft.chargeTypeUid.trim()))
      return setError("Charge type UID must be a valid GUID.");
    if (!draft.description.trim()) return setError("Enter a description.");
    const quantity = Number(draft.quantity);
    const unitPrice = Number(draft.unitPrice);
    if (!Number.isFinite(quantity) || quantity <= 0)
      return setError("Quantity must be greater than 0.");
    if (!Number.isFinite(unitPrice) || unitPrice < 0)
      return setError("Enter a valid unit price.");

    setSaving(true);
    try {
      if (charge) {
        await updateBookingCharge(charge.uid, {
          chargeTypeUid: draft.chargeTypeUid.trim(),
          description: draft.description.trim(),
          quantity,
          unitPrice,
          discountAmount: Number(draft.discountAmount) || 0,
          taxAmount: Number(draft.taxAmount) || 0,
        });
      } else {
        await createBookingCharge(bookingUid, {
          chargeTypeUid: draft.chargeTypeUid.trim(),
          bookingUnitUid: null,
          description: draft.description.trim(),
          quantity,
          unitPrice,
          discountAmount: Number(draft.discountAmount) || 0,
          taxAmount: Number(draft.taxAmount) || 0,
          notes: draft.notes.trim(),
        });
      }
      onSaved();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not save this charge.",
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
          <h2 id={titleId}>{charge ? "Edit charge" : "Add charge"}</h2>
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
          <label className="pay-span">
            Charge type UID
            <input
              name="chargeTypeUid"
              value={draft.chargeTypeUid}
              onChange={onChange}
              placeholder="00000000-0000-0000-0000-000000000000"
            />
          </label>
          <label className="pay-span">
            Description
            <input
              name="description"
              value={draft.description}
              onChange={onChange}
              maxLength={300}
            />
          </label>
          <label>
            Quantity
            <input
              name="quantity"
              type="number"
              min={1}
              step={1}
              value={draft.quantity}
              onChange={onChange}
            />
          </label>
          <label>
            Unit price
            <input
              name="unitPrice"
              type="number"
              min={0}
              value={draft.unitPrice}
              onChange={onChange}
            />
          </label>
          <label>
            Discount amount
            <input
              name="discountAmount"
              type="number"
              min={0}
              value={draft.discountAmount}
              onChange={onChange}
            />
          </label>
          <label>
            Tax amount
            <input
              name="taxAmount"
              type="number"
              min={0}
              value={draft.taxAmount}
              onChange={onChange}
            />
          </label>
          {!charge && (
            <label className="pay-span">
              Notes
              <textarea
                name="notes"
                rows={2}
                value={draft.notes}
                onChange={onChange}
              />
            </label>
          )}

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
              {saving ? "Saving…" : charge ? "Save changes" : "Add charge"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
