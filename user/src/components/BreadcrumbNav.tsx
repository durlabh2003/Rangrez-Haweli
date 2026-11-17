import React, { useEffect, useState } from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { useStore, type RouteView } from '../context/StoreContext';

interface CrumbItem {
  label: string;
  target?: RouteView;
}

interface ProductCrumbMeta {
  name: string;
  category: string;
}

const productMetaCache = new Map<string, ProductCrumbMeta>();
let blogTitleCache: Record<string, string> | null = null;

function formatSlug(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function BreadcrumbNav() {
  const { route, navigate, categories, lang, t } = useStore();
  const [productMeta, setProductMeta] = useState<ProductCrumbMeta | null>(null);
  const [blogTitle, setBlogTitle] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    if (route.page === 'product') {
      const cached = productMetaCache.get(route.slug);
      if (cached) {
        setProductMeta(cached);
        return;
      }
      setProductMeta(null);
      fetch(`/api/products/${encodeURIComponent(route.slug)}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (!active || !data?.product) return;
          const meta: ProductCrumbMeta = {
            name: data.product.name,
            category: data.product.category,
          };
          productMetaCache.set(route.slug, meta);
          setProductMeta(meta);
        })
        .catch(() => {});
    } else {
      setProductMeta(null);
    }

    return () => {
      active = false;
    };
  }, [route]);

  useEffect(() => {
    let active = true;

    if (route.page === 'blog' && route.slug) {
      if (blogTitleCache && blogTitleCache[route.slug]) {
        setBlogTitle(blogTitleCache[route.slug]);
        return;
      }
      setBlogTitle(null);
      fetch('/api/blog')
        .then((r) => (r.ok ? r.json() : null))
        .then((posts) => {
          if (!active || !Array.isArray(posts)) return;
          const map: Record<string, string> = {};
          for (const post of posts) {
            if (post?.slug && post?.title) map[post.slug] = post.title;
          }
          blogTitleCache = map;
          if (route.slug && map[route.slug]) {
            setBlogTitle(map[route.slug]);
          }
        })
        .catch(() => {});
    } else {
      setBlogTitle(null);
    }

    return () => {
      active = false;
    };
  }, [route]);

  if (route.page === 'home') return null;

  const resolveCategoryName = (slug: string): string => {
    const match = categories.find((c) => c.slug === slug);
    if (!match) return formatSlug(slug);
    return lang === 'hi' ? match.nameHi : match.name;
  };

  const crumbs: CrumbItem[] = [{ label: t('Home', 'होम'), target: { page: 'home' } }];

  switch (route.page) {
    case 'shop': {
      const hasSubFilters = Boolean(
        (route.category && route.category !== 'all') || route.craft || route.region || route.q
      );
      crumbs.push({
        label: t('Shop', 'दुकान'),
        target: hasSubFilters ? { page: 'shop' } : undefined,
      });

      if (route.category && route.category !== 'all') {
        const hasDeeperFilter = Boolean(route.craft || route.region || route.q);
        crumbs.push({
          label: resolveCategoryName(route.category),
          target: hasDeeperFilter ? { page: 'shop', category: route.category } : undefined,
        });
      }
      if (route.craft) {
        const hasDeeper = Boolean(route.region || route.q);
        crumbs.push({
          label: route.craft,
          target: hasDeeper ? { page: 'shop', category: route.category, craft: route.craft } : undefined,
        });
      }
      if (route.region) {
        crumbs.push({
          label: route.region,
          target: route.q
            ? { page: 'shop', category: route.category, craft: route.craft, region: route.region }
            : undefined,
        });
      }
      if (route.q) {
        crumbs.push({
          label: `${t('Search', 'खोज')}: “${route.q}”`,
        });
      }
      break;
    }

    case 'product': {
      crumbs.push({ label: t('Shop', 'दुकान'), target: { page: 'shop' } });
      if (productMeta?.category) {
        crumbs.push({
          label: resolveCategoryName(productMeta.category),
          target: { page: 'shop', category: productMeta.category },
        });
      }
      crumbs.push({
        label: productMeta?.name ?? formatSlug(route.slug),
      });
      break;
    }

    case 'checkout': {
      crumbs.push({ label: t('Shop', 'दुकान'), target: { page: 'shop' } });
      crumbs.push({ label: t('Checkout', 'चेकआउट') });
      break;
    }

    case 'wishlist': {
      crumbs.push({
        label: route.sharedIds?.length
          ? t('Shared Pasand List', 'साझा पसंद सूची')
          : t('Pasand Wishlist', 'पसंद विशलिस्ट'),
      });
      break;
    }

    case 'account': {
      crumbs.push({ label: t('Patron Account', 'ग्राहक खाता') });
      break;
    }

    case 'b2b': {
      crumbs.push({ label: t('B2B Portal', 'B2B पोर्टल') });
      break;
    }

    case 'blog': {
      crumbs.push({
        label: t('Rang aur Rivaaz Journal', 'रंग और रिवाज़'),
        target: route.slug ? { page: 'blog' } : undefined,
      });
      if (route.slug) {
        crumbs.push({ label: blogTitle ?? formatSlug(route.slug) });
      }
      break;
    }

    case 'about': {
      crumbs.push({ label: t('Our Story & Guilds', 'हमारी कहानी') });
      break;
    }

    case 'admin': {
      crumbs.push({ label: t('Studio Admin', 'स्टूडियो प्रबंधन') });
      break;
    }

    case 'track-order': {
      crumbs.push({ label: t('Track Order', 'ऑर्डर ट्रैक करें') });
      break;
    }

    case 'legal': {
      crumbs.push({ label: formatSlug(route.doc) });
      break;
    }

    case 'not-found': {
      crumbs.push({ label: '404' });
      break;
    }
  }

  return (
    <div className="border-b border-[var(--rh-border)] bg-[var(--rh-surface)]/60">
      <nav aria-label="Breadcrumb" className="max-w-7xl mx-auto px-3 sm:px-6 py-2">
        <ol className="flex items-center gap-1.5 text-xs text-[var(--rh-ink-muted)] overflow-x-auto no-scrollbar whitespace-nowrap">
          {crumbs.map((crumb, index) => {
            const isLast = index === crumbs.length - 1;
            return (
              <li key={`${crumb.label}-${index}`} className="inline-flex items-center gap-1.5 shrink-0">
                {index > 0 && (
                  <ChevronRight className="w-3.5 h-3.5 text-[var(--rh-ink-muted)]/60 shrink-0" aria-hidden="true" />
                )}

                {crumb.target && !isLast ? (
                  <button
                    type="button"
                    onClick={() => navigate(crumb.target!)}
                    className="inline-flex items-center gap-1.5 min-h-[32px] hover:text-[var(--rh-primary)] transition-colors cursor-pointer truncate max-w-[140px] sm:max-w-none"
                  >
                    {index === 0 && <Home className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />}
                    <span className="truncate">{crumb.label}</span>
                  </button>
                ) : (
                  <span
                    aria-current={isLast ? 'page' : undefined}
                    className="font-medium text-[var(--rh-ink)] truncate max-w-[180px] sm:max-w-md"
                  >
                    {crumb.label}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}
