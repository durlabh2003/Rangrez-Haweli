import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  RotateCcw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import type { CategorySlug, Product } from '../types';
import { ProductCard } from './ProductCard';

type CollectionScope = 'bestsellers' | 'new' | 'all' | CategorySlug;
type BudgetRange = 'all' | 'under-1500' | '1500-3500' | 'above-3500';
type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'rating' | 'newest';

const COLLECTION_TABS: { id: CollectionScope; label: string }[] = [
  { id: 'bestsellers', label: 'Bestsellers' },
  { id: 'new', label: 'New Arrivals' },
  { id: 'all', label: 'All Crafts' },
  { id: 'textiles-apparel', label: 'Apparel & Textiles' },
  { id: 'home-furnishing', label: 'Home & Decor' },
  { id: 'jewellery', label: 'Jewellery' },
  { id: 'footwear-leather', label: 'Leather & Mojari' },
  { id: 'art-decor', label: 'Art & Wall' },
  { id: 'gifting-festive', label: 'Festive & Gifting' },
];

const BUDGET_OPTIONS: {
  id: BudgetRange;
  label: string;
  minPrice?: number;
  maxPrice?: number;
}[] = [
  { id: 'all', label: 'Any Budget' },
  { id: 'under-1500', label: 'Under ₹1,500', maxPrice: 1500 },
  { id: '1500-3500', label: '₹1,500 – ₹3,500', minPrice: 1500, maxPrice: 3500 },
  { id: 'above-3500', label: 'Above ₹3,500', minPrice: 3500 },
];

const CATEGORY_SET = new Set<string>([
  'textiles-apparel',
  'home-furnishing',
  'jewellery',
  'footwear-leather',
  'art-decor',
  'gifting-festive',
]);

