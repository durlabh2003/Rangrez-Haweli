import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Info, ShieldCheck, Star } from 'lucide-react';
import type { Order, Review } from '../types';
import { getPatronIdToken } from '../firebase';
import { useStore } from '../context/StoreContext';
import { BandhaniSpinner } from './RajasthaniMotifs';

interface ProductReviewsProps {
  productId: string;
  productSlug: string;
  productName: string;
  onRatingUpdate?: (averageRating: number, totalCount: number) => void;
}

const RATING_LABELS: Record<number, string> = {
  1: 'Needs work',
  2: 'Fair',
  3: 'Good',
  4: 'Loved it',
  5: 'Heirloom quality',
};

export function StarRatingDisplay({
  rating,
  size = 'sm',
}: {
  rating: number;
  size?: 'sm' | 'md' | 'lg';
}) {
  const iconClass = size === 'lg' ? 'w-5 h-5' : size === 'md' ? 'w-4 h-4' : 'w-3.5 h-3.5';
  return (
    <div className="inline-flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = rating >= star - 0.25;
        const half = !filled && rating >= star - 0.75;
        return (
          <span key={star} className="relative inline-flex">
            <Star className={`${iconClass} text-[var(--rh-border)] dark:text-white/20`} aria-hidden="true" />
            {(filled || half) && (
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: filled ? '100%' : '50%' }}
              >
                <Star className={`${iconClass} fill-[#F4B400] text-[#F4B400]`} aria-hidden="true" />
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}

export function ProductReviews({
  productId,
  productSlug,
  productName,
  onRatingUpdate,
}: ProductReviewsProps) {
  const { showToast, user, signInWithGoogle, isProductionEnv } = useStore();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [starFilter, setStarFilter] = useState<number | 'all'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'highest' | 'lowest'>('newest');

  const [eligibleOrders, setEligibleOrders] = useState<Order[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [author, setAuthor] = useState('');
  const [city, setCity] = useState('Jaipur');
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [selectedRating, setSelectedRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/products/${encodeURIComponent(productSlug)}/reviews`);
      if (!res.ok) throw new Error('Unable to load reviews for this craft.');
      const data = await res.json();
      const fetched = Array.isArray(data.reviews) ? (data.reviews as Review[]) : [];
      setReviews(fetched);
      if (typeof data.realAverageRating === 'number' && typeof data.realReviewCount === 'number') {
        onRatingUpdate?.(data.realAverageRating, data.realReviewCount);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load reviews.');
    } finally {
      setLoading(false);
    }
  }, [productSlug, onRatingUpdate]);

  useEffect(() => {
    setStarFilter('all');
    fetchReviews();
  }, [fetchReviews]);

  useEffect(() => {
    if (!user) {
      setEligibleOrders([]);
      setSelectedOrderId('');
      return;
    }
    setAuthor(user.displayName || '');
    (async () => {
      const token = await getPatronIdToken();
      if (!token) return;
      const resp = await fetch('/api/orders/my', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resp.ok) {
        const data = (await resp.json()) as { orders?: Order[] };
        const deliveredMatches = (data.orders ?? []).filter(
          (o) =>
            !o.isMock &&
            o.orderStatus === 'Delivered' &&
            o.items.some((i) => i.productId === productId)
        );
        setEligibleOrders(deliveredMatches);
        if (deliveredMatches[0]) setSelectedOrderId(deliveredMatches[0].id);
      }
    })();
  }, [user, productId]);

  const stats = useMemo(() => {
    const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    const realOnly = reviews.filter((r) => !r.isMock);
    const basis = isProductionEnv ? realOnly : reviews;
    for (const r of basis) {
      const rounded = Math.min(5, Math.max(1, Math.round(r.rating)));
      counts[rounded] = (counts[rounded] ?? 0) + 1;
    }
    const total = basis.length;
    const avg =
      total > 0
        ? Number((basis.reduce((sum, r) => sum + r.rating, 0) / total).toFixed(1))
        : 0;
    return { counts, total, avg, realCount: realOnly.length };
  }, [reviews, isProductionEnv]);

  const displayedReviews = useMemo(() => {
    const filtered =
      starFilter === 'all'
        ? reviews
        : reviews.filter((r) => Math.round(r.rating) === starFilter);
    const copy = [...filtered];
    if (sortBy === 'highest') copy.sort((a, b) => b.rating - a.rating);
    else if (sortBy === 'lowest') copy.sort((a, b) => a.rating - b.rating);
    else copy.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return copy;
  }, [reviews, starFilter, sortBy]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId || !author.trim() || !comment.trim()) return;
    const token = await getPatronIdToken();
    if (!token) {
      showToast('Please sign in first.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/products/${encodeURIComponent(productSlug)}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderId: selectedOrderId,
          author: author.trim(),
          city: city.trim() || 'Jaipur',
          rating: selectedRating,
          title: title.trim() || RATING_LABELS[selectedRating],
          comment: comment.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Could not submit review.');
        return;
      }
      const created = data.review as Review;
      setReviews((prev) => [created, ...prev]);
      setTitle('');
      setComment('');
      setSelectedRating(5);
      showToast('Dhanyawad! Verified Purchase review published.');
    } finally {
      setSubmitting(false);
    }
  };

  const activeStarValue = hoverRating ?? selectedRating;

  return (
    <section
      id="patron-reviews"
      className="mt-14 pt-8 border-t border-[var(--rh-border)] grid grid-cols-1 lg:grid-cols-12 gap-8"
      aria-labelledby="patron-reviews-heading"
    >
      <div className="lg:col-span-5 space-y-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--rh-primary)]">
            Patron Impressions
          </p>
          <h2 id="patron-reviews-heading" className="font-display text-2xl font-bold mt-1">
            Customer Reviews
          </h2>
        </div>

        {/* Summary Card — Zero-review state shows honest invitation instead of 0.0 stars */}
        <div className="p-5 rounded-xl bg-[var(--rh-surface)] border border-[var(--rh-border)] space-y-4">
          {stats.total === 0 ? (
            <div className="py-2 space-y-2">
              <p className="text-sm font-semibold text-[var(--rh-ink)]">
                Be the first to review after you receive this piece
              </p>
              <p className="text-xs text-[var(--rh-ink-muted)] leading-relaxed">
                Verified Patron reviews appear here automatically once a patron completes a Delivered order for {productName}.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono-num text-3xl font-bold text-[var(--rh-ink)]">
                      {stats.avg.toFixed(1)}
                    </span>
                    <span className="text-xs text-[var(--rh-ink-muted)] font-mono-num">/ 5.0</span>
                  </div>
                  <div className="mt-1">
                    <StarRatingDisplay rating={stats.avg} size="md" />
                  </div>
                </div>
                <p className="text-xs text-[var(--rh-ink-muted)] font-mono-num text-right">
                  {stats.total} {stats.total === 1 ? 'review' : 'reviews'}
                  <span className="block text-[11px] font-sans">
                    {stats.realCount} verified purchase{stats.realCount === 1 ? '' : 's'}
                  </span>
                </p>
              </div>

              <div className="space-y-2 pt-3 border-t border-[var(--rh-border)]">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = stats.counts[star] ?? 0;
                  const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                  const isActive = starFilter === star;
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setStarFilter(isActive ? 'all' : star)}
                      className={`w-full flex items-center gap-3 text-xs py-1 px-1.5 rounded-md transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-[var(--rh-surface-muted)] font-semibold'
                          : 'hover:bg-[var(--rh-surface-muted)]/60'
                      }`}
                    >
                      <span className="w-8 text-left font-mono-num shrink-0">{star} ★</span>
                      <div className="flex-1 h-2 rounded-full bg-[var(--rh-surface-muted)] overflow-hidden">
                        <div className="h-full bg-[#F4B400] transition-all duration-300" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-10 text-right font-mono-num text-[var(--rh-ink-muted)] shrink-0">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          <div className="pt-3 border-t border-[var(--rh-border)] flex items-start gap-2 text-[11px] text-[var(--rh-ink-muted)]">
            <Info className="w-3.5 h-3.5 text-[#0F7B6C] shrink-0 mt-0.5" aria-hidden="true" />
            <span>
              <strong>How reviews are verified:</strong> Only patrons with a Delivered order containing this exact SKU can publish a review (1 review per order line). Seeded preview reviews carry a “Sample review” tag and are excluded in production.
            </span>
          </div>
        </div>

        {/* Delivered-Order Gated Review Submission */}
        <div className="p-5 rounded-xl bg-[var(--rh-surface)] border border-[var(--rh-border)] space-y-4">
          <h3 className="text-sm font-semibold">Write a Verified Purchase Review</h3>
          {!user ? (
            <div className="space-y-3">
              <p className="text-xs text-[var(--rh-ink-muted)]">
                Sign in with the account you used to order this craft to verify your Delivered order.
              </p>
              <button
                type="button"
                onClick={() => signInWithGoogle()}
                className="min-h-[44px] px-4 py-2 rounded-lg bg-[var(--rh-primary)] text-white text-xs font-semibold cursor-pointer"
              >
                Sign in to Review
              </button>
            </div>
          ) : eligibleOrders.length === 0 ? (
            <p className="text-xs text-[var(--rh-ink-muted)] leading-relaxed">
              No Delivered orders for <strong>{productName}</strong> were found under {user.email}. Once your parcel is marked Delivered, your order appears here for a Verified Purchase review.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-medium block mb-1">Delivered Order</label>
                <select
                  value={selectedOrderId}
                  onChange={(e) => setSelectedOrderId(e.target.value)}
                  className="w-full min-h-[44px] px-3 text-xs rounded-lg border border-[var(--rh-border)] bg-[var(--rh-bg)]"
                >
                  {eligibleOrders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.orderNumber} · Delivered to {o.shippingAddress.city}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-1" role="radiogroup" aria-label="Select star rating">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const active = star <= activeStarValue;
                    return (
                      <button
                        key={star}
                        type="button"
                        role="radio"
                        aria-checked={selectedRating === star}
                        aria-label={`${star} star${star > 1 ? 's' : ''}`}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(null)}
                        onClick={() => setSelectedRating(star)}
                        className="p-1.5 rounded-md hover:bg-[var(--rh-surface-muted)] cursor-pointer"
                      >
                        <Star
                          className={`w-6 h-6 ${active ? 'fill-[#F4B400] text-[#F4B400]' : 'text-[var(--rh-ink-muted)]/40'}`}
                        />
                      </button>
                    );
                  })}
                </div>
                <span className="text-xs font-medium text-[var(--rh-primary)]">
                  {RATING_LABELS[activeStarValue]}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <input
                  required
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Your name"
                  className="min-h-[44px] px-3 py-2 text-sm rounded-lg border border-[var(--rh-border)] bg-[var(--rh-bg)]"
                />
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="City"
                  className="min-h-[44px] px-3 py-2 text-sm rounded-lg border border-[var(--rh-border)] bg-[var(--rh-bg)]"
                />
              </div>

              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Headline (e.g. Authentic Sanganeri finish)"
                className="w-full min-h-[44px] px-3 py-2 text-sm rounded-lg border border-[var(--rh-border)] bg-[var(--rh-bg)]"
              />

              <textarea
                required
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Tell us about the weave, dye, or finish..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--rh-border)] bg-[var(--rh-bg)]"
              />

              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 text-xs font-semibold rounded-lg bg-[var(--rh-primary)] text-white hover:bg-[var(--rh-primary-hover)] disabled:opacity-50 cursor-pointer"
              >
                {submitting ? 'Publishing…' : 'Publish Verified Review'}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Right Column: Review Feed */}
      <div className="lg:col-span-7 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--rh-border)]">
          <div className="flex items-center gap-1 p-1 bg-[var(--rh-surface-muted)] rounded-lg overflow-x-auto no-scrollbar max-w-full">
            <button
              type="button"
              onClick={() => setStarFilter('all')}
              className={`min-h-[36px] px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer whitespace-nowrap shrink-0 ${
                starFilter === 'all'
                  ? 'bg-[var(--rh-surface)] text-[var(--rh-ink)] shadow-xs'
                  : 'text-[var(--rh-ink-muted)] hover:text-[var(--rh-ink)]'
              }`}
            >
              All ({stats.total})
            </button>
            {[5, 4, 3].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setStarFilter(star)}
                className={`min-h-[36px] px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer font-mono-num whitespace-nowrap shrink-0 ${
                  starFilter === star
                    ? 'bg-[var(--rh-surface)] text-[var(--rh-ink)] shadow-xs'
                    : 'text-[var(--rh-ink-muted)] hover:text-[var(--rh-ink)]'
                }`}
              >
                {star}★ ({stats.counts[star] ?? 0})
              </button>
            ))}
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            aria-label="Sort reviews"
            className="min-h-[40px] px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--rh-border)] bg-[var(--rh-surface)]"
          >
            <option value="newest">Most Recent</option>
            <option value="highest">Highest Rated</option>
            <option value="lowest">Lowest Rated</option>
          </select>
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3 text-[var(--rh-ink-muted)]">
            <BandhaniSpinner size={24} />
            <span className="text-xs">Fetching patron reviews…</span>
          </div>
        ) : error ? (
          <div className="p-6 rounded-xl bg-[var(--rh-surface)] border border-[var(--rh-border)] text-center space-y-3">
            <p className="text-sm text-[var(--rh-primary)]">{error}</p>
            <button
              type="button"
              onClick={fetchReviews}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-[var(--rh-border)] cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : displayedReviews.length === 0 ? (
          <div className="p-8 rounded-xl bg-[var(--rh-surface)] border border-[var(--rh-border)] text-center space-y-2">
            <p className="text-sm font-medium text-[var(--rh-ink)]">
              Be the first to review after you receive this piece.
            </p>
            {starFilter !== 'all' && (
              <button
                type="button"
                onClick={() => setStarFilter('all')}
                className="text-xs font-semibold text-[var(--rh-primary)] hover:underline cursor-pointer"
              >
                Show all reviews
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {displayedReviews.map((rev) => (
              <article
                key={rev.id}
                className="p-5 rounded-xl bg-[var(--rh-surface)] border border-[var(--rh-border)] space-y-2.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--rh-ink-muted)]">
                  <div>
                    <span className="font-semibold text-[var(--rh-ink)]">{rev.author}</span>
                    <span aria-hidden="true"> · </span>
                    <span>{rev.city}</span>
                    <span aria-hidden="true"> · </span>
                    <time dateTime={rev.createdAt} className="font-mono-num">
                      {new Date(rev.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </time>
                  </div>
                  {rev.isMock ? (
                    <span className="px-2 py-0.5 rounded bg-[var(--rh-surface-muted)] text-[10px] font-semibold uppercase tracking-wider text-[var(--rh-ink-muted)]">
                      Sample review
                    </span>
                  ) : rev.verifiedPurchase ? (
                    <span className="inline-flex items-center gap-1 text-[var(--rh-peacock)] font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Verified purchase</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[var(--rh-ink-muted)]">
                      <Check className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Patron review</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2.5">
                  <StarRatingDisplay rating={rev.rating} size="sm" />
                  <span className="text-xs font-mono-num text-[var(--rh-ink-muted)]">
                    {rev.rating.toFixed(1)}
                  </span>
                  <h4 className="text-sm font-semibold text-[var(--rh-ink)]">{rev.title}</h4>
                </div>

                <p className="text-sm text-[var(--rh-ink-muted)] leading-relaxed">{rev.comment}</p>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
