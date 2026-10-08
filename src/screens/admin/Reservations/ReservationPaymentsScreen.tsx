import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";
import { PageError, PageLoading } from "../../../components/common/PageState";
import { ApiError } from "../../../lib/api";
import { adminReservationPath } from "../../../routes/paths";
import { getBooking } from "../../../services/admin/bookingDetailsService.service";
import {
  deleteBookingCharge,
  getBookingFinancialSummary,
  getBookingInvoice,
  listBookingCharges,
  listBookingPayments,
} from "../../../services/admin/paymentsService.service";
import {
  paymentMethodLabel,
  PAYMENT_STATUS_PARTIALLY_REFUNDED,
  PAYMENT_STATUS_REFUNDED,
  paymentStatusLabel,
  paymentTypeLabel,
  type BookingCharge,
  type BookingFinancialSummary,
  type BookingPayment,
  type Invoice,
} from "../../../types/payments";
import ChargeForm from "../Finance/Payments/components/ChargeForm";
import InvoiceView from "../Finance/Payments/components/InvoiceView";
import PaymentForm from "../Finance/Payments/components/PaymentForm";
import RefundForm from "../Finance/Payments/components/RefundForm";
import { formatDate } from "./bookingDates";
import "../Finance/Payments/payments.css";
import "./reservationPayments.css";

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

const STATUS_MODIFIER: Record<number, string> = {
  0: "pending",
  1: "completed",
  2: "failed",
  3: "cancelled",
  [PAYMENT_STATUS_REFUNDED]: "refunded",
  [PAYMENT_STATUS_PARTIALLY_REFUNDED]: "partial",
};

const statusClass = (status: number) => `rpay-status rpay-status-${STATUS_MODIFIER[status] ?? "unknown"}`;

export default function ReservationPaymentsScreen() {
  const { bookingUid = "" } = useParams();
  const navigate = useNavigate();
  const deleteTitleId = useId();

  const [summary, setSummary] = useState<BookingFinancialSummary | null>(null);
  const [guestName, setGuestName] = useState("");
  const [charges, setCharges] = useState<BookingCharge[]>([]);
  const [payments, setPayments] = useState<BookingPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [invoiceError, setInvoiceError] = useState("");

  const [chargeEditor, setChargeEditor] = useState<"create" | BookingCharge | null>(null);
  const [pendingDelete, setPendingDelete] = useState<BookingCharge | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [refundTarget, setRefundTarget] = useState<BookingPayment | null>(null);

  useEffect(() => {
    if (!bookingUid) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    setError("");
    Promise.all([
      getBookingFinancialSummary(bookingUid),
      listBookingCharges(bookingUid),
      listBookingPayments(bookingUid),
      getBooking(bookingUid).catch(() => null),
    ])
      .then(([nextSummary, nextCharges, nextPayments, booking]) => {
        if (!active) return;
        setSummary(nextSummary);
        setCharges(nextCharges);
        setPayments(nextPayments);
        setGuestName(nextSummary.leadGuestName || booking?.leadGuestName || "");
        setInvoice(null);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof ApiError ? err.message : "Could not load this booking's payments.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [bookingUid, tick]);

  useEffect(() => {
    if (!pendingDelete && !invoiceOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || deleting) return;
      setPendingDelete(null);
      setInvoiceOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pendingDelete, invoiceOpen, deleting]);

  const openInvoice = async () => {
    setInvoiceOpen(true);
    if (invoice) return;
    setInvoiceLoading(true);
    setInvoiceError("");
    try {
      setInvoice(await getBookingInvoice(bookingUid));
    } catch (err) {
      setInvoiceError(err instanceof ApiError ? err.message : "Could not load the invoice.");
    } finally {
      setInvoiceLoading(false);
    }
  };

  const handleDeleteCharge = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await deleteBookingCharge(pendingDelete.uid);
      setPendingDelete(null);
      setTick((n) => n + 1);
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : "Could not delete this charge.");
    } finally {
      setDeleting(false);
    }
  };

  if (!bookingUid) return <p className="rpay-empty">No booking selected.</p>;

  const currency = summary?.currency || "LKR";

  return (
    <div className="rpay-page">
      <button type="button" className="rpay-back" onClick={() => navigate(adminReservationPath(bookingUid))}>
        ← Reservation
      </button>

      {loading && <PageLoading label="Loading payments…" />}
      {!loading && error && <PageError message={error} onRetry={() => setTick((n) => n + 1)} />}

      {!loading && !error && summary && (
        <>
          <header className="rpay-hero">
            <div>
              <p className="rpay-kicker">Payments</p>
              <h1>{summary.bookingNumber || "Booking"}</h1>
              <p>{guestName || "Guest"} · balance still due {money(summary.outstandingBalance, currency)}</p>
            </div>
            <div className="rpay-hero-actions">
              <button type="button" className="rpay-ghost" onClick={openInvoice}>
                View invoice
              </button>
              <button type="button" className="rpay-add" onClick={() => setPaymentOpen(true)}>
                Record payment
              </button>
            </div>
          </header>

          <div className="rpay-summary">
            <article className="rpay-card">
              <span>Booking value</span>
              <strong>{money(summary.totalBookingValue, currency)}</strong>
            </article>
            <article className="rpay-card rpay-card-sand">
              <span>Charges</span>
              <strong>{money(summary.totalCharges, currency)}</strong>
            </article>
            <article className="rpay-card rpay-card-sage">
              <span>Received</span>
              <strong>{money(summary.totalPayments, currency)}</strong>
            </article>
            <article className="rpay-card">
              <span>Refunded</span>
              <strong>{money(summary.totalRefunds, currency)}</strong>
            </article>
            <article className={`rpay-card ${summary.outstandingBalance > 0 ? "rpay-card-clay" : "rpay-card-sage"}`}>
              <span>Outstanding</span>
              <strong>{money(summary.outstandingBalance, currency)}</strong>
            </article>
          </div>

          <section className="rpay-panel">
            <div className="rpay-panel-head">
              <h2>Charges</h2>
              <button type="button" className="rpay-text" onClick={() => setChargeEditor("create")}>
                + Add charge
              </button>
            </div>
            {charges.length === 0 ? (
              <p className="rpay-note">No extra charges on this booking yet.</p>
            ) : (
              <div className="rpay-table-wrap">
                <table className="rpay-table">
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th>Qty</th>
                      <th>Unit price</th>
                      <th>Discount</th>
                      <th>Tax</th>
                      <th>Total</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {charges.map((charge) => (
                      <tr key={charge.uid}>
                        <td>
                          {charge.description || charge.chargeTypeName || "Charge"}
                          {charge.notes && <span>{charge.notes}</span>}
                        </td>
                        <td>{charge.quantity}</td>
                        <td>{money(charge.unitPrice, currency)}</td>
                        <td>{money(charge.discountAmount, currency)}</td>
                        <td>{money(charge.taxAmount, currency)}</td>
                        <td>{money(charge.totalAmount, currency)}</td>
                        <td className="rpay-row-actions">
                          <button type="button" className="rpay-text" onClick={() => setChargeEditor(charge)}>
                            Edit
                          </button>
                          <button
                            type="button"
                            className="rpay-text"
                            onClick={() => {
                              setDeleteError("");
                              setPendingDelete(charge);
                            }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="rpay-panel">
            <div className="rpay-panel-head">
              <h2>Payments</h2>
            </div>
            {payments.length === 0 ? (
              <p className="rpay-note">No payments recorded yet. Record the deposit or the balance when the guest pays.</p>
            ) : (
              <div className="rpay-table-wrap">
                <table className="rpay-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Method</th>
                      <th>Reference</th>
                      <th>Status</th>
                      <th>Amount</th>
                      <th>Refunded</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr key={payment.uid}>
                        <td>{payment.createdAt ? formatDate(payment.createdAt.slice(0, 10)) : "—"}</td>
                        <td>{paymentTypeLabel(payment.paymentType)}</td>
                        <td>{paymentMethodLabel(payment.paymentMethod)}</td>
                        <td>{payment.referenceNumber || "—"}</td>
                        <td>
                          <span className={statusClass(payment.status)}>{paymentStatusLabel(payment.status)}</span>
                        </td>
                        <td>{money(payment.amount, payment.currency || currency)}</td>
                        <td>
                          {payment.status === PAYMENT_STATUS_REFUNDED
                            ? money(payment.refundedAmount > 0 ? payment.refundedAmount : payment.amount, payment.currency || currency)
                            : payment.refundedAmount > 0
                              ? money(payment.refundedAmount, payment.currency || currency)
                              : "—"}
                        </td>
                        <td className="rpay-row-actions">
                          {(payment.status === 1 || payment.status === PAYMENT_STATUS_PARTIALLY_REFUNDED) &&
                            payment.refundedAmount < payment.amount && (
                            <button type="button" className="rpay-text" onClick={() => setRefundTarget(payment)}>
                              Refund
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {chargeEditor &&
        createPortal(
          <ChargeForm
            bookingUid={bookingUid}
            charge={chargeEditor === "create" ? null : chargeEditor}
            onClose={() => setChargeEditor(null)}
            onSaved={() => {
              setChargeEditor(null);
              setTick((n) => n + 1);
            }}
          />,
          document.body,
        )}

      {paymentOpen &&
        createPortal(
          <PaymentForm
            bookingUid={bookingUid}
            defaultCurrency={currency}
            onClose={() => setPaymentOpen(false)}
            onSaved={() => {
              setPaymentOpen(false);
              setTick((n) => n + 1);
            }}
          />,
          document.body,
        )}

      {refundTarget &&
        createPortal(
          <RefundForm
            payment={refundTarget}
            onClose={() => setRefundTarget(null)}
            onSaved={() => {
              setRefundTarget(null);
              setTick((n) => n + 1);
            }}
          />,
          document.body,
        )}

      {invoiceOpen &&
        createPortal(
          <div className="pay-backdrop" onClick={() => setInvoiceOpen(false)}>
            <div
              className="pay-dialog pay-invoice-dialog"
              role="dialog"
              aria-modal="true"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="pay-dialog-head">
                <h2>Invoice</h2>
                <button type="button" className="pay-close" aria-label="Close" onClick={() => setInvoiceOpen(false)}>
                  ×
                </button>
              </div>
              {invoiceLoading && <PageLoading />}
              {!invoiceLoading && invoiceError && <PageError message={invoiceError} />}
              {!invoiceLoading && !invoiceError && invoice && <InvoiceView invoice={invoice} />}
            </div>
          </div>,
          document.body,
        )}

      {pendingDelete &&
        createPortal(
          <div className="pay-backdrop" onClick={() => !deleting && setPendingDelete(null)}>
            <div
              className="pay-dialog pay-confirm"
              role="dialog"
              aria-modal="true"
              aria-labelledby={deleteTitleId}
              onClick={(event) => event.stopPropagation()}
            >
              <h2 id={deleteTitleId}>Delete "{pendingDelete.description || "this charge"}"?</h2>
              <p>This removes the charge from this booking.</p>
              {deleteError && <p className="pay-error">{deleteError}</p>}
              <div className="pay-form-actions">
                <button type="button" className="pay-ghost" onClick={() => setPendingDelete(null)} disabled={deleting}>
                  Keep
                </button>
                <button type="button" className="pay-danger" onClick={handleDeleteCharge} disabled={deleting}>
                  {deleting ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}