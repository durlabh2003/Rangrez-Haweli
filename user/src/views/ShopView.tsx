import React, { useCallback, useEffect, useState } from 'react';
import { Filter, LayoutGrid, List, RotateCcw, Search } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import type { Product } from '../types';
import { ProductCard } from '../components/ProductCard';
import { BandhaniSpinner, KathputliMascot, ResilientImage } from '../components/RajasthaniMotifs';

export function ShopView() {
  const { route, categories, navigate, addToCart, recentlyViewed, isProductionEnv } = useStore();
  const shopRoute = route.page === 'shop' ? route : null;

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(shopRoute?.q ?? '');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);
  const perPage = 12;

  const category = shopRoute?.category ?? 'all';
  const craft = shopRoute?.craft ?? '';
  const region = shopRoute?.region ?? '';
  const occasion = shopRoute?.occasion ?? '';
  const color = shopRoute?.color ?? '';
  const giOnly = Boolean(shopRoute?.gi);
  const inStockOnly = Boolean(shopRoute?.inStock);
  const bestseller = Boolean(shopRoute?.bestseller);
  const newArrival = Boolean(shopRoute?.newArrival);
  const minPrice = shopRoute?.minPrice ?? 0;
  const maxPrice = shopRoute?.maxPrice ?? 16000;
  const sort = shopRoute?.sort ?? 'featured';
  const q = shopRoute?.q ?? '';

  useEffect(() => {
    setSearchInput(q);
  }, [q]);

  const updateUrlFilters = useCallback(
    (patch: Partial<Extract<typeof route, { page: 'shop' }>>) => {
      setPage(1);
      navigate(
        {
          page: 'shop',
          category: category === 'all' ? undefined : category,
          craft: craft || undefined,
          region: region || undefined,
          occasion: occasion || undefined,
          color: color || undefined,
          gi: giOnly || undefined,
          inStock: inStockOnly || undefined,
          bestseller: bestseller || undefined,
          newArrival: newArrival || undefined,
          minPrice: minPrice > 0 ? minPrice : undefined,
          maxPrice: maxPrice < 16000 ? maxPrice : undefined,
          sort: sort !== 'featured' ? sort : undefined,
          q: q || undefined,
          ...patch,
        },
        { replace: true }
      );
    },
    [
      navigate,
      category,
      craft,
      region,
      occasion,
      color,
      giOnly,
      inStockOnly,
      bestseller,
      newArrival,
      minPrice,
      maxPrice,
      sort,
      q,
    ]
  );

  // Debounce search text into query URL cleanly
  useEffect(() => {
    const trimmed = searchInput.trim();
    if (trimmed === q) return;
    const timer = window.setTimeout(() => {
      updateUrlFilters({ q: trimmed || undefined });
    }, 240);
    return () => window.clearTimeout(timer);
  }, [searchInput, q, updateUrlFilters]);

  const activeFilterCount =
    (category !== 'all' ? 1 : 0) +
    (craft ? 1 : 0) +
    (region ? 1 : 0) +
    (occasion ? 1 : 0) +
    (color ? 1 : 0) +
    (giOnly ? 1 : 0) +
    (inStockOnly ? 1 : 0) +
    (bestseller ? 1 : 0) +
    (newArrival ? 1 : 0) +
    (maxPrice < 16000 ? 1 : 0) +
    (minPrice > 0 ? 1 : 0);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    const params = new URLSearchParams();
    if (category !== 'all') params.set('category', category);
    if (craft) params.set('craft', craft);
    if (region) params.set('region', region);
    if (occasion) params.set('occasion', occasion);
    if (color) params.set('color', color);
    if (q) params.set('q', q);
    if (giOnly) params.set('gi', 'true');
    if (inStockOnly) params.set('inStock', 'true');
    if (bestseller) params.set('bestseller', 'true');
    if (newArrival) params.set('newArrival', 'true');
    if (minPrice > 0) params.set('minPrice', String(minPrice));
    if (maxPrice < 16000) params.set('maxPrice', String(maxPrice));
    params.set('sort', sort);

    fetch(`/api/products?${params.toString()}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d) => {
        setProducts(d.products ?? []);
        setLoading(false);
      })
      .catch((err) => {
        if (err?.name !== 'AbortError') setLoading(false);
      });
    return () => ctrl.abort();
  }, [category, craft, region, occasion, color, q, giOnly, inStockOnly, bestseller, newArrival, minPrice, maxPrice, sort]);

  const totalPages = Math.max(1, Math.ceil(products.length / perPage));
  const paginated = products.slice((page - 1) * perPage, page * perPage);

  const resetFilters = () => {
    setSearchInput('');
    setPage(1);
    navigate({ page: 'shop' }, { replace: true });
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 sm:pb-6 border-b border-[var(--rh-border)]">
        <div>
          <p className="text-xs font-medium text-[var(--rh-primary)] uppercase tracking-wider">Haveli Catalogue</p>
          <h1 className="font-display text-2xl sm:text-4xl font-bold mt-1">
            {category === 'all'
              ? bestseller
                ? 'Bestselling Rajasthani Crafts'
                : newArrival
                  ? 'New Atelier Arrivals'
                  : 'All Handcrafted Pieces'
              : categories.find((c) => c.slug === category)?.name ?? 'Curated Crafts'}
          </h1>
          <p className="text-xs sm:text-sm text-[var(--rh-ink-muted)] mt-1 font-mono-num">
            Showing {products.length} documented crafts{isProductionEnv ? '' : ' (including sample catalogue items)'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="relative flex-1 sm:flex-initial min-w-[200px]">
            <Search className="w-4 h-4 text-[var(--rh-ink-muted)] absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Filter by name, SKU, craft..."
              aria-label="Filter catalogue by name, SKU, or craft"
              className="w-full min-h-[44px] pl-9 pr-3 py-2 text-sm rounded-lg border border-[var(--rh-border)] bg-[var(--rh-surface)] focus:outline-none focus:border-[var(--rh-primary)]"
            />
          </div>

          <button
            type="button"
            onClick={() => setMobileFiltersOpen((v) => !v)}
            className={`lg:hidden min-h-[44px] px-3.5 text-xs font-semibold rounded-lg border inline-flex items-center gap-1.5 cursor-pointer ${
              mobileFiltersOpen || activeFilterCount > 0
                ? 'border-[var(--rh-primary)] bg-[var(--rh-primary)]/10 text-[var(--rh-primary)]'
                : 'border-[var(--rh-border)] bg-[var(--rh-surface)] text-[var(--rh-ink)]'
            }`}
          >
            <Filter className="w-4 h-4" aria-hidden="true" />
            <span>Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}</span>
          </button>

          <select
            value={sort}
            onChange={(e) => updateUrlFilters({ sort: e.target.value })}
            aria-label="Sort products"
            className="min-h-[44px] px-3 py-2 text-sm rounded-lg border border-[var(--rh-border)] bg-[var(--rh-surface)]"
          >
            <option value="featured">Featured &amp; Curated</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="rating">Highest Verified Rating</option>
            <option value="newest">New Arrivals</option>
          </select>

          <div className="inline-flex border border-[var(--rh-border)] rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
              aria-pressed={viewMode === 'grid'}
              className={`min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer ${viewMode === 'grid' ? 'bg-[var(--rh-surface-muted)]' : 'bg-[var(--rh-surface)]'}`}
            >
              <LayoutGrid className="w-4 h-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              aria-label="List view"
              aria-pressed={viewMode === 'list'}
              className={`min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer ${viewMode === 'list' ? 'bg-[var(--rh-surface-muted)]' : 'bg-[var(--rh-surface)]'}`}
            >
              <List className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-3 sm:py-4">
        <button
          type="button"
          onClick={() => updateUrlFilters({ category: undefined })}
          className={`px-3.5 min-h-[38px] text-xs font-semibold rounded-lg whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
            category === 'all'
              ? 'bg-[var(--rh-primary)] text-white'
              : 'bg-[var(--rh-surface-muted)] text-[var(--rh-ink)] hover:bg-[var(--rh-border)]'
          }`}
        >
          All Categories
        </button>
        {categories.map((c) => (
          <button
            key={c.slug}
            type="button"
            onClick={() => updateUrlFilters({ category: c.slug })}
            className={`px-3.5 min-h-[38px] text-xs font-semibold rounded-lg whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
              category === c.slug
                ? 'bg-[var(--rh-primary)] text-white'
                : 'bg-[var(--rh-surface-muted)] text-[var(--rh-ink)] hover:bg-[var(--rh-border)]'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 mt-2 sm:mt-4">
        {/* Sidebar Filters */}
        <aside className={`${mobileFiltersOpen ? 'block' : 'hidden'} lg:block lg:col-span-3 space-y-6`}>
          <div className="bg-[var(--rh-surface)] border border-[var(--rh-border)] rounded-xl p-4 sm:p-5 space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold inline-flex items-center gap-2">
                <Filter className="w-4 h-4 text-[var(--rh-primary)]" aria-hidden="true" />
                Filters
              </span>
              <button
                type="button"
                onClick={resetFilters}
                className="min-h-[36px] px-2 text-xs text-[var(--rh-primary)] hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" aria-hidden="true" />
                Reset
              </button>
            </div>

            <div className="space-y-2">
              <label htmlFor="shop-region-filter" className="text-xs font-medium text-[var(--rh-ink-muted)] block">
                Region / Town
              </label>
              <select
                id="shop-region-filter"
                value={region}
                onChange={(e) => updateUrlFilters({ region: e.target.value || undefined })}
                className="w-full min-h-[44px] px-3 py-2 text-sm rounded-lg border border-[var(--rh-border)] bg-[var(--rh-bg)]"
              >
                <option value="">All Rajasthan Towns</option>
                {['Jaipur', 'Sanganer', 'Bagru', 'Pratapgarh', 'Shahpura', 'Jodhpur', 'Bikaner', 'Sikar', 'Kaithoon', 'Barmer'].map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="shop-craft-filter" className="text-xs font-medium text-[var(--rh-ink-muted)] block">
                Craft Technique
              </label>
              <select
                id="shop-craft-filter"
                value={craft}
                onChange={(e) => updateUrlFilters({ craft: e.target.value || undefined })}
                className="w-full min-h-[44px] px-3 py-2 text-sm rounded-lg border border-[var(--rh-border)] bg-[var(--rh-bg)]"
              >
                <option value="">All Techniques</option>
                {['Sanganeri', 'Bagru', 'Bandhani', 'Leheriya', 'Kota Doria', 'Meenakari', 'Thewa', 'Blue Pottery', 'Phad', 'Mojari'].map((cr) => (
                  <option key={cr} value={cr}>{cr}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="shop-occasion-filter" className="text-xs font-medium text-[var(--rh-ink-muted)] block">
                Occasion
              </label>
              <select
                id="shop-occasion-filter"
                value={occasion}
                onChange={(e) => updateUrlFilters({ occasion: e.target.value || undefined })}
                className="w-full min-h-[44px] px-3 py-2 text-sm rounded-lg border border-[var(--rh-border)] bg-[var(--rh-bg)]"
              >
                <option value="">All Occasions</option>
                {['Festive', 'Wedding', 'Workwear', 'Home', 'Gifting'].map((oc) => (
                  <option key={oc} value={oc}>{oc}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-[var(--rh-ink-muted)]">Max Price</span>
                <span className="font-mono-num">₹{maxPrice.toLocaleString('en-IN')}</span>
              </div>
              <input
                type="range"
                min={500}
                max={16000}
                step={500}
                value={maxPrice}
                aria-label="Maximum price filter"
                onChange={(e) => {
                  const val = Number(e.target.value);
                  updateUrlFilters({ maxPrice: val < 16000 ? val : undefined });
                }}
                className="w-full h-6 accent-[#B3123F]"
              />
            </div>

            <div className="space-y-2 pt-2 border-t border-[var(--rh-border)]">
              <label className="flex items-center gap-2.5 min-h-[38px] text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={bestseller}
                  onChange={(e) => updateUrlFilters({ bestseller: e.target.checked || undefined })}
                  className="w-4 h-4 accent-[#B3123F]"
                />
                <span>Curated Bestsellers</span>
              </label>
              <label className="flex items-center gap-2.5 min-h-[38px] text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={newArrival}
                  onChange={(e) => updateUrlFilters({ newArrival: e.target.checked || undefined })}
                  className="w-4 h-4 accent-[#B3123F]"
                />
                <span>New Arrivals</span>
              </label>
              <label className="flex items-center gap-2.5 min-h-[38px] text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={giOnly}
                  onChange={(e) => updateUrlFilters({ gi: e.target.checked || undefined })}
                  className="w-4 h-4 accent-[#0F7B6C]"
                />
                <span>GI-Origin Crafts</span>
              </label>
              <label className="flex items-center gap-2.5 min-h-[38px] text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => updateUrlFilters({ inStock: e.target.checked || undefined })}
                  className="w-4 h-4 accent-[#B3123F]"
                />
                <span>In Stock Ready to Ship</span>
              </label>
            </div>

            <button
              type="button"
              onClick={() => setMobileFiltersOpen(false)}
              className="lg:hidden w-full min-h-[44px] rounded-lg bg-[var(--rh-primary)] text-white text-xs font-semibold cursor-pointer"
            >
              Show {products.length} Matching Crafts
            </button>
          </div>
        </aside>

        {/* Product Results */}
        <div className="lg:col-span-9">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-[var(--rh-ink-muted)]">
              <BandhaniSpinner size={28} />
              <span className="text-sm">Gathering handcrafted pieces from the haveli…</span>
            </div>
          ) : paginated.length === 0 ? (
            <div className="py-16 text-center bg-[var(--rh-surface)] border border-[var(--rh-border)] rounded-2xl px-4">
              <KathputliMascot size={68} label="No crafts match these exact filters" />
              <button
                type="button"
                onClick={resetFilters}
                className="mt-4 px-5 min-h-[44px] text-sm font-medium rounded-lg bg-[var(--rh-primary)] text-white cursor-pointer"
              >
                Clear All Filters
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
              {paginated.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {paginated.map((p) => (
                <div
                  key={p.id}
                  className="bg-[var(--rh-surface)] border border-[var(--rh-border)] rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row gap-4 sm:gap-5 items-start sm:items-center justify-between"
                >
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <ResilientImage
                      src={p.images[0]}
                      alt={p.name}
                      width={96}
                      height={112}
                      className="w-20 h-24 sm:w-24 sm:h-28 object-cover rounded-lg border border-[var(--rh-border)] shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-[11px] sm:text-xs text-[var(--rh-ink-muted)] truncate">
                        {p.craftType} · {p.region} · <span className="font-mono-num">{p.sku}</span>
                      </p>
                      <button
                        type="button"
                        onClick={() => navigate({ page: 'product', slug: p.slug }, { product: p })}
                        className="text-base sm:text-lg font-display font-semibold hover:text-[var(--rh-primary)] text-left cursor-pointer"
                      >
                        {p.name}
                      </button>
                      <p className="text-xs text-[var(--rh-ink-muted)] mt-1 max-w-xl line-clamp-2">{p.shortDescription}</p>
                    </div>
                  </div>
                  <div className="w-full sm:w-auto flex sm:flex-col items-center sm:items-end justify-between gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[var(--rh-border)]">
                    <span className="font-mono-num text-base sm:text-lg font-bold">₹{p.price.toLocaleString('en-IN')}</span>
                    <button
                      type="button"
                      onClick={() => addToCart(p)}
                      className="px-4 min-h-[40px] text-xs font-semibold rounded-lg bg-[var(--rh-primary)] text-white hover:bg-[var(--rh-primary-hover)] cursor-pointer"
                    >
                      Add to Bag
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
              {Array.from({ length: totalPages }).map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setPage(idx + 1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`min-w-[44px] min-h-[44px] text-xs font-mono-num font-semibold rounded-lg border cursor-pointer ${
                    page === idx + 1
                      ? 'bg-[var(--rh-primary)] text-white border-[var(--rh-primary)]'
                      : 'bg-[var(--rh-surface)] border-[var(--rh-border)] hover:border-[var(--rh-primary)]'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          )}

          {/* Recently Viewed */}
          {recentlyViewed.length > 0 && (
            <div className="mt-12 sm:mt-14 pt-8 border-t border-[var(--rh-border)]">
              <h2 className="font-display text-xl font-bold mb-4">Recently Viewed</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                {recentlyViewed.slice(0, 4).map((rv) => (
                  <button
                    key={rv.id}
                    type="button"
                    onClick={() => navigate({ page: 'product', slug: rv.slug }, { product: rv })}
                    className="text-left bg-[var(--rh-surface)] border border-[var(--rh-border)] rounded-lg p-2.5 sm:p-3 hover:border-[var(--rh-primary)] cursor-pointer"
                  >
                    <ResilientImage
                      src={rv.images[0]}
                      alt={rv.name}
                      width={240}
                      height={240}
                      className="w-full aspect-square object-cover rounded mb-2"
                    />
                    <p className="text-xs font-semibold truncate">{rv.name}</p>
                    <p className="text-xs font-mono-num text-[var(--rh-ink-muted)]">₹{rv.price.toLocaleString('en-IN')}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
