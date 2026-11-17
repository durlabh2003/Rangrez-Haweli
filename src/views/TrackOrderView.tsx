import React, { useState } from 'react';
import { CheckCircle2, FileText, Package, Printer, Search, Truck } from 'lucide-react';
import type { Order } from '../types';
import { useStore } from '../context/StoreContext';

const PIPELINE_STEPS: Order['orderStatus'][] = [
  'Confirmed',
  'Artisan Packed',
  'Shipped',
  'Delivered',
];

export function TrackOrderView() {
  const { navigate } = useStore();
  const [orderNumber, setOrderNumber] = useState('');
  const [contact, setContact] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState<Order | null>(null);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setOrder(null);
    setLoading(true);
    try {
      const res = await fetch('/api/orders/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber: orderNumber.trim(), contact: contact.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not locate order.');
      } else {
        setOrder(data.order);
      }
    } catch {
      setError('Network error checking order status.');
    } finally {
      setLoading(false);
    }
  };

  const activeIdx = order ? PIPELINE_STEPS.indexOf(order.orderStatus) : -1;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--rh-primary)] inline-flex items-center gap-1.5">
          <Truck className="w-4 h-4" /> Haveli Dispatch Tracker
        </p>
        <h1 className="font-display text-3xl font-bold mt-1">Track Your Order & GST Invoice</h1>
        <p className="text-sm text-[var(--rh-ink-muted)] mt-1">
          Enter your <span className="font-mono-num">RH-2026-XXXX</span> order number along with the email or mobile
          number used at checkout.
        </p>
      </div>

      <form
        onSubmit={handleLookup}
        className="bg-[var(--rh-surface)] border border-[var(--rh-border)] rounded-2xl p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end"
      >
        <div className="sm:col-span-5 space-y-1">
          <label htmlFor="track-order-no" className="text-xs font-medium text-[var(--rh-ink-muted)]">
            Order Number
          </label>
          <input
            id="track-order-no"
            required
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
            placeholder="e.g. RH-2026-4812"
            className="w-full min-h-[44px] px-3 py-2 text-sm font-mono-num rounded-lg border border-[var(--rh-border)] bg-[var(--rh-bg)]"
          />
        </div>

        <div className="sm:col-span-5 space-y-1">
          <label htmlFor="track-contact" className="text-xs font-medium text-[var(--rh-ink-muted)]">
            Checkout Email or Phone
          </label>
          <input
            id="track-contact"
            required
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="aarav@example.com or 9829055412"
            className="w-full min-h-[44px] px-3 py-2 text-sm rounded-lg border border-[var(--rh-border)] bg-[var(--rh-bg)]"
          />
        </div>

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-[44px] px-4 py-2 text-xs font-semibold rounded-lg bg-[var(--rh-primary)] text-white hover:bg-[var(--rh-primary-hover)] inline-flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Search className="w-4 h-4" />
            <span>{loading ? 'Checking…' : 'Track'}</span>
          </button>
        </div>
      </form>

      {error && (
        <div
          role="alert"
          className="p-4 rounded-xl border border-[var(--rh-primary)]/40 bg-[var(--rh-primary)]/5 text-sm text-[var(--rh-primary)]"
        >
          {error}
        </div>
      )}

      {order && (
        <div className="bg-[var(--rh-surface)] border border-[var(--rh-border)] rounded-2xl p-6 space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--rh-border)] pb-4">
            <div>
              <p className="text-xs font-mono-num text-[var(--rh-peacock)] font-semibold">
                {order.orderNumber} · {order.channel} · Placed{' '}
                {new Date(order.createdAt).toLocaleDateString('en-IN')}
                {order.isMock && ' · Sample'}
              </p>
              <h2 className="font-display text-2xl font-bold mt-0.5">
                {order.customerName} — {order.shippingAddress.city}, {order.shippingAddress.state}
              </h2>
              <p className="text-xs text-[var(--rh-ink-muted)] mt-1">
                Payment: {order.paymentMethod} ({order.paymentStatus})
              </p>
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 min-h-[40px] text-xs font-semibold rounded-lg border border-[var(--rh-border)] inline-flex items-center gap-1.5 hover:border-[var(--rh-primary)] cursor-pointer"
            >
              <Printer className="w-4 h-4" /> Print Invoice
            </button>
          </div>

          {order.orderStatus === 'Cancelled' ? (
            <div className="p-4 rounded-xl bg-[var(--rh-primary)]/10 text-sm font-semibold text-[var(--rh-primary)]">
              This order has been cancelled.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {PIPELINE_STEPS.map((st, idx) => {
                const done = idx <= activeIdx;
                return (
                  <div
                    key={st}
                    className={`p-3 rounded-xl border text-xs ${
                      done
                        ? 'border-[var(--rh-peacock)] bg-[var(--rh-peacock)]/10 text-[var(--rh-ink)]'
                        : 'border-[var(--rh-border)] text-[var(--rh-ink-muted)]'
                    }`}
                  >
                    <span className="inline-flex items-center gap-1 font-semibold">
                      {done ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[var(--rh-peacock)]" />
                      ) : (
                        <Package className="w-3.5 h-3.5" />
                      )}
                      {idx + 1}. {st}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="divide-y divide-[var(--rh-border)] text-sm">
            {order.items.map((item, idx) => (
              <div key={idx} className="py-3 flex justify-between gap-4">
                <div>
                  <p className="font-medium">
                    {item.name} ({item.variantLabel}) × {item.quantity}
                  </p>
                  <p className="text-xs text-[var(--rh-ink-muted)] font-mono-num">
                    HSN {item.hsnCode} · GST {item.gstRate}% (inclusive)
                  </p>
                </div>
                <span className="font-mono-num font-semibold">
                  ₹{(item.unitPrice * item.quantity).toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>

          {order.invoice && (
            <div className="p-4 rounded-xl bg-[var(--rh-bg)] border border-[var(--rh-border)] text-xs space-y-1.5 font-mono-num">
              <p className="font-sans font-semibold text-sm inline-flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[var(--rh-primary)]" /> GST Invoice Breakup ({order.invoice.invoiceNumber})
              </p>
              <p className="text-[var(--rh-ink-muted)]">
                Seller: {order.invoice.sellerName} · GSTIN: {order.invoice.sellerGstin}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                <div>Taxable Value: ₹{order.invoice.taxableValue.toLocaleString('en-IN')}</div>
                {order.invoice.isIntraState ? (
                  <>
                    <div>CGST: ₹{order.invoice.cgstAmount.toLocaleString('en-IN')}</div>
                    <div>SGST: ₹{order.invoice.sgstAmount.toLocaleString('en-IN')}</div>
                  </>
                ) : (
                  <div>IGST: ₹{order.invoice.igstAmount.toLocaleString('en-IN')}</div>
                )}
                <div className="font-bold">Grand Total: ₹{order.total.toLocaleString('en-IN')}</div>
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              type="button"
              onClick={() => navigate({ page: 'shop' })}
              className="px-5 min-h-[42px] text-xs font-semibold rounded-lg border border-[var(--rh-border)] cursor-pointer"
            >
              Continue Exploring Crafts
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
