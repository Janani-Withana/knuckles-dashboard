import { useEffect, useId, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";
import {
  PageError,
  PageLoading,
} from "../../../../components/common/PageState";
import { ApiError } from "../../../../lib/api";
import { ROUTES } from "../../../../routes/paths";
import {
  deleteBookingCharge,
  getBookingFinancialSummary,
  getBookingInvoice,
  listBookingCharges,
  listBookingPayments,
} from "../../../../services/admin/paymentsService.service";
import { paymentMethodLabel } from "../../../../types/expense";
import {
  paymentStatusLabel,
  paymentTypeLabel,
  type BookingCharge,
  type BookingFinancialSummary,
  type BookingPayment,
  type Invoice,
} from "../../../../types/payments";
import { formatDate } from "../../Reservations/bookingDates";
import ChargeForm from "./components/ChargeForm";
import PaymentForm from "./components/PaymentForm";
import RefundForm from "./components/RefundForm";
import "./payments.css";

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

export default function BookingPaymentsScreen() {
  const { bookingUid = "" } = useParams();
  const navigate = useNavigate();
  const deleteTitleId = useId();

  const [summary, setSummary] = useState<BookingFinancialSummary | null>(null);
  const [charges, setCharges] = useState<BookingCharge[]>([]);
  const [payments, setPayments] = useState<BookingPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [invoiceError, setInvoiceError] = useState("");

  const [chargeEditor, setChargeEditor] = useState<
    "create" | BookingCharge | null
  >(null);
  const [pendingDelete, setPendingDelete] = useState<BookingCharge | null>(
    null,
  );
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
    ])
      .then(([s, c, p]) => {
        if (!active) return;
        setSummary(s);
        setCharges(c);
        setPayments(p);
      })
      .catch((err: unknown) => {
        if (active)
          setError(
            err instanceof ApiError
              ? err.message
              : "Could not load this booking's finances.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [bookingUid, tick]);

  useEffect(() => {
    if (!pendingDelete) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !deleting) setPendingDelete(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pendingDelete, deleting]);

  const chargesTotal = useMemo(
    () => charges.reduce((s, c) => s + c.totalAmount, 0),
    [charges],
  );
  const paymentsTotal = useMemo(
    () =>
      payments
        .filter((p) => p.status === 1)
        .reduce((s, p) => s + (p.amount - p.refundedAmount), 0),
    [payments],
  );

  const openInvoice = async () => {
    setInvoiceOpen(true);
    if (invoice) return;
    setInvoiceLoading(true);
    setInvoiceError("");
    try {
      setInvoice(await getBookingInvoice(bookingUid));
    } catch (err) {
      setInvoiceError(
        err instanceof ApiError ? err.message : "Could not load the invoice.",
      );
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
      setDeleteError(
        err instanceof ApiError ? err.message : "Could not delete this charge.",
      );
    } finally {
      setDeleting(false);
    }
  };

  if (!bookingUid) return <p className="pay-empty">No booking selected.</p>;

  return (
    <div className="pay-page">
      <div className="pay-head">
        <button
          type="button"
          className="pay-ghost"
          onClick={() => navigate(ROUTES.ADMIN_FINANCE_PAYMENTS)}
        >
          ← Payments
        </button>
      </div>

      {loading && <PageLoading />}
      {!loading && error && (
        <PageError message={error} onRetry={() => setTick((n) => n + 1)} />
      )}

      {!loading && !error && summary && (
        <>
          <header className="pay-hero">
            <div>
              <p className="pay-kicker">Booking</p>
              <h1>{summary.bookingNumber || "Booking"}</h1>
              <p>{summary.leadGuestName || "—"}</p>
            </div>
            <div className="pay-hero-actions">
              <button
                type="button"
                className="pay-ghost-hero"
                onClick={openInvoice}
              >
                View invoice
              </button>
              <button
                type="button"
                className="pay-add"
                onClick={() => setPaymentOpen(true)}
              >
                Record payment
              </button>
            </div>
          </header>

          <div className="pay-summary">
            <article className="pay-card">
              <span>Booking value</span>
              <strong>
                {money(summary.totalBookingValue, summary.currency)}
              </strong>
            </article>
            <article className="pay-card pay-card-sand">
              <span>Charges</span>
              <strong>
                {money(summary.totalCharges || chargesTotal, summary.currency)}
              </strong>
            </article>
            <article className="pay-card pay-card-sage">
              <span>Received</span>
              <strong>
                {money(
                  summary.totalPayments || paymentsTotal,
                  summary.currency,
                )}
              </strong>
            </article>
            <article
              className={`pay-card ${summary.outstandingBalance > 0 ? "pay-card-clay" : ""}`}
            >
              <span>Outstanding</span>
              <strong>
                {money(summary.outstandingBalance, summary.currency)}
              </strong>
            </article>
          </div>

          <section className="pay-panel">
            <div className="pay-panel-head">
              <h2>Charges</h2>
              <button
                type="button"
                className="pay-text"
                onClick={() => setChargeEditor("create")}
              >
                + Add charge
              </button>
            </div>

            {charges.length === 0 ? (
              <p className="pay-note">No charges added to this booking yet.</p>
            ) : (
              <div className="pay-table-wrap">
                <table className="pay-table">
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
                    {charges.map((c) => (
                      <tr key={c.uid}>
                        <td>
                          {c.description}
                          {c.notes && <span>{c.notes}</span>}
                        </td>
                        <td>{c.quantity}</td>
                        <td>{money(c.unitPrice, summary.currency)}</td>
                        <td>{money(c.discountAmount, summary.currency)}</td>
                        <td>{money(c.taxAmount, summary.currency)}</td>
                        <td>{money(c.totalAmount, summary.currency)}</td>
                        <td className="pay-row-actions">
                          <button
                            type="button"
                            className="pay-text"
                            onClick={() => setChargeEditor(c)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="pay-text"
                            onClick={() => {
                              setDeleteError("");
                              setPendingDelete(c);
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

          <section className="pay-panel">
            <div className="pay-panel-head">
              <h2>Payments</h2>
            </div>

            {payments.length === 0 ? (
              <p className="pay-note">No payments recorded yet.</p>
            ) : (
              <div className="pay-table-wrap">
                <table className="pay-table">
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
                    {payments.map((p) => (
                      <tr key={p.uid}>
                        <td>
                          {p.createdAt
                            ? formatDate(p.createdAt.slice(0, 10))
                            : "—"}
                        </td>
                        <td>{paymentTypeLabel(p.paymentType)}</td>
                        <td>{paymentMethodLabel(p.paymentMethod)}</td>
                        <td>{p.referenceNumber || "—"}</td>
                        <td>{paymentStatusLabel(p.status)}</td>
                        <td>{money(p.amount, p.currency)}</td>
                        <td>
                          {p.refundedAmount > 0
                            ? money(p.refundedAmount, p.currency)
                            : "—"}
                        </td>
                        <td className="pay-row-actions">
                          {p.status === 1 && p.refundedAmount < p.amount && (
                            <button
                              type="button"
                              className="pay-text"
                              onClick={() => setRefundTarget(p)}
                            >
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
            defaultCurrency={summary?.currency || "LKR"}
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
              className="pay-dialog"
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="pay-dialog-head">
                <h2>Invoice</h2>
                <button
                  type="button"
                  className="pay-close"
                  aria-label="Close"
                  onClick={() => setInvoiceOpen(false)}
                >
                  ×
                </button>
              </div>
              {invoiceLoading && <PageLoading />}
              {!invoiceLoading && invoiceError && (
                <PageError message={invoiceError} />
              )}
              {!invoiceLoading && !invoiceError && invoice && (
                <div className="pay-invoice">
                  <div className="pay-invoice-head">
                    <div>
                      <span>Invoice no.</span>
                      <strong>{invoice.invoiceNumber || "—"}</strong>
                    </div>
                    <div>
                      <span>Issued</span>
                      <strong>
                        {invoice.issuedDate
                          ? formatDate(invoice.issuedDate)
                          : "—"}
                      </strong>
                    </div>
                    <div>
                      <span>Due</span>
                      <strong>
                        {invoice.dueDate ? formatDate(invoice.dueDate) : "—"}
                      </strong>
                    </div>
                  </div>

                  {invoice.lineItems.length > 0 ? (
                    <div className="pay-table-wrap">
                      <table className="pay-table">
                        <thead>
                          <tr>
                            <th>Description</th>
                            <th>Qty</th>
                            <th>Unit price</th>
                            <th>Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {invoice.lineItems.map((line, i) => (
                            <tr key={i}>
                              <td>{line.description}</td>
                              <td>{line.quantity}</td>
                              <td>{money(line.unitPrice, invoice.currency)}</td>
                              <td>{money(line.amount, invoice.currency)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="pay-note">
                      No line items returned for this invoice.
                    </p>
                  )}

                  <div className="pay-invoice-totals">
                    <div>
                      <span>Subtotal</span>
                      <b>{money(invoice.subtotal, invoice.currency)}</b>
                    </div>
                    <div>
                      <span>Tax</span>
                      <b>{money(invoice.taxTotal, invoice.currency)}</b>
                    </div>
                    <div>
                      <span>Discount</span>
                      <b>{money(invoice.discountTotal, invoice.currency)}</b>
                    </div>
                    <div>
                      <span>Total</span>
                      <b>{money(invoice.totalAmount, invoice.currency)}</b>
                    </div>
                    <div>
                      <span>Paid</span>
                      <b>{money(invoice.amountPaid, invoice.currency)}</b>
                    </div>
                    <div className="pay-invoice-balance">
                      <span>Balance due</span>
                      <b>{money(invoice.balanceDue, invoice.currency)}</b>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>,
          document.body,
        )}

      {pendingDelete &&
        createPortal(
          <div
            className="pay-backdrop"
            onClick={() => !deleting && setPendingDelete(null)}
          >
            <div
              className="pay-dialog pay-confirm"
              role="dialog"
              aria-modal="true"
              aria-labelledby={deleteTitleId}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 id={deleteTitleId}>Delete "{pendingDelete.description}"?</h2>
              <p>This permanently removes the charge from this booking.</p>
              {deleteError && <p className="pay-error">{deleteError}</p>}
              <div className="pay-form-actions">
                <button
                  type="button"
                  className="pay-ghost"
                  onClick={() => setPendingDelete(null)}
                  disabled={deleting}
                >
                  Keep
                </button>
                <button
                  type="button"
                  className="pay-danger"
                  onClick={handleDeleteCharge}
                  disabled={deleting}
                >
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
