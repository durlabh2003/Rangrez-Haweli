import React from 'react';
import { Minus, Plus, ShieldCheck, ShoppingBag, Trash2, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { KathputliMascot, ResilientImage } from './RajasthaniMotifs';

export function CartDrawer() {
  const {
    cart,
    cartOpen,
    setCartOpen,
    updateCartQty,
    removeFromCart,
    navigate,
    adminConfig,
    requireAuthForAction,
  } = useStore();

  if (!cartOpen) return null;

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const freeShippingTarget = adminConfig.freeShippingThresholdInr;
  const remainingForFreeShip = Math.max(0, freeShippingTarget - subtotal);
  const progressPct = Math.min(100, Math.round((subtotal / Math.max(1, freeShippingTarget)) * 100));

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/45 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="Shopping Bag"
    >
      <div className="w-full max-w-md bg-[var(--rh-surface)] text-[var(--rh-ink)] h-full flex flex-col border-l border-[var(--rh-border)] shadow-2xl">
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-[var(--rh-border)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[var(--rh-primary)]" aria-hidden="true" />
            <h2 className="font-display text-xl font-semibold">Your Haveli Bag</h2>
          </div>
          <button
            type="button"
            onClick={() => setCartOpen(false)}
            aria-label="Close bag"
            className="w-11 h-11 -mr-2 rounded-lg flex items-center justify-center hover:bg-[var(--rh-surface-muted)] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-4 sm:px-6 py-3 bg-[var(--rh-surface-muted)]/60 border-b border-[var(--rh-border)]">
          <p className="text-xs font-medium text-[var(--rh-ink)]">
            {remainingForFreeShip > 0
              ? `Add ₹${remainingForFreeShip.toLocaleString('en-IN')} more for complimentary pan-India delivery`
              : 'Complimentary insured courier unlocked'}
          </p>
          <div className="mt-2 h-1.5 w-full bg-[var(--rh-border)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--rh-peacock)] transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <KathputliMascot
                size={72}
                label="Thaila khaali hai — your bag awaits handmade treasures"
              />
              <button
                type="button"
                onClick={() => {
                  setCartOpen(false);
                  navigate({ page: 'shop' });
                }}
                className="mt-6 px-5 min-h-[44px] text-sm font-medium bg-[var(--rh-primary)] text-white rounded-lg hover:bg-[var(--rh-primary-hover)] cursor-pointer"
              >
                Explore Crafts
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={`${item.product.id}-${item.variant.id}`}
                className="flex gap-3 sm:gap-4 pb-4 border-b border-[var(--rh-border)]"
              >
                <ResilientImage
                  src={item.product.images[0]}
                  alt={item.product.name}
                  width={80}
                  height={96}
                  sizes="80px"
                  className="w-20 h-24 object-cover rounded-lg border border-[var(--rh-border)] shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => {
                      setCartOpen(false);
                      navigate({ page: 'product', slug: item.product.slug }, { product: item.product });
                    }}
                    className="text-sm font-semibold text-left hover:text-[var(--rh-primary)] line-clamp-1 cursor-pointer"
                  >
                    {item.product.name}
                  </button>
                  <p className="text-xs text-[var(--rh-ink-muted)] mt-0.5 truncate">
                    {item.variant.label} · {item.product.region}
                  </p>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <div className="inline-flex items-center border border-[var(--rh-border)] rounded-lg">
                      <button
                        type="button"
                        onClick={() => updateCartQty(item.product.id, item.variant.id, -1)}
                        aria-label="Decrease quantity"
                        className="w-10 h-10 flex items-center justify-center hover:bg-[var(--rh-surface-muted)] cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-2.5 text-xs font-mono-num font-medium">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateCartQty(item.product.id, item.variant.id, 1)}
                        aria-label="Increase quantity"
                        className="w-10 h-10 flex items-center justify-center hover:bg-[var(--rh-surface-muted)] cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <span className="font-mono-num text-sm font-semibold">
                        ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.product.id, item.variant.id)}
                        aria-label="Remove item"
                        className="w-10 h-10 flex items-center justify-center text-[var(--rh-ink-muted)] hover:text-[var(--rh-primary)] cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="p-4 sm:p-6 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-[var(--rh-border)] bg-[var(--rh-bg)]/50 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--rh-ink-muted)]">Bag Total (GST-inclusive)</span>
              <span className="font-mono-num text-lg font-bold">
                ₹{subtotal.toLocaleString('en-IN')}
              </span>
            </div>
            <p className="text-[11px] text-[#0F7B6C] flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              Save ₹{adminConfig.prepaidIncentiveInr} extra with UPI/Card at checkout · Coupons & Mohar applied server-side
            </p>
            <button
              type="button"
              onClick={() => {
                requireAuthForAction(
                  {
                    intent: 'checkout_start',
                    product: cart[0]?.product,
                    sourcePath: window.location.pathname,
                    note: `Checkout started (${cart.length} line items, ₹${subtotal.toLocaleString('en-IN')})`,
                  },
                  () => {
                    setCartOpen(false);
                    navigate({ page: 'checkout' });
                  }
                );
              }}
              className="w-full min-h-[48px] py-3 text-sm font-semibold rounded-lg bg-[var(--rh-primary)] text-white hover:bg-[var(--rh-primary-hover)] transition-colors cursor-pointer"
            >
              Proceed to Checkout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