export function LandingProductFinder() {
  const { navigate } = useStore();

  const [scope, setScope] = useState<CollectionScope>('bestsellers');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [budget, setBudget] = useState<BudgetRange>('all');
  const [giOnly, setGiOnly] = useState(false);
  const [sort, setSort] = useState<SortOption>('featured');

  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(searchInput.trim());
    }, 200);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);

    const params = new URLSearchParams();
    if (debouncedQuery) params.set('q', debouncedQuery);

    if (CATEGORY_SET.has(scope)) {
      params.set('category', scope);
    } else if (scope === 'bestsellers') {
      params.set('bestseller', 'true');
    } else if (scope === 'new') {
      params.set('newArrival', 'true');
    }

    const budgetSpec = BUDGET_OPTIONS.find((b) => b.id === budget);
    if (budgetSpec?.minPrice !== undefined) {
      params.set('minPrice', String(budgetSpec.minPrice));
    }
    if (budgetSpec?.maxPrice !== undefined) {
      params.set('maxPrice', String(budgetSpec.maxPrice));
    }
    if (giOnly) params.set('gi', 'true');
    params.set('sort', sort);

    fetch(`/api/products?${params.toString()}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        setProducts(Array.isArray(data.products) ? data.products : []);
        setTotal(typeof data.total === 'number' ? data.total : 0);
        setLoading(false);
      })
      .catch((err) => {
        if (err?.name !== 'AbortError') {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [scope, debouncedQuery, budget, giOnly, sort]);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    if (value.trim() && (scope === 'bestsellers' || scope === 'new')) {
      setScope('all');
    }
  };

  const resetFilters = () => {
    setScope('bestsellers');
    setSearchInput('');
    setDebouncedQuery('');
    setBudget('all');
    setGiOnly(false);
    setSort('featured');
  };

  const hasCustomFilters =
    scope !== 'bestsellers' ||
    searchInput.trim().length > 0 ||
    budget !== 'all' ||
    giOnly ||
    sort !== 'featured';

  const visibleProducts = products.slice(0, 6);
  const selectedCategory = CATEGORY_SET.has(scope) ? scope : undefined;

  return (
    <section
      aria-label="Haveli Product Finder"
      className="max-w-7xl mx-auto px-3 sm:px-6 py-7 sm:py-10"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 mb-5 sm:mb-6">
        <div>
          <p className="text-xs font-medium text-[var(--rh-primary)] uppercase tracking-wider">
            Curated from the Haveli · Direct Product Finder
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold mt-1">
            Find suitable handcrafted pieces right here
          </h2>
        </div>

        <button
          type="button"
          onClick={() => {
            const bSpec = BUDGET_OPTIONS.find((b) => b.id === budget);
            navigate({
              page: 'shop',
              category: selectedCategory,
              bestseller: scope === 'bestsellers' ? true : undefined,
              newArrival: scope === 'new' ? true : undefined,
              minPrice: bSpec?.minPrice,
              maxPrice: bSpec?.maxPrice,
              gi: giOnly ? true : undefined,
              sort: sort !== 'featured' ? sort : undefined,
              q: debouncedQuery || undefined,
            });
          }}
          className="text-sm font-medium text-[var(--rh-primary)] hover:underline inline-flex items-center gap-1.5 min-h-[40px] cursor-pointer whitespace-nowrap self-start sm:self-auto"
        >
          <span>Open Full Shop ({total} pieces)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Single-elevation interactive finder controls */}
      <div className="bg-[var(--rh-surface)] border border-[var(--rh-border)] rounded-2xl p-3.5 sm:p-5 space-y-3.5 sm:space-y-4 mb-5 sm:mb-6">
        {/* Search + Budget + Sort */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
          <div className="lg:col-span-5 relative">
            <Search className="w-4 h-4 text-[var(--rh-ink-muted)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search kurtas, Blue Pottery, Thewa jewellery..."
              aria-label="Search handcrafted products on landing page"
              className="w-full min-h-[44px] pl-10 pr-10 py-2.5 text-sm rounded-lg border border-[var(--rh-border)] bg-[var(--rh-bg)] text-[var(--rh-ink)] placeholder:text-[var(--rh-ink-muted)] focus:outline-none focus:border-[var(--rh-primary)]"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => handleSearchChange('')}
                aria-label="Clear search query"
                className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-[var(--rh-ink-muted)] hover:text-[var(--rh-ink)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="lg:col-span-7 flex flex-col sm:flex-row sm:flex-wrap sm:items-center justify-between lg:justify-end gap-2">
            {/* Budget segmented buttons (scrollable on mobile) */}
            <div className="flex items-center gap-1 bg-[var(--rh-surface-muted)] p-1 rounded-lg overflow-x-auto no-scrollbar max-w-full">
              {BUDGET_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setBudget(opt.id)}
                  className={`px-3 min-h-[36px] text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer font-mono-num ${
                    budget === opt.id
                      ? 'bg-[var(--rh-surface)] text-[var(--rh-ink)] shadow-xs font-semibold'
                      : 'text-[var(--rh-ink-muted)] hover:text-[var(--rh-ink)]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              {/* GI Certified toggle */}
              <button
                type="button"
                onClick={() => setGiOnly((v) => !v)}
                className={`px-3 min-h-[42px] sm:min-h-[38px] text-xs font-medium rounded-lg border inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  giOnly
                    ? 'bg-[var(--rh-peacock)] text-white border-[var(--rh-peacock)]'
                    : 'border-[var(--rh-border)] bg-[var(--rh-bg)] text-[var(--rh-ink)] hover:border-[var(--rh-peacock)]'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>GI Tagged</span>
              </button>

              {/* Sort select */}
              <div className="flex-1 sm:flex-initial inline-flex items-center gap-1.5 border border-[var(--rh-border)] rounded-lg bg-[var(--rh-bg)] px-2.5 min-h-[42px] sm:min-h-[38px]">
                <SlidersHorizontal className="w-3.5 h-3.5 text-[var(--rh-ink-muted)] shrink-0" />
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortOption)}
                  aria-label="Sort matching products"
                  className="w-full text-xs font-medium bg-transparent text-[var(--rh-ink)] focus:outline-none cursor-pointer"
                >
                  <option value="featured">Recommended</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="rating">Top Rated</option>
                  <option value="newest">Newest First</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Category & Collection Tabs */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-[var(--rh-border)]">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
            {COLLECTION_TABS.map((tab) => {
              const active = scope === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setScope(tab.id)}
                  className={`px-3 min-h-[38px] text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-[var(--rh-primary)] text-white font-semibold'
                      : 'bg-[var(--rh-surface-muted)] text-[var(--rh-ink-muted)] hover:text-[var(--rh-ink)]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {hasCustomFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="px-2.5 min-h-[38px] text-xs font-medium text-[var(--rh-primary)] hover:bg-[var(--rh-surface-muted)] rounded-lg inline-flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Live Result Count */}
      <div className="flex items-center justify-between gap-2 text-xs text-[var(--rh-ink-muted)] mb-4">
        <p className="font-mono-num truncate">
          {loading
            ? 'Searching craft catalogue...'
            : `Showing ${visibleProducts.length} of ${total} crafts`}
          {debouncedQuery ? ` · "${debouncedQuery}"` : ''}
        </p>
        {total > 6 && !loading && (
          <button
            type="button"
            onClick={() =>
              navigate({
                page: 'shop',
                category: selectedCategory,
                q: debouncedQuery || undefined,
              })
            }
            className="font-medium text-[var(--rh-primary)] hover:underline cursor-pointer whitespace-nowrap shrink-0"
          >
            See all {total} →
          </button>
        )}
      </div>

      {/* Responsive 2-col Mobile / 3-col Desktop Product Results */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="bg-[var(--rh-surface)] border border-[var(--rh-border)] rounded-xl overflow-hidden animate-pulse"
            >
              <div className="aspect-[4/5] bg-[var(--rh-surface-muted)]" />
              <div className="p-3 sm:p-4 space-y-2.5">
                <div className="h-3 w-1/2 bg-[var(--rh-surface-muted)] rounded" />
                <div className="h-4 w-5/6 bg-[var(--rh-surface-muted)] rounded" />
                <div className="h-8 w-full bg-[var(--rh-surface-muted)] rounded mt-3" />
              </div>
            </div>
          ))}
        </div>
      ) : visibleProducts.length === 0 ? (
        <div className="bg-[var(--rh-surface)] border border-[var(--rh-border)] rounded-2xl p-8 sm:p-10 text-center space-y-3">
          <p className="font-display text-xl font-semibold text-[var(--rh-ink)]">
            No crafts matched those exact filters
          </p>
          <p className="text-sm text-[var(--rh-ink-muted)] max-w-md mx-auto">
            Try widening the budget range, switching to All 108 Crafts, or clearing the search term.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="px-5 min-h-[44px] text-xs font-semibold rounded-lg bg-[var(--rh-primary)] text-white hover:bg-[var(--rh-primary-hover)] cursor-pointer"
          >
            Reset Finder Filters
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {visibleProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {total > 6 && (
            <div className="mt-6 sm:mt-7 text-center">
              <button
                type="button"
                onClick={() => {
                  const bSpec = BUDGET_OPTIONS.find((b) => b.id === budget);
                  navigate({
                    page: 'shop',
                    category: selectedCategory,
                    bestseller: scope === 'bestsellers' ? true : undefined,
                    newArrival: scope === 'new' ? true : undefined,
                    minPrice: bSpec?.minPrice,
                    maxPrice: bSpec?.maxPrice,
                    gi: giOnly ? true : undefined,
                    sort: sort !== 'featured' ? sort : undefined,
                    q: debouncedQuery || undefined,
                  });
                }}
                className="w-full sm:w-auto px-6 min-h-[44px] py-3 text-sm font-semibold rounded-lg border border-[var(--rh-primary)] text-[var(--rh-primary)] hover:bg-[var(--rh-primary)] hover:text-white transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Browse all {total} matching products in Shop</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
