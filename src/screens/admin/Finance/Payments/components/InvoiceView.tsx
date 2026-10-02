import { bookingStatusLabel } from "../../../../../types/booking";
import {
  paymentMethodLabel,
  paymentStatusLabel,
  paymentTypeLabel,
  type Invoice,
  type InvoiceParty,
} from "../../../../../types/payments";
import { formatDate } from "../../../Reservations/bookingDates";

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

const lineTypeLabel = (value: string) =>
  value
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const guestsLabel = (invoice: Invoice) =>
  [
    invoice.adults ? `${invoice.adults} adult${invoice.adults === 1 ? "" : "s"}` : "",
    invoice.children ? `${invoice.children} ${invoice.children === 1 ? "child" : "children"}` : "",
    invoice.infants ? `${invoice.infants} infant${invoice.infants === 1 ? "" : "s"}` : "",
  ]
    .filter(Boolean)
    .join(", ");

const Contact = ({ party }: { party: InvoiceParty }) => (
  <>
    {[party.address, party.phone, party.email].filter(Boolean).map((line) => (
      <p key={line}>{line}</p>
    ))}
  </>
);

const Meta = ({ label, value }: { label: string; value: string }) => (
  <div>
    <span>{label}</span>
    <strong>{value}</strong>
  </div>
);

export default function InvoiceView({ invoice }: { invoice: Invoice }) {
  const currency = invoice.currency || "LKR";
  const guests = guestsLabel(invoice);
  const showAdjustments = invoice.lines.some((line) => line.discountAmount !== 0 || line.taxAmount !== 0);

  const state = invoice.outstandingBalance <= 0 ? "paid" : invoice.netPaid > 0 ? "partial" : "unpaid";
  const stateLabel = { paid: "Paid", partial: "Partly paid", unpaid: "Unpaid" }[state];

  return (
    <div className="pay-invoice">
      <div className="pay-inv-actions">
        <button type="button" className="pay-ghost" onClick={() => window.print()}>
          Print or save as PDF
        </button>
      </div>

      <article className="pay-inv">
        <header className="pay-inv-top">
          <div className="pay-inv-brand">
            <h3>{invoice.property.name || "Property"}</h3>
            <Contact party={invoice.property} />
          </div>
          <div className="pay-inv-title">
            <span>Invoice</span>
            <strong>{invoice.invoiceNumber || "—"}</strong>
            <em className={`pay-inv-state ${state}`}>{stateLabel}</em>
          </div>
        </header>

        <section className="pay-inv-meta">
          <Meta label="Invoice date" value={invoice.invoiceDate ? formatDate(invoice.invoiceDate) : "—"} />
          <Meta label="Booking" value={invoice.bookingNumber || "—"} />
          <Meta label="Check-in" value={invoice.checkInDate ? formatDate(invoice.checkInDate) : "—"} />
          <Meta label="Check-out" value={invoice.checkOutDate ? formatDate(invoice.checkOutDate) : "—"} />
          <Meta
            label="Stay"
            value={`${invoice.nights} night${invoice.nights === 1 ? "" : "s"}${guests ? ` · ${guests}` : ""}`}
          />
        </section>

        <section className="pay-inv-bill">
          <span>Bill to</span>
          <strong>{invoice.billTo.name || "—"}</strong>
          <Contact party={invoice.billTo} />
          {invoice.status && <small>Booking status: {bookingStatusLabel(invoice.status)}</small>}
        </section>

        {invoice.lines.length > 0 ? (
          <div className="pay-inv-scroll">
            <table className="pay-inv-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th className="num">Qty</th>
                  <th className="num">Unit price</th>
                  {showAdjustments && <th className="num">Discount</th>}
                  {showAdjustments && <th className="num">Tax</th>}
                  <th className="num">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.lines.map((line, index) => (
                  <tr key={`${line.lineType}-${line.description}-${index}`}>
                    <td>
                      {line.description || "—"}
                      {line.lineType && <small>{lineTypeLabel(line.lineType)}</small>}
                    </td>
                    <td className="num">{line.quantity}</td>
                    <td className="num">{money(line.unitPrice, currency)}</td>
                    {showAdjustments && <td className="num">{money(line.discountAmount, currency)}</td>}
                    {showAdjustments && <td className="num">{money(line.taxAmount, currency)}</td>}
                    <td className="num">{money(line.totalAmount, currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="pay-note">No line items returned for this invoice.</p>
        )}

        <section className="pay-inv-summary">
          <dl>
            <div>
              <dt>Room revenue</dt>
              <dd>{money(invoice.roomRevenue, currency)}</dd>
            </div>
            {invoice.extraIncome !== 0 && (
              <div>
                <dt>Extra charges</dt>
                <dd>{money(invoice.extraIncome, currency)}</dd>
              </div>
            )}
            {invoice.discountAmount !== 0 && (
              <div>
                <dt>Discount</dt>
                <dd>−{money(Math.abs(invoice.discountAmount), currency)}</dd>
              </div>
            )}
            {invoice.taxAmount !== 0 && (
              <div>
                <dt>Tax</dt>
                <dd>{money(invoice.taxAmount, currency)}</dd>
              </div>
            )}
            {invoice.serviceCharge !== 0 && (
              <div>
                <dt>Service charge</dt>
                <dd>{money(invoice.serviceCharge, currency)}</dd>
              </div>
            )}
            <div className="pay-inv-total">
              <dt>Total</dt>
              <dd>{money(invoice.totalBookingValue, currency)}</dd>
            </div>
            <div>
              <dt>Payments received</dt>
              <dd>{money(invoice.paymentsReceived, currency)}</dd>
            </div>
            {invoice.refundsPaid !== 0 && (
              <div>
                <dt>Refunds</dt>
                <dd>−{money(Math.abs(invoice.refundsPaid), currency)}</dd>
              </div>
            )}
          </dl>
          <div className={`pay-inv-balance ${state}`}>
            <span>{state === "paid" ? "Balance" : "Balance due"}</span>
            <strong>{money(invoice.outstandingBalance, currency)}</strong>
          </div>
        </section>

        <section className="pay-inv-section">
          <h4>Payments</h4>
          {invoice.payments.length === 0 ? (
            <p className="pay-note">No payments on this invoice.</p>
          ) : (
            <div className="pay-inv-scroll">
              <table className="pay-inv-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Method</th>
                    <th>Reference</th>
                    <th>Status</th>
                    <th className="num">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.payments.map((payment, index) => (
                    <tr key={payment.uid || index}>
                      <td>{payment.paidAt ? formatDate(payment.paidAt) : "—"}</td>
                      <td>
                        {paymentMethodLabel(payment.paymentMethod)}
                        <small>{paymentTypeLabel(payment.paymentType)}</small>
                      </td>
                      <td>{payment.referenceNumber || "—"}</td>
                      <td>
                        <span className="pay-inv-pill">{paymentStatusLabel(payment.status)}</span>
                      </td>
                      <td className="num">{money(payment.amount, currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {invoice.refunds.length > 0 && (
          <section className="pay-inv-section">
            <h4>Refunds</h4>
            <div className="pay-inv-scroll">
              <table className="pay-inv-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Reference</th>
                    <th>Reason</th>
                    <th className="num">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.refunds.map((refund, index) => (
                    <tr key={refund.uid || index}>
                      <td>{refund.paidAt ? formatDate(refund.paidAt) : "—"}</td>
                      <td>{refund.referenceNumber || "—"}</td>
                      <td>{refund.reason || "—"}</td>
                      <td className="num">{money(refund.amount, currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <footer className="pay-inv-foot">Thank you for staying with us.</footer>
      </article>
    </div>
  );
}