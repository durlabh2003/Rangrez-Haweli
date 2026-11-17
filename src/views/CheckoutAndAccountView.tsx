import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  CloudCheck,
  Coins,
  Copy,
  Download,
  FileText,
  Heart,
  LogIn,
  LogOut,
  Package,
  Phone,
  Printer,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Truck,
} from 'lucide-react';
import type { ConfirmationResult } from 'firebase/auth';
import { useStore } from '../context/StoreContext';
import {
  deletePatronFirestoreProfile,
  getPatronIdToken,
  sendFirebasePhoneOtp,
} from '../firebase';
import type { Order, Product } from '../types';
import type { ServerOrderCalculationResult } from '../server/pricing';
import { KathputliMascot } from '../components/RajasthaniMotifs';
import { ProductCard } from '../components/ProductCard';
import { TermGloss } from '../components/TermGloss';

const INDIAN_STATES = [
  'Rajasthan',
  'Delhi',
  'Maharashtra',
  'Karnataka',
  'Gujarat',
  'Tamil Nadu',
  'Telangana',
  'Uttar Pradesh',
  'West Bengal',
  'Punjab',
  'Haryana',
  'Kerala',
  'Madhya Pradesh',
  'Other Indian State',
];

function makeIdempotencyKey() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `ord-key-${crypto.randomUUID()}`;
  }
  return `ord-key-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function CheckoutView() {
  const {
    cart,
    clearCart,
    moharCoins,
    refreshAccountMetrics,
    adminConfig,
    showToast,
    navigate,
    user,
  } = useStore();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [line1, setLine1] = useState('');
  const [city, setCity] = useState('Jaipur');
  const [shippingState, setShippingState] = useState('Rajasthan');
  const [pincode, setPincode] = useState('302006');
  const [gstin, setGstin] = useState('');

  // Opt-in add-ons (STRICTLY unchecked by default — zero dark patterns)
  const [giftWrap, setGiftWrap] = useState(false);
  const [giftMessage, setGiftMessage] = useState('');
  const [redeemMohar, setRedeemMohar] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [dpdpConsentAccepted, setDpdpConsentAccepted] = useState(false);

  // Payment priority: UPI pre-selected first, Card, Netbanking, COD last
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Card' | 'Netbanking' | 'COD'>('UPI');
  const [codChallengeId, setCodChallengeId] = useState('');
  const [codOtpInput, setCodOtpInput] = useState('');
  const [codOtpVerified, setCodOtpVerified] = useState(false);
  const [codOtpNote, setCodOtpNote] = useState('');

  // Serviceability & server-authoritative calculation preview
  const [pincodeInfo, setPincodeInfo] = useState<{
    serviceable: boolean;
    codAllowed: boolean;
    etaText: string;
  } | null>(null);
  const [serverCalc, setServerCalc] = useState<ServerOrderCalculationResult | null>(null);
  const [previewError, setPreviewError] = useState('');

  // Order & payment flow state
  const [idempotencyKey, setIdempotencyKey] = useState<string>(makeIdempotencyKey);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Pending gateway checkout / failure recovery state
  const [pendingOrder, setPendingOrder] = useState<Order | null>(null);
  const [gatewaySession, setGatewaySession] = useState<{
    gatewayOrderId: string;
    mode: string;
    keyId: string;
    amountPaise: number;
  } | null>(null);
  const [paymentFailure, setPaymentFailure] = useState<string | null>(null);
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (user?.displayName && !name) setName(user.displayName);
    if (user?.email && !email) setEmail(user.email);
  }, [user, name, email]);

  // Regenerate idempotency key if cart signature changes
  const cartSig = useMemo(
    () => cart.map((c) => `${c.product.id}:${c.variant.id}:${c.quantity}`).join('|'),
    [cart]
  );
  useEffect(() => {
    setIdempotencyKey(makeIdempotencyKey());
  }, [cartSig]);

  // Real courier serviceability adapter check when pincode reaches 6 digits
  useEffect(() => {
    if (!/^\d{6}$/.test(pincode.trim())) {
      setPincodeInfo(null);
      return;
    }
    let active = true;
    fetch(`/api/pincode/${encodeURIComponent(pincode.trim())}`)
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        setPincodeInfo({
          serviceable: Boolean(data.serviceable),
          codAllowed: Boolean(data.codAllowed),
          etaText: data.etaText || 'Delivery time confirmed at checkout',
        });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [pincode]);

  // Fetch authoritative server quote whenever pricing factors change
  const refreshServerQuote = useCallback(async () => {
    if (cart.length === 0) {
      setServerCalc(null);
      return;
    }
    setPreviewError('');
    try {
      const token = await getPatronIdToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch('/api/orders/preview', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          items: cart.map((c) => ({
            productId: c.product.id,
            variantId: c.variant.id,
            variantLabel: c.variant.label,
            quantity: c.quantity,
          })),
          shippingState,
          pincode: /^\d{6}$/.test(pincode) ? pincode : '302006',
          paymentMethod,
          couponCode: appliedCoupon || undefined,
          requestedMoharCoins: redeemMohar ? moharCoins : 0,
          giftWrap,
          channel: 'D2C',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPreviewError(data.error || 'Unable to compute quote');
        if (appliedCoupon && (data.error || '').toLowerCase().includes('coupon')) {
          setAppliedCoupon('');
        }
        return;
      }
      setServerCalc(data.calculation);
    } catch {
      setPreviewError('Could not reach pricing service.');
    }
  }, [cart, shippingState, pincode, paymentMethod, appliedCoupon, redeemMohar, moharCoins, giftWrap]);

  useEffect(() => {
    void refreshServerQuote();
  }, [refreshServerQuote]);

  const sendCodOtp = async () => {
    if (phone.replace(/\D/g, '').length < 10) {
      showToast('Enter a valid 10-digit mobile number first.');
      return;
    }
    const res = await fetch('/api/otp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, purpose: 'cod' }),
    });
    const data = await res.json();
    if (res.ok) {
      setCodChallengeId(data.challengeId);
      setCodOtpNote(data.devHint || 'OTP sent to your mobile.');
      showToast('COD verification OTP dispatched.');
    } else {
      showToast(data.error || 'Could not dispatch OTP');
    }
  };

  const verifyCodOtp = async () => {
    if (!codChallengeId || !codOtpInput) return;
    const res = await fetch('/api/otp/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challengeId: codChallengeId, code: codOtpInput }),
    });
    const data = await res.json();
    if (data.verified) {
      setCodOtpVerified(true);
      showToast('Mobile OTP verified for Cash on Delivery.');
    } else {
      showToast(data.reason || 'Incorrect OTP code.');
    }
  };

  const initiatePaymentSession = async (order: Order) => {
    setSubmitting(true);
    setPaymentFailure(null);
    try {
      const gwRes = await fetch('/api/payments/razorpay/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idempotencyKey,
          orderId: order.id,
        }),
      });
      const gwData = await gwRes.json();
      if (!gwRes.ok) {
        setPaymentFailure(gwData.error || 'Could not initialize payment gateway.');
        return;
      }
      setGatewaySession(gwData);
    } catch {
      setPaymentFailure('Payment gateway connection interrupted. Your order is preserved — retry below.');
    } finally {
      setSubmitting(false);
    }
  };

  const settleGatewayPayment = async (simulateFail = false) => {
    if (!pendingOrder || !gatewaySession) return;
    setSubmitting(true);
    setPaymentFailure(null);
    try {
      const res = await fetch('/api/payments/razorpay/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: pendingOrder.id,
          gatewayOrderId: gatewaySession.gatewayOrderId,
          paymentId: simulateFail ? 'pay_fail' : `pay_ok_${Date.now()}`,
          signature: simulateFail ? 'sig_fail' : `sandbox_ok_${gatewaySession.gatewayOrderId}`,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.verified) {
        setPaymentFailure(data.error || 'Payment declined or cancelled. No funds were captured.');
        return;
      }
      await refreshAccountMetrics();
      clearCart();
      setPlacedOrder(data.order);
      setPendingOrder(null);
      setGatewaySession(null);
      showToast(`Order ${data.order.orderNumber} paid & confirmed!`);
    } catch {
      setPaymentFailure('Network interruption during payment verification. Tap Retry below.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePlaceOrder = async () => {
    setSubmitError('');
    if (cart.length === 0) return;
    if (!dpdpConsentAccepted) {
      setSubmitError('Please review and accept order processing consent to continue.');
      return;
    }
    if (!name.trim() || !email.trim() || !phone.trim() || !line1.trim() || !/^\d{6}$/.test(pincode.trim())) {
      setSubmitError('Please complete all required shipping address fields and a 6-digit pincode.');
      return;
    }

    setSubmitting(true);
    try {
      const token = await getPatronIdToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          idempotencyKey,
          customerName: name.trim(),
          customerEmail: email.trim(),
          customerPhone: phone.trim(),
          shippingAddress: {
            line1: line1.trim(),
            city: city.trim(),
            state: shippingState,
            pincode: pincode.trim(),
            country: 'India',
          },
          shippingState,
          pincode: pincode.trim(),
          gstin: gstin.trim() || undefined,
          paymentMethod,
          couponCode: appliedCoupon || undefined,
          requestedMoharCoins: redeemMohar ? moharCoins : 0,
          giftWrap,
          giftMessage: giftWrap ? giftMessage.trim() : undefined,
          codOtpChallengeId: codChallengeId || undefined,
          codOtpCode: codOtpInput || undefined,
          dpdpConsentAccepted: true,
          channel: 'D2C',
          items: cart.map((c) => ({
            productId: c.product.id,
            variantId: c.variant.id,
            variantLabel: c.variant.label,
            quantity: c.quantity,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error || 'Could not place order.');
        setSubmitting(false);
        return;
      }

      const createdOrder = data as Order;
      if (paymentMethod === 'COD') {
        await refreshAccountMetrics();
        clearCart();
        setPlacedOrder(createdOrder);
        showToast(`Order ${createdOrder.orderNumber} confirmed (Cash on Delivery)!`);
        setSubmitting(false);
        return;
      }

      // Online payment flow (UPI / Card / Netbanking)
      setPendingOrder(createdOrder);
      setSubmitting(false);
      await initiatePaymentSession(createdOrder);
    } catch {
      setSubmitError('Network error submitting order.');
      setSubmitting(false);
    }
  };

  if (placedOrder) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <div className="bg-[var(--rh-surface)] border border-[var(--rh-border)] rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--rh-peacock)] inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Order Confirmed
              </p>
              <h1 className="font-display text-3xl font-bold mt-1">
                Padharo, {placedOrder.customerName}!
              </h1>
              <p className="text-sm text-[var(--rh-ink-muted)] mt-1">
                Order <span className="font-mono-num font-semibold">{placedOrder.orderNumber}</span> · Payment:{' '}
                {placedOrder.paymentMethod} ({placedOrder.paymentStatus})
              </p>
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-[var(--rh-border)] inline-flex items-center gap-1.5 hover:border-[var(--rh-primary)] cursor-pointer"
            >
              <Printer className="w-4 h-4" /> Print GST Invoice
            </button>
          </div>

          <div className="divide-y divide-[var(--rh-border)] text-sm">
            {placedOrder.items.map((item, idx) => (
              <div key={idx} className="py-3 flex justify-between gap-3">
                <div>
                  <p className="font-medium">
                    {item.name} ({item.variantLabel}) × {item.quantity}
                  </p>
                  <p className="text-xs text-[var(--rh-ink-muted)] font-mono-num">
                    HSN {item.hsnCode} · GST {item.gstRate}% included
                  </p>
                </div>
                <span className="font-mono-num font-semibold">
                  ₹{(item.unitPrice * item.quantity).toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>

          {placedOrder.invoice && (
            <div className="p-4 rounded-xl bg-[var(--rh-bg)] border border-[var(--rh-border)] text-xs font-mono-num space-y-1">
              <p className="font-sans font-semibold text-sm">
                Tax Invoice {placedOrder.invoice.invoiceNumber}
              </p>
              <p className="text-[var(--rh-ink-muted)]">
                Seller: {placedOrder.invoice.sellerName} · GSTIN: {placedOrder.invoice.sellerGstin}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                <span>Taxable: ₹{placedOrder.invoice.taxableValue.toLocaleString('en-IN')}</span>
                {placedOrder.invoice.isIntraState ? (
                  <>
                    <span>CGST: ₹{placedOrder.invoice.cgstAmount.toLocaleString('en-IN')}</span>
                    <span>SGST: ₹{placedOrder.invoice.sgstAmount.toLocaleString('en-IN')}</span>
                  </>
                ) : (
                  <span>IGST: ₹{placedOrder.invoice.igstAmount.toLocaleString('en-IN')}</span>
                )}
                <span className="font-bold">Grand Total: ₹{placedOrder.total.toLocaleString('en-IN')}</span>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate({ page: 'track-order' })}
              className="px-5 min-h-[42px] text-xs font-semibold rounded-lg bg-[var(--rh-primary)] text-white cursor-pointer"
            >
              Track Order
            </button>
            <button
              type="button"
              onClick={() => navigate({ page: 'shop' })}
              className="px-5 min-h-[42px] text-xs font-semibold rounded-lg border border-[var(--rh-border)] cursor-pointer"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Gateway & Failure Recovery Modal/Panel for pending prepaid order
  if (pendingOrder) {
    return (
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-[var(--rh-surface)] border border-[var(--rh-border)] rounded-2xl p-6 sm:p-8 space-y-5">
          <div>
            <p className="text-xs font-mono-num uppercase tracking-wider text-[var(--rh-peacock)] font-semibold">
              {gatewaySession?.mode === 'live' ? 'Razorpay Live Checkout' : 'Payment Verification (Sandbox Adapter)'}
            </p>
            <h1 className="font-display text-2xl font-bold mt-1">
              Complete Payment for {pendingOrder.orderNumber}
            </h1>
            <p className="text-sm text-[var(--rh-ink-muted)] mt-1 font-mono-num">
              Amount Payable: ₹{pendingOrder.total.toLocaleString('en-IN')} via {pendingOrder.paymentMethod}
            </p>
          </div>

          {paymentFailure && (
            <div
              role="alert"
              className="p-4 rounded-xl border border-[var(--rh-primary)] bg-[var(--rh-primary)]/10 text-xs space-y-2"
            >
              <p className="font-semibold text-[var(--rh-primary)] inline-flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0" /> Payment Not Completed
              </p>
              <p>{paymentFailure}</p>
              <p className="text-[var(--rh-ink-muted)]">
                Your cart items remain reserved on order <span className="font-mono-num">{pendingOrder.orderNumber}</span>.
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              disabled={submitting}
              onClick={() => settleGatewayPayment(false)}
              className="flex-1 min-h-[46px] px-5 py-2.5 text-sm font-semibold rounded-lg bg-[var(--rh-peacock)] text-white cursor-pointer inline-flex items-center justify-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${submitting ? 'animate-spin' : ''}`} />
              <span>
                {paymentFailure
                  ? `Retry ${pendingOrder.paymentMethod} Payment`
                  : `Verify & Complete ₹${pendingOrder.total.toLocaleString('en-IN')}`}
              </span>
            </button>

            <button
              type="button"
              disabled={submitting}
              onClick={() => settleGatewayPayment(true)}
              className="min-h-[46px] px-4 py-2.5 text-xs font-semibold rounded-lg border border-[var(--rh-border)] text-[var(--rh-ink-muted)] hover:border-[var(--rh-primary)] cursor-pointer"
            >
              Test Payment Failure
            </button>
          </div>

          {paymentFailure && (
            <div className="pt-3 border-t border-[var(--rh-border)] flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-[var(--rh-ink-muted)]">Prefer another method?</span>
              <button
                type="button"
                onClick={() => {
                  setPendingOrder(null);
                  setGatewaySession(null);
                  setPaymentFailure(null);
                  setIdempotencyKey(makeIdempotencyKey());
                  setStep(3);
                }}
                className="font-semibold text-[var(--rh-primary)] underline cursor-pointer"
              >
                Switch Payment Method & Create New Attempt
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-6 py-20 text-center space-y-4">
        <KathputliMascot size={72} label="Your bag is empty — add handmade pieces before checkout" />
        <button
          type="button"
          onClick={() => navigate({ page: 'shop' })}
          className="px-6 py-3 text-sm font-semibold rounded-lg bg-[var(--rh-primary)] text-white cursor-pointer"
        >
          Browse Catalogue
        </button>
      </div>
    );
  }

  const fallbackSubtotal = cart.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  const displaySubtotal = serverCalc?.subtotal ?? fallbackSubtotal;
  const displayTotal = serverCalc?.total ?? fallbackSubtotal;

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6 sm:py-8">
      <h1 className="font-display text-2xl sm:text-3xl font-bold mb-5 sm:mb-6">Haveli Secure Checkout</h1>

      <div className="flex items-center gap-2 sm:gap-4 mb-6 sm:mb-8 text-xs font-semibold overflow-x-auto no-scrollbar">
        {[
          { n: 1 as const, label: '1. Address & State GST' },
          { n: 2 as const, label: '2. Gift Wrap & Rewards' },
          { n: 3 as const, label: '3. Payment & Confirmation' },
        ].map((s) => (
          <button
            key={s.n}
            type="button"
            onClick={() => setStep(s.n)}
            className={`px-4 min-h-[42px] rounded-lg border whitespace-nowrap shrink-0 cursor-pointer ${
              step === s.n
                ? 'bg-[var(--rh-primary)] text-white border-[var(--rh-primary)]'
                : 'bg-[var(--rh-surface)] border-[var(--rh-border)] text-[var(--rh-ink-muted)]'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        <div className="lg:col-span-7 bg-[var(--rh-surface)] border border-[var(--rh-border)] rounded-2xl p-4 sm:p-6 space-y-5">
          {step === 1 && (
            <>
              <h2 className="font-display text-xl font-bold">Shipping Address & Tax State</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-sm">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full Name *"
                  className="min-h-[44px] px-3 py-2.5 rounded-lg border border-[var(--rh-border)] bg-[var(--rh-bg)]"
                />
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Mobile (+91) *"
                  className="min-h-[44px] px-3 py-2.5 rounded-lg border border-[var(--rh-border)] bg-[var(--rh-bg)]"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email for GST Invoice & Tracking *"
                  className="sm:col-span-2 min-h-[44px] px-3 py-2.5 rounded-lg border border-[var(--rh-border)] bg-[var(--rh-bg)]"
                />
                <input
                  value={line1}
                  onChange={(e) => setLine1(e.target.value)}
                  placeholder="Street, Haveli / Apartment *"
                  className="sm:col-span-2 min-h-[44px] px-3 py-2.5 rounded-lg border border-[var(--rh-border)] bg-[var(--rh-bg)]"
                />
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="City *"
                  className="min-h-[44px] px-3 py-2.5 rounded-lg border border-[var(--rh-border)] bg-[var(--rh-bg)]"
                />
                <select
                  value={shippingState}
                  onChange={(e) => setShippingState(e.target.value)}
                  aria-label="Shipping State for CGST/SGST vs IGST"
                  className="min-h-[44px] px-3 py-2.5 rounded-lg border border-[var(--rh-border)] bg-[var(--rh-bg)]"
                >
                  {INDIAN_STATES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
                <div className="sm:col-span-2 space-y-1">
                  <input
                    value={pincode}
                    maxLength={6}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="6-Digit Pincode *"
                    className="w-full min-h-[44px] px-3 py-2.5 font-mono-num rounded-lg border border-[var(--rh-border)] bg-[var(--rh-bg)]"
                  />
                  {pincodeInfo && (
                    <p
                      className={`text-xs ${
                        pincodeInfo.serviceable ? 'text-[var(--rh-peacock)]' : 'text-[var(--rh-primary)]'
                      }`}
                    >
                      {pincodeInfo.etaText} · {pincodeInfo.codAllowed ? 'COD eligible' : 'Prepaid only for this pincode'}
                    </p>
                  )}
                </div>
                <input
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value.toUpperCase())}
                  placeholder="Optional Business GSTIN (15-char Mod-36 validated)"
                  className="sm:col-span-2 min-h-[44px] px-3 py-2.5 font-mono-num rounded-lg border border-[var(--rh-border)] bg-[var(--rh-bg)]"
                />
              </div>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 text-sm font-semibold rounded-lg bg-[var(--rh-primary)] text-white cursor-pointer"
              >
                Continue to Packaging & Offers →
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="font-display text-xl font-bold">Optional Gift Wrap, Coupon & Mohar Coins</h2>

              <label className="flex items-start gap-3 p-4 rounded-xl border border-[var(--rh-border)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={giftWrap}
                  onChange={(e) => setGiftWrap(e.target.checked)}
                  className="mt-1 accent-[#B3123F]"
                />
                <div className="text-sm">
                  <p className="font-semibold">
                    Optional Block-Printed Cloth Gift Wrap (+₹{adminConfig.giftWrapFeeInr})
                  </p>
                  <p className="text-xs text-[var(--rh-ink-muted)]">
                    Unchecked by default · Plastic-free Sanganeri cotton pouch & gift card.
                  </p>
                </div>
              </label>

              {giftWrap && (
                <textarea
                  value={giftMessage}
                  onChange={(e) => setGiftMessage(e.target.value)}
                  rows={2}
                  maxLength={240}
                  placeholder="Write an optional handwritten note for the recipient..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--rh-border)] bg-[var(--rh-bg)]"
                />
              )}

              {/* Coupon */}
              <div className="flex gap-2">
                <input
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  placeholder="Promo Coupon (e.g. PADHARO10)"
                  className="flex-1 min-h-[44px] px-3 py-2 text-xs font-mono-num rounded-lg border border-[var(--rh-border)] bg-[var(--rh-bg)]"
                />
                {appliedCoupon ? (
                  <button
                    type="button"
                    onClick={() => {
                      setAppliedCoupon('');
                      setCouponInput('');
                    }}
                    className="px-4 min-h-[44px] text-xs font-semibold rounded-lg border border-[var(--rh-border)] cursor-pointer"
                  >
                    Remove ({appliedCoupon})
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAppliedCoupon(couponInput.trim())}
                    disabled={!couponInput.trim()}
                    className="px-4 min-h-[44px] text-xs font-semibold rounded-lg bg-[var(--rh-surface-muted)] border border-[var(--rh-border)] disabled:opacity-40 cursor-pointer"
                  >
                    Apply
                  </button>
                )}
              </div>

              {/* Mohar Coins Redemption */}
              <label className="flex items-center justify-between p-4 rounded-xl border border-[var(--rh-border)] cursor-pointer">
                <div className="flex items-center gap-2 text-sm">
                  <Coins className="w-4 h-4 text-[#C9A227]" />
                  <span>
                    Redeem <TermGloss term="Mohar" /> Coins (Balance: {moharCoins} · Max{' '}
                    {adminConfig.moharMaxRedeemPct}% per order)
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={redeemMohar}
                  disabled={!user || moharCoins <= 0}
                  onChange={(e) => setRedeemMohar(e.target.checked)}
                  className="accent-[#B3123F]"
                />
              </label>

              {previewError && (
                <p className="text-xs text-[var(--rh-primary)] font-medium">{previewError}</p>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 min-h-[44px] text-sm rounded-lg border border-[var(--rh-border)] cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-6 min-h-[44px] text-sm font-semibold rounded-lg bg-[var(--rh-primary)] text-white cursor-pointer"
                >
                  Continue to Payment →
                </button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="font-display text-xl font-bold">Select Payment Method</h2>

              {/* Payment options strictly ordered: UPI -> Card -> Netbanking -> COD */}
              <div className="space-y-2.5 text-sm">
                {[
                  {
                    id: 'UPI' as const,
                    label: 'UPI / QR (GPay, PhonePe, BHIM)',
                    badge: `Instant -₹${adminConfig.prepaidIncentiveInr} Prepaid Incentive`,
                  },
                  {
                    id: 'Card' as const,
                    label: 'Credit / Debit Cards (Visa, Mastercard, RuPay)',
                    badge: `Instant -₹${adminConfig.prepaidIncentiveInr} Prepaid Incentive`,
                  },
                  {
                    id: 'Netbanking' as const,
                    label: 'Indian Netbanking',
                    badge: `Instant -₹${adminConfig.prepaidIncentiveInr} Prepaid Incentive`,
                  },
                  {
                    id: 'COD' as const,
                    label: 'Cash on Delivery (Last Option)',
                    badge: `+₹${adminConfig.codFeeInr} COD fee · Max ₹${adminConfig.codMaxOrderInr.toLocaleString(
                      'en-IN'
                    )}`,
                  },
                ].map((opt) => {
                  const selected = paymentMethod === opt.id;
                  const codBlocked =
                    opt.id === 'COD' &&
                    (!adminConfig.codEnabled ||
                      displaySubtotal > adminConfig.codMaxOrderInr ||
                      (pincodeInfo && !pincodeInfo.codAllowed));

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={Boolean(codBlocked)}
                      onClick={() => setPaymentMethod(opt.id)}
                      className={`w-full p-4 rounded-xl border text-left flex flex-wrap items-center justify-between gap-2 transition-colors cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${
                        selected
                          ? 'border-[var(--rh-primary)] bg-[var(--rh-primary)]/8 font-semibold'
                          : 'border-[var(--rh-border)] bg-[var(--rh-bg)]'
                      }`}
                    >
                      <span>{opt.label}</span>
                      <span
                        className={`text-xs font-mono-num ${
                          opt.id === 'COD' ? 'text-[var(--rh-primary)]' : 'text-[var(--rh-peacock)]'
                        }`}
                      >
                        {opt.badge}
                      </span>
                    </button>
                  );
                })}
              </div>

              {paymentMethod === 'COD' && (
                <div className="p-4 rounded-xl bg-[var(--rh-surface-muted)]/70 border border-[var(--rh-border)] text-xs space-y-2.5">
                  <p className="font-semibold">
                    COD Handling Fee Notice: ₹{adminConfig.codFeeInr} applies cleanly before order placement.
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={sendCodOtp}
                      className="px-3 min-h-[38px] rounded-lg border border-[var(--rh-border)] bg-[var(--rh-surface)] font-semibold cursor-pointer"
                    >
                      Send COD OTP
                    </button>
                    <input
                      value={codOtpInput}
                      onChange={(e) => setCodOtpInput(e.target.value)}
                      placeholder="Enter OTP"
                      className="w-28 min-h-[38px] px-2.5 font-mono-num rounded-lg border border-[var(--rh-border)] bg-[var(--rh-surface)]"
                    />
                    <button
                      type="button"
                      onClick={verifyCodOtp}
                      disabled={!codChallengeId}
                      className="px-3 min-h-[38px] rounded-lg bg-[var(--rh-peacock)] text-white font-semibold disabled:opacity-40 cursor-pointer"
                    >
                      {codOtpVerified ? 'Verified ✓' : 'Verify'}
                    </button>
                  </div>
                  {codOtpNote && <p className="text-[var(--rh-ink-muted)] font-mono-num">{codOtpNote}</p>}
                </div>
              )}

              {/* Explicit unchecked DPDP order consent */}
              <label className="flex items-start gap-2.5 p-3.5 rounded-xl bg-[var(--rh-bg)] border border-[var(--rh-border)] text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={dpdpConsentAccepted}
                  onChange={(e) => setDpdpConsentAccepted(e.target.checked)}
                  className="mt-0.5 accent-[#B3123F]"
                />
                <span className="text-[var(--rh-ink-muted)]">
                  I consent to process my shipping and contact details strictly for order fulfilment, GST invoicing, and
                  delivery updates in accordance with the{' '}
                  <button
                    type="button"
                    onClick={() => navigate({ page: 'legal', doc: 'privacy' })}
                    className="underline text-[var(--rh-primary)] font-semibold"
                  >
                    DPDP Privacy Notice
                  </button>
                  .
                </span>
              </label>

              {(submitError || previewError) && (
                <div
                  role="alert"
                  className="p-3 rounded-lg bg-[var(--rh-primary)]/10 text-xs text-[var(--rh-primary)] font-medium"
                >
                  {submitError || previewError}
                </div>
              )}

              <div className="flex items-center gap-2 text-xs text-[var(--rh-ink-muted)]">
                <ShieldCheck className="w-4 h-4 text-[var(--rh-peacock)]" />
                <span>
                  Authoritative server pricing · {adminConfig.defaultReturnWindowDays}-day return policy · HSN GST
                  invoice
                </span>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 min-h-[44px] text-sm rounded-lg border border-[var(--rh-border)] cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handlePlaceOrder}
                  disabled={submitting || Boolean(previewError)}
                  className="flex-1 min-h-[44px] py-3 text-sm font-semibold rounded-lg bg-[var(--rh-primary)] text-white hover:bg-[var(--rh-primary-hover)] disabled:opacity-45 cursor-pointer"
                >
                  {submitting
                    ? 'Creating Secure Order…'
                    : paymentMethod === 'COD'
                      ? `Confirm COD Order ₹${displayTotal.toLocaleString('en-IN')}`
                      : `Proceed to Pay ₹${displayTotal.toLocaleString('en-IN')}`}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Authoritative Server Order Summary */}
        <aside className="lg:col-span-5 bg-[var(--rh-surface)] border border-[var(--rh-border)] rounded-2xl p-5 sm:p-6 space-y-4">
          <h2 className="font-display text-xl font-bold">Order Summary (GST Inclusive)</h2>
          <div className="divide-y divide-[var(--rh-border)] text-sm">
            {cart.map((c) => (
              <div key={`${c.product.id}-${c.variant.id}`} className="py-2.5 flex justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {c.product.name} × {c.quantity}
                  </p>
                  <p className="text-[11px] text-[var(--rh-ink-muted)] font-mono-num">
                    HSN {c.product.hsnCode} · {c.variant.label}
                  </p>
                </div>
                <span className="font-mono-num shrink-0">
                  ₹{(c.product.price * c.quantity).toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-2 pt-3 border-t border-[var(--rh-border)] text-xs sm:text-sm">
            <div className="flex justify-between text-[var(--rh-ink-muted)]">
              <span>Bag MRP Subtotal</span>
              <span className="font-mono-num">₹{displaySubtotal.toLocaleString('en-IN')}</span>
            </div>
            {(serverCalc?.couponDiscount ?? 0) > 0 && (
              <div className="flex justify-between text-[var(--rh-peacock)]">
                <span>Coupon ({appliedCoupon})</span>
                <span className="font-mono-num">-₹{serverCalc!.couponDiscount.toLocaleString('en-IN')}</span>
              </div>
            )}
            {(serverCalc?.prepaidDiscount ?? 0) > 0 && (
              <div className="flex justify-between text-[var(--rh-peacock)]">
                <span>Instant Prepaid Incentive</span>
                <span className="font-mono-num">-₹{serverCalc!.prepaidDiscount.toLocaleString('en-IN')}</span>
              </div>
            )}
            {(serverCalc?.moharRedeemed ?? 0) > 0 && (
              <div className="flex justify-between text-[var(--rh-peacock)]">
                <span>Mohar Coins Redeemed</span>
                <span className="font-mono-num">-₹{serverCalc!.moharRedeemed.toLocaleString('en-IN')}</span>
              </div>
            )}
            {giftWrap && (
              <div className="flex justify-between text-[var(--rh-ink-muted)]">
                <span>Block-Printed Cloth Gift Wrap</span>
                <span className="font-mono-num">+₹{serverCalc?.giftWrapFee ?? adminConfig.giftWrapFeeInr}</span>
              </div>
            )}
            {(serverCalc?.codFee ?? 0) > 0 && (
              <div className="flex justify-between text-[var(--rh-primary)]">
                <span>Cash on Delivery Fee</span>
                <span className="font-mono-num">+₹{serverCalc!.codFee.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between text-[var(--rh-ink-muted)]">
              <span>Courier Shipping</span>
              <span className="font-mono-num">
                {(serverCalc?.shippingFee ?? 0) === 0
                  ? 'FREE'
                  : `₹${serverCalc!.shippingFee.toLocaleString('en-IN')}`}
              </span>
            </div>
            {serverCalc && (
              <div className="flex justify-between text-xs text-[var(--rh-ink-muted)]">
                <span>
                  Included GST (
                  {serverCalc.invoice.isIntraState ? 'CGST + SGST (Rajasthan)' : `IGST (${shippingState})`})
                </span>
                <span className="font-mono-num">₹{serverCalc.gstAmount.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-[var(--rh-border)]">
              <span>Total Payable</span>
              <span className="font-mono-num">₹{displayTotal.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export function AccountView() {
  const {
    wishlist,
    moharCoins,
    adminConfig,
    showToast,
    navigate,
    user,
    authReady,
    authBusy,
    signInWithGoogle,
    signOutUser,
  } = useStore();

  const [tab, setTab] = useState<'orders' | 'wishlist' | 'mohar' | 'privacy'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);

  // Phone OTP Sign-in state
  const [showPhoneAuth, setShowPhoneAuth] = useState(false);
  const [phoneInput, setPhoneInput] = useState('+91');
  const [phoneConfirm, setPhoneConfirm] = useState<ConfirmationResult | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [phoneBusy, setPhoneBusy] = useState(false);

  // DPDP erasure double confirmation
  const [confirmErase, setConfirmErase] = useState(false);
  const [erasing, setErasing] = useState(false);

  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then((d) => {
        const all = (d.products ?? []) as Product[];
        setWishlistProducts(all.filter((p) => wishlist.includes(p.id)));
      })
      .catch(() => {});
  }, [wishlist]);

  useEffect(() => {
    if (!authReady || !user) {
      setOrders([]);
      return;
    }
    let active = true;
    setOrdersLoading(true);
    getPatronIdToken()
      .then((token) => {
        if (!token) return null;
        return fetch('/api/orders/my', {
          headers: { Authorization: `Bearer ${token}` },
        }).then((r) => (r.ok ? r.json() : null));
      })
      .then((data) => {
        if (!active) return;
        if (data && Array.isArray(data.orders)) {
          setOrders(data.orders);
        }
        setOrdersLoading(false);
      })
      .catch(() => {
        if (active) setOrdersLoading(false);
      });
    return () => {
      active = false;
    };
  }, [authReady, user]);

  const handleSendPhoneOtp = async () => {
    setPhoneBusy(true);
    try {
      const confirmation = await sendFirebasePhoneOtp(phoneInput.trim(), 'rh-phone-recaptcha');
      setPhoneConfirm(confirmation);
      showToast('SMS OTP sent! Enter code below.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to send phone OTP.');
    } finally {
      setPhoneBusy(false);
    }
  };

  const handleConfirmPhoneOtp = async () => {
    if (!phoneConfirm || !otpCode.trim()) return;
    setPhoneBusy(true);
    try {
      await phoneConfirm.confirm(otpCode.trim());
      setShowPhoneAuth(false);
      setPhoneConfirm(null);
      showToast('Signed in via mobile number!');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Invalid OTP code.');
    } finally {
      setPhoneBusy(false);
    }
  };

  const handleExportPersonalData = async () => {
    const token = await getPatronIdToken();
    if (!token) return;
    const res = await fetch('/api/patron/export', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      showToast('Could not export personal data.');
      return;
    }
    const payload = await res.json();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rangrez-haveli-dpdp-export-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Downloaded personal data JSON export.');
  };

  const handleEraseAccount = async () => {
    if (!user) return;
    setErasing(true);
    try {
      const token = await getPatronIdToken();
      if (token) {
        await fetch('/api/patron/account', {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      await deletePatronFirestoreProfile(user.uid);
      await signOutUser();
      setConfirmErase(false);
      showToast('Account records erased & anonymized cleanly.');
    } catch {
      showToast('Could not complete erasure request.');
    } finally {
      setErasing(false);
    }
  };

  const referralUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/?ref=HAVELI250` : 'https://rangrezhaveli.example/?ref=HAVELI250';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[var(--rh-border)]">
        <div className="flex items-center gap-4">
          {user?.photoURL && (
            <img
              src={user.photoURL}
              alt={user.displayName || 'Patron'}
              width={56}
              height={56}
              referrerPolicy="no-referrer"
              className="w-14 h-14 rounded-full border-2 border-[#C9A227] object-cover"
            />
          )}
          <div>
            <p className="text-xs font-medium text-[var(--rh-primary)] uppercase tracking-wider inline-flex items-center gap-1.5">
              <span>Patron Haveli Account</span>
              {user && (
                <span className="text-[var(--rh-peacock)] inline-flex items-center gap-1 font-semibold">
                  · <CloudCheck className="w-3.5 h-3.5" /> Server Authenticated
                </span>
              )}
            </p>
            <h1 className="font-display text-3xl font-bold mt-1">
              {user ? `Padharo, ${user.displayName || user.phoneNumber || 'Patron'}` : 'Padharo, Guest Patron'}
            </h1>
            {(user?.email || user?.phoneNumber) && (
              <p className="text-xs text-[var(--rh-ink-muted)] mt-0.5">{user.email || user.phoneNumber}</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--rh-surface)] border border-[var(--rh-border)]">
            <Coins className="w-5 h-5 text-[#C9A227]" />
            <div>
              <p className="text-xs text-[var(--rh-ink-muted)]">
                <TermGloss term="Mohar" /> Balance
              </p>
              <p className="font-mono-num font-bold">
                {moharCoins} Mohars (₹{moharCoins})
              </p>
            </div>
          </div>

          {user ? (
            <button
              type="button"
              onClick={() => signOutUser()}
              disabled={authBusy}
              className="px-4 py-3 text-xs font-semibold rounded-xl border border-[var(--rh-border)] bg-[var(--rh-surface)] hover:border-[var(--rh-primary)] inline-flex items-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          ) : (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => signInWithGoogle()}
                disabled={authBusy}
                className="px-5 py-3 text-xs font-semibold rounded-xl bg-[var(--rh-primary)] text-white hover:bg-[var(--rh-primary-hover)] inline-flex items-center gap-2 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>{authBusy ? 'Connecting Google…' : 'Sign in with Google'}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowPhoneAuth((v) => !v)}
                className="px-4 py-3 text-xs font-semibold rounded-xl border border-[var(--rh-border)] bg-[var(--rh-surface)] inline-flex items-center gap-2 cursor-pointer"
              >
                <Phone className="w-4 h-4" />
                <span>Phone OTP</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {!user && showPhoneAuth && (
        <div className="p-5 rounded-2xl bg-[var(--rh-surface)] border border-[var(--rh-border)] max-w-md space-y-3 text-xs">
          <p className="font-semibold text-sm">Sign in with Indian Mobile OTP</p>
          <div id="rh-phone-recaptcha" />
          <div className="flex gap-2">
            <input
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              placeholder="+919829055412"
              className="flex-1 min-h-[42px] px-3 font-mono-num rounded-lg border border-[var(--rh-border)] bg-[var(--rh-bg)]"
            />
            <button
              type="button"
              disabled={phoneBusy}
              onClick={handleSendPhoneOtp}
              className="px-4 min-h-[42px] rounded-lg bg-[var(--rh-peacock)] text-white font-semibold cursor-pointer"
            >
              Send OTP
            </button>
          </div>
          {phoneConfirm && (
            <div className="flex gap-2">
              <input
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="6-digit OTP"
                className="flex-1 min-h-[42px] px-3 font-mono-num rounded-lg border border-[var(--rh-border)] bg-[var(--rh-bg)]"
              />
              <button
                type="button"
                disabled={phoneBusy}
                onClick={handleConfirmPhoneOtp}
                className="px-4 min-h-[42px] rounded-lg bg-[var(--rh-primary)] text-white font-semibold cursor-pointer"
              >
                Confirm
              </button>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {[
          { id: 'orders' as const, label: `My Orders (${orders.length})`, icon: Package },
          { id: 'wishlist' as const, label: `Pasand Wishlist (${wishlistProducts.length})`, icon: Heart },
          { id: 'mohar' as const, label: 'Mohar Rewards', icon: Coins },
          { id: 'privacy' as const, label: 'DPDP Privacy & Data', icon: ShieldCheck },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`px-4 min-h-[42px] py-2 text-xs font-semibold rounded-lg inline-flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
                tab === item.id ? 'bg-[var(--rh-primary)] text-white' : 'bg-[var(--rh-surface-muted)]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {tab === 'orders' && (
        <div className="space-y-4">
          {!user ? (
            <div className="p-6 rounded-2xl bg-[var(--rh-surface)] border border-[var(--rh-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-sm">
              <div>
                <p className="font-semibold">Sign in to view your verified order history</p>
                <p className="text-xs text-[var(--rh-ink-muted)] mt-1">
                  Guest orders can also be looked up anytime with Order Number + Email on our public Track Order page.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate({ page: 'track-order' })}
                className="px-4 min-h-[42px] text-xs font-semibold rounded-lg border border-[var(--rh-border)] hover:border-[var(--rh-primary)] cursor-pointer shrink-0 self-start"
              >
                Track Guest Order
              </button>
            </div>
          ) : ordersLoading ? (
            <p className="text-sm text-[var(--rh-ink-muted)]">Loading authenticated order ledger…</p>
          ) : orders.length === 0 ? (
            <div className="py-12 text-center bg-[var(--rh-surface)] border border-[var(--rh-border)] rounded-xl px-4">
              <KathputliMascot size={64} label="No authenticated orders placed under this account yet." />
              <button
                type="button"
                onClick={() => navigate({ page: 'shop' })}
                className="mt-4 px-5 min-h-[44px] text-sm font-medium bg-[var(--rh-primary)] text-white rounded-lg cursor-pointer"
              >
                Explore Crafts
              </button>
            </div>
          ) : (
            orders.map((ord) => (
              <div
                key={ord.id}
                className="bg-[var(--rh-surface)] border border-[var(--rh-border)] rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <p className="text-xs text-[var(--rh-ink-muted)] font-mono-num">
                    {ord.orderNumber} · {new Date(ord.createdAt).toLocaleDateString('en-IN')} · {ord.channel} ·{' '}
                    {ord.paymentStatus}
                  </p>
                  <p className="font-semibold text-base">
                    {ord.items[0]?.name} {ord.items.length > 1 ? `+ ${ord.items.length - 1} more` : ''}
                  </p>
                  <p className="text-xs text-[var(--rh-peacock)] inline-flex items-center gap-1.5 font-medium">
                    <Truck className="w-3.5 h-3.5" /> Status: {ord.orderStatus} · {ord.shippingAddress.city}
                  </p>
                </div>
                <div className="flex items-center justify-between md:justify-end gap-4">
                  <span className="font-mono-num font-bold text-lg">₹{ord.total.toLocaleString('en-IN')}</span>
                  <button
                    type="button"
                    onClick={() => navigate({ page: 'track-order' })}
                    className="min-h-[40px] px-3.5 py-2 text-xs font-medium rounded-lg border border-[var(--rh-border)] inline-flex items-center gap-1.5 hover:border-[var(--rh-primary)] cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" /> GST Invoice
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'wishlist' &&
        (wishlistProducts.length === 0 ? (
          <div className="py-12 text-center bg-[var(--rh-surface)] border border-[var(--rh-border)] rounded-xl px-4">
            <KathputliMascot size={64} label="Tap the heart on any craft to build your Pasand collection" />
            <button
              type="button"
              onClick={() => navigate({ page: 'shop' })}
              className="mt-4 px-5 min-h-[44px] text-sm font-medium bg-[var(--rh-primary)] text-white rounded-lg cursor-pointer"
            >
              Discover Crafts
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {wishlistProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ))}

      {tab === 'mohar' && (
        <div className="bg-[var(--rh-surface)] border border-[var(--rh-border)] rounded-2xl p-6 max-w-2xl space-y-4">
          <h2 className="font-display text-2xl font-bold">Earn Mohar Coins with Every Craft</h2>
          <p className="text-sm text-[var(--rh-ink-muted)]">
            Signed-in patrons earn {adminConfig.moharEarnRatePct}% back in Mohar coins on every completed order (1
            Mohar = ₹1), redeemable up to {adminConfig.moharMaxRedeemPct}% of cart value when not stacking with a coupon
            code.
          </p>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={referralUrl}
              aria-label="Patron referral link"
              className="flex-1 px-3 py-2 text-xs font-mono-num rounded-lg border border-[var(--rh-border)] bg-[var(--rh-bg)]"
            />
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(referralUrl);
                showToast('Referral link copied!');
              }}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-[var(--rh-primary)] text-white inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" /> Copy
            </button>
          </div>
        </div>
      )}

      {tab === 'privacy' && (
        <div className="bg-[var(--rh-surface)] border border-[var(--rh-border)] rounded-2xl p-6 max-w-2xl space-y-5">
          <div>
            <h2 className="font-display text-2xl font-bold">DPDP Privacy & Data Portability</h2>
            <p className="text-sm text-[var(--rh-ink-muted)] mt-1">
              Exercise your Digital Personal Data Protection rights to export all stored records or permanently erase and
              anonymize your profile.
            </p>
          </div>

          {!user ? (
            <p className="text-xs text-[var(--rh-ink-muted)]">
              Sign in with Google or Phone OTP above to export or erase cloud-authenticated records.
            </p>
          ) : (
            <div className="space-y-4">
              <button
                type="button"
                onClick={handleExportPersonalData}
                className="px-4 min-h-[44px] text-xs font-semibold rounded-lg border border-[var(--rh-border)] bg-[var(--rh-bg)] hover:border-[var(--rh-primary)] inline-flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" /> Download My Personal Data (JSON)
              </button>

              <div className="p-4 rounded-xl border border-[var(--rh-primary)]/40 bg-[var(--rh-primary)]/5 space-y-3">
                <p className="text-xs font-semibold text-[var(--rh-primary)]">
                  Permanent Account Erasure (Right to Erasure)
                </p>
                <p className="text-xs text-[var(--rh-ink-muted)]">
                  Removes your wishlist, Mohar wallet, reviews, and Firestore profile while anonymising PII on past tax
                  ledgers.
                </p>
                {!confirmErase ? (
                  <button
                    type="button"
                    onClick={() => setConfirmErase(true)}
                    className="px-4 min-h-[40px] text-xs font-semibold rounded-lg border border-[var(--rh-primary)] text-[var(--rh-primary)] inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Request Account Erasure
                  </button>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={erasing}
                      onClick={handleEraseAccount}
                      className="px-4 min-h-[40px] text-xs font-semibold rounded-lg bg-[var(--rh-primary)] text-white cursor-pointer"
                    >
                      {erasing ? 'Erasing Records…' : 'Confirm Permanent Erasure'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmErase(false)}
                      className="px-4 min-h-[40px] text-xs font-semibold rounded-lg border border-[var(--rh-border)] cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
