import React, { useEffect, useState } from 'react';
import {
  Heart,
  Lock,
  LogIn,
  Phone,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  X,
} from 'lucide-react';
import type { ConfirmationResult } from 'firebase/auth';
import { useStore } from '../context/StoreContext';
import { sendFirebasePhoneOtp } from '../firebase';
import { ResilientImage } from './RajasthaniMotifs';

const INTENT_LABELS: Record<string, string> = {
  product_click: 'Sign in to inspect Craft Passport & pricing',
  add_to_cart: 'Sign in to add this craft to your Haveli Bag',
  wishlist_like: 'Sign in to save this piece to your Pasand Wishlist',
  buy_now: 'Sign in to proceed with your order',
  checkout_start: 'Sign in to continue to Secure Checkout',
  stock_alert: 'Sign in to set a Back-in-Stock alert',
  b2b_application: 'Sign in before submitting your B2B Trade Form',
  b2b_quote: 'Sign in to submit a B2B Bulk Quote',
  contact_query: 'Sign in to submit your inquiry',
};

export function AuthLeadGateModal() {
  const {
    authGateOpen,
    pendingIntent,
    closeAuthGate,
    signInWithGoogle,
    authBusy,
    updatePendingLeadMeta,
    showToast,
  } = useStore();

  const [authTab, setAuthTab] = useState<'google' | 'phone'>('google');
  const [contactPhone, setContactPhone] = useState('');
  const [leadNote, setLeadNote] = useState('');

  // Phone OTP login states
  const [phoneNumber, setPhoneNumber] = useState('+91');
  const [phoneConfirm, setPhoneConfirm] = useState<ConfirmationResult | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [phoneBusy, setPhoneBusy] = useState(false);

  useEffect(() => {
    if (!authGateOpen) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeAuthGate();
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [authGateOpen, closeAuthGate]);

  useEffect(() => {
    updatePendingLeadMeta({
      phone: contactPhone.trim() || undefined,
      note: leadNote.trim() || undefined,
    });
  }, [contactPhone, leadNote, updatePendingLeadMeta]);

  if (!authGateOpen || !pendingIntent) return null;

  const product = pendingIntent.product;
  const intentTitle = INTENT_LABELS[pendingIntent.intent] || 'Sign in to continue';

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = phoneNumber.trim().startsWith('+') ? phoneNumber.trim() : `+91${phoneNumber.replace(/\D/g, '')}`;
    if (cleaned.replace(/\D/g, '').length < 10) {
      showToast('Enter a valid 10-digit mobile number with country code (e.g. +919829012345).');
      return;
    }
    setPhoneBusy(true);
    try {
      updatePendingLeadMeta({ phone: cleaned, note: leadNote.trim() || undefined });
      const conf = await sendFirebasePhoneOtp(cleaned, 'auth-gate-recaptcha');
      setPhoneConfirm(conf);
      showToast(`OTP dispatched to ${cleaned}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to send Phone OTP.');
    } finally {
      setPhoneBusy(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneConfirm || !otpCode.trim()) return;
    setPhoneBusy(true);
    try {
      await phoneConfirm.confirm(otpCode.trim());
      setPhoneConfirm(null);
      setOtpCode('');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Incorrect OTP verification code.');
    } finally {
      setPhoneBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/55 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Sign in to Rangrez Haveli"
    >
      <div className="w-full max-w-md bg-[var(--rh-surface)] text-[var(--rh-ink)] border border-[var(--rh-border)] rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--rh-border)] flex items-center justify-between bg-[#2A1410] text-[#FBF3E4]">
          <div className="flex items-center gap-2 min-w-0">
            <Lock className="w-4 h-4 text-[#F4B400] shrink-0" aria-hidden="true" />
            <h2 className="font-display text-lg font-bold truncate">Padharo · Patron Sign-In</h2>
          </div>
          <button
            type="button"
            onClick={closeAuthGate}
            aria-label="Close sign-in prompt"
            className="w-9 h-9 -mr-1.5 rounded-lg flex items-center justify-center hover:bg-white/10 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--rh-primary)] inline-flex items-center gap-1.5">
              {pendingIntent.intent === 'add_to_cart' ? (
                <ShoppingBag className="w-3.5 h-3.5" />
              ) : pendingIntent.intent === 'wishlist_like' ? (
                <Heart className="w-3.5 h-3.5" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              <span>{intentTitle}</span>
            </p>
            <p className="text-xs text-[var(--rh-ink-muted)] leading-relaxed">
              Sign in once to unlock full product craftsmanship details, save pieces to your Pasand wishlist, and sync
              your Haveli Bag &amp; Mohar rewards.
            </p>
          </div>

          {product && (
            <div className="p-3 rounded-xl bg-[var(--rh-bg)] border border-[var(--rh-border)] flex items-center gap-3">
              {product.images?.[0] && (
                <ResilientImage
                  src={product.images[0]}
                  alt={product.name}
                  width={56}
                  height={64}
                  className="w-14 h-16 object-cover rounded-lg border border-[var(--rh-border)] shrink-0"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-[var(--rh-ink)] truncate">{product.name}</p>
                <p className="text-[11px] text-[var(--rh-ink-muted)] truncate">
                  {product.craftType} · {product.region}
                </p>
                <p className="text-xs font-mono-num font-bold text-[var(--rh-primary)] mt-0.5">
                  ₹{product.price.toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          )}

          {/* Method Switcher */}
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-[var(--rh-surface-muted)] text-xs font-semibold">
            <button
              type="button"
              onClick={() => setAuthTab('google')}
              className={`min-h-[38px] rounded-lg cursor-pointer transition-colors ${
                authTab === 'google'
                  ? 'bg-[var(--rh-surface)] text-[var(--rh-ink)] shadow-xs'
                  : 'text-[var(--rh-ink-muted)]'
              }`}
            >
              Google Account
            </button>
            <button
              type="button"
              onClick={() => setAuthTab('phone')}
              className={`min-h-[38px] rounded-lg cursor-pointer transition-colors ${
                authTab === 'phone'
                  ? 'bg-[var(--rh-surface)] text-[var(--rh-ink)] shadow-xs'
                  : 'text-[var(--rh-ink-muted)]'
              }`}
            >
              Mobile OTP
            </button>
          </div>

          {authTab === 'google' ? (
            <div className="space-y-3">
              <div className="space-y-2 text-xs">
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="Optional WhatsApp / Mobile (+91...) for stylist callback"
                  className="w-full min-h-[42px] px-3 rounded-lg border border-[var(--rh-border)] bg-[var(--rh-bg)]"
                />
                <input
                  type="text"
                  value={leadNote}
                  onChange={(e) => setLeadNote(e.target.value)}
                  maxLength={180}
                  placeholder="Optional note (e.g. Custom size, gifting deadline, hotel inquiry)"
                  className="w-full min-h-[42px] px-3 rounded-lg border border-[var(--rh-border)] bg-[var(--rh-bg)]"
                />
              </div>

              <button
                type="button"
                disabled={authBusy}
                onClick={() => {
                  updatePendingLeadMeta({
                    phone: contactPhone.trim() || undefined,
                    note: leadNote.trim() || undefined,
                  });
                  void signInWithGoogle();
                }}
                className="w-full min-h-[46px] px-5 rounded-xl bg-[var(--rh-primary)] text-white text-sm font-semibold hover:bg-[var(--rh-primary-hover)] transition-colors inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <LogIn className="w-4 h-4" />
                <span>{authBusy ? 'Signing in with Google…' : 'Continue with Google'}</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3 text-xs">
              {!phoneConfirm ? (
                <form onSubmit={handleSendOtp} className="space-y-2.5">
                  <input
                    required
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+91 98290 12345"
                    className="w-full min-h-[42px] px-3 font-mono-num rounded-lg border border-[var(--rh-border)] bg-[var(--rh-bg)]"
                  />
                  <input
                    type="text"
                    value={leadNote}
                    onChange={(e) => setLeadNote(e.target.value)}
                    maxLength={180}
                    placeholder="Optional preference / inquiry note"
                    className="w-full min-h-[42px] px-3 rounded-lg border border-[var(--rh-border)] bg-[var(--rh-bg)]"
                  />
                  <button
                    type="submit"
                    disabled={phoneBusy}
                    className="w-full min-h-[44px] px-4 rounded-xl bg-[var(--rh-primary)] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Phone className="w-4 h-4" />
                    <span>{phoneBusy ? 'Sending OTP…' : 'Send Verification OTP'}</span>
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-2.5">
                  <input
                    required
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="Enter 6-digit SMS OTP"
                    className="w-full min-h-[42px] px-3 font-mono-num rounded-lg border border-[var(--rh-border)] bg-[var(--rh-bg)]"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPhoneConfirm(null)}
                      className="px-4 min-h-[42px] rounded-lg border border-[var(--rh-border)] font-semibold cursor-pointer"
                    >
                      Change
                    </button>
                    <button
                      type="submit"
                      disabled={phoneBusy}
                      className="flex-1 min-h-[42px] rounded-xl bg-[var(--rh-peacock)] text-white text-sm font-semibold cursor-pointer"
                    >
                      {phoneBusy ? 'Verifying…' : 'Verify & Continue'}
                    </button>
                  </div>
                </form>
              )}
              <div id="auth-gate-recaptcha" />
            </div>
          )}

          <p className="text-[11px] text-[var(--rh-ink-muted)] inline-flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[var(--rh-peacock)] shrink-0" />
            <span>Verified Firebase sign-in · Your interest is shared with our Jaipur craft concierge.</span>
          </p>
        </div>
      </div>
    </div>
  );
}
