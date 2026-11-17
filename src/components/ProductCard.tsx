import React from 'react';
import { Heart, ShieldCheck, ShoppingBag, Star } from 'lucide-react';
import type { Product } from '../types';
import { useStore } from '../context/StoreContext';
import { ResilientImage } from './RajasthaniMotifs';

export function ProductCard({ product }: { product: Product }) {
  const { navigate, addToCart, wishlist, toggleWishlist, isProductionEnv, isGiVerified } = useStore();
  const isSaved = wishlist.includes(product.id);
  const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
  const primaryImg = product.images[0];
  const discountPct =
    product.mrp > product.price ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;

  // Phase 3 Rule 6: Hide star ratings on cards for products with fewer than 3 real reviews
  const realReviewCount = product.realReviewCount ?? 0;
  const showCardRating = realReviewCount >= 3 && (product.realRating ?? 0) > 0;
  const verifiedGi = product.giTagged && isGiVerified(product.giClaimId);

  return (
    <article className="group flex flex-col bg-[var(--rh-surface)] border border-[var(--rh-border)] rounded-xl overflow-hidden transition-transform duration-200 hover:-translate-y-0.5">
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-[var(--rh-surface-muted)]">
        <button
          type="button"
          onClick={() => navigate({ page: 'product', slug: product.slug }, { product })}
          className="block w-full h-full text-left cursor-pointer"
          aria-label={`View ${product.name}`}
        >
          <ResilientImage
            src={primaryImg}
            alt={product.name}
            fallbackTitle={product.name}
            width={480}
            height={600}
            sizes="(max-width: 640px) 48vw, (max-width: 1024px) 32vw, 24vw"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </button>

        {!isProductionEnv && product.isMock && (
          <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-[#2A1410]/85 text-[#FBF3E4] text-[10px] font-semibold uppercase tracking-wider">
            Sample
          </span>
        )}

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product.id, product);
          }}
          aria-label={
            isSaved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`
          }
          className={`absolute top-2 right-2 sm:top-3 sm:right-3 w-11 h-11 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all cursor-pointer border border-[var(--rh-border)] ${
            isSaved
              ? 'bg-[var(--rh-primary)] text-white scale-105'
              : 'bg-[var(--rh-surface)]/92 text-[var(--rh-ink)] hover:text-[var(--rh-primary)]'
          }`}
        >
          <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} aria-hidden="true" />
        </button>
      </div>

      <div className="p-2.5 sm:p-4 flex flex-col flex-1 justify-between gap-2 sm:gap-3">
        <div>
          <p className="text-[11px] sm:text-xs text-[var(--rh-ink-muted)] truncate flex items-center gap-1">
            <span className="truncate">
              {product.craftType} · {product.region}
            </span>
            {verifiedGi && (
              <span className="hidden sm:inline-flex items-center gap-0.5 text-[var(--rh-peacock)] font-medium shrink-0">
                <ShieldCheck className="w-3 h-3" aria-hidden="true" />
                GI Verified
              </span>
            )}
          </p>

          <h3 className="mt-1 text-xs sm:text-base font-semibold leading-snug text-[var(--rh-ink)] line-clamp-2">
            <button
              type="button"
              onClick={() => navigate({ page: 'product', slug: product.slug }, { product })}
              className="text-left hover:text-[var(--rh-primary)] transition-colors cursor-pointer"
            >
              {product.name}
            </button>
          </h3>

          {showCardRating && (
            <div className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-mono-num text-[var(--rh-ink)]">
              <Star className="w-3 h-3 fill-[#F4B400] text-[#F4B400]" aria-hidden="true" />
              <span>{product.realRating?.toFixed(1)}</span>
              <span className="text-[var(--rh-ink-muted)]">({realReviewCount})</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-1.5 sm:gap-2 pt-2 border-t border-[var(--rh-border)]">
          <div className="flex flex-wrap items-baseline gap-1 sm:gap-2 font-mono-num min-w-0">
            <span className="text-sm sm:text-base font-semibold text-[var(--rh-ink)]">
              ₹{product.price.toLocaleString('en-IN')}
            </span>
            {discountPct > 0 && (
              <span className="text-[10px] sm:text-xs text-[var(--rh-ink-muted)] line-through">
                ₹{product.mrp.toLocaleString('en-IN')}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => addToCart(product)}
            disabled={totalStock <= 0}
            className={`px-2.5 sm:px-3 min-h-[40px] sm:min-h-[36px] text-[11px] sm:text-xs font-medium rounded-lg inline-flex items-center gap-1 sm:gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              totalStock <= 0
                ? 'bg-[var(--rh-surface-muted)] text-[var(--rh-ink-muted)] cursor-not-allowed'
                : 'bg-[var(--rh-primary)] text-white hover:bg-[var(--rh-primary-hover)]'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{totalStock <= 0 ? 'Notify' : 'Add'}</span>
          </button>
        </div>
      </div>
    </article>
  );
}
