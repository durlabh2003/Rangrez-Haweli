import type { DatabaseState } from './db.js';
import {
  getPublicBlogPosts,
  getPublicProducts,
  getPublicReviews,
  isProductionEnv,
} from './db.js';
import type { BlogPost, Product } from '../types.js';

export interface SeoResolutionResult {
  status: number;
  title: string;
  description: string;
  canonicalUrl: string;
  robots: string;
  ogType: 'website' | 'product' | 'article';
  ogImage: string;
  jsonLd: object[];
  criticalHtmlSnapshot: string;
}

function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getBaseUrl(reqOrigin?: string): string {
  const envUrl = (process.env.APP_URL || '').replace(/\/+$/, '');
  if (envUrl && !envUrl.includes('localhost')) return envUrl;
  return (reqOrigin || envUrl || 'https://rangrezhaveli.example').replace(/\/+$/, '');
}

function buildOrgAndWebsiteJsonLd(baseUrl: string): object[] {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Rangrez Haveli',
      url: baseUrl,
      logo: `${baseUrl}/assets/hero/hawa-hero-1280.webp`,
      description:
        'Authentic Rajasthani handicrafts marketplace partnering with Jaipur, Bagru, Sanganer, Kota, Pratapgarh, and Barmer artisan guilds.',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Rangrez Haveli',
      url: baseUrl,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${baseUrl}/shop?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
  ];
}

export function resolveRouteSeo(
  reqPath: string,
  query: Record<string, unknown>,
  state: DatabaseState,
  reqOrigin?: string
): SeoResolutionResult {
  const baseUrl = getBaseUrl(reqOrigin);
  const cleanPath = (reqPath.split('?')[0] || '/').replace(/\/+$/, '') || '/';
  const orgLd = buildOrgAndWebsiteJsonLd(baseUrl);
  const defaultImg = `${baseUrl}/assets/hero/hawa-hero-1280.webp`;

  // Static private / transactional routes -> noindex, nofollow
  const privateRoutes = ['/admin', '/account', '/checkout', '/wishlist'];
  if (privateRoutes.some((r) => cleanPath === r || cleanPath.startsWith(`${r}/`))) {
    const labelMap: Record<string, string> = {
      '/admin': 'Admin Console — Rangrez Haveli',
      '/account': 'Patron Account & Mohar Rewards — Rangrez Haveli',
      '/checkout': 'Secure Checkout — Rangrez Haveli',
      '/wishlist': 'Pasand Wishlist — Rangrez Haveli',
    };
    const title = labelMap[cleanPath] || 'Rangrez Haveli';
    return {
      status: 200,
      title,
      description: 'Rangrez Haveli patron account, wishlist, checkout, and management workspace.',
      canonicalUrl: `${baseUrl}${cleanPath}`,
      robots: 'noindex, nofollow',
      ogType: 'website',
      ogImage: defaultImg,
      jsonLd: orgLd,
      criticalHtmlSnapshot: `<h1>${escapeHtml(title)}</h1>`,
    };
  }

  // Product detail route: /product/:slug
  if (cleanPath.startsWith('/product/')) {
    const slug = decodeURIComponent(cleanPath.slice('/product/'.length));
    const publicProducts = getPublicProducts(state);
    const product: Product | undefined = publicProducts.find(
      (p) => p.slug === slug || p.id === slug
    );

    if (!product) {
      return {
        status: 404,
        title: 'Craft Piece Not Found — Rangrez Haveli',
        description: 'This handcrafted piece could not be located in the Rangrez Haveli archive.',
        canonicalUrl: `${baseUrl}${cleanPath}`,
        robots: 'noindex, nofollow',
        ogType: 'website',
        ogImage: defaultImg,
        jsonLd: orgLd,
        criticalHtmlSnapshot:
          '<h1>Craft Piece Not Found</h1><p>This listing is unavailable or archived.</p>',
      };
    }

    const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
    // CRITICAL RULE: Emit AggregateRating & Review JSON-LD ONLY when product has REAL (non-mock) approved reviews
    const realApprovedReviews = getPublicReviews(state, product.id).filter(
      (r) => !r.isMock && (r.moderationStatus ?? 'approved') === 'approved'
    );

    const productLd: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      sku: product.sku,
      image: product.images.map((img) => (img.startsWith('http') ? img : `${baseUrl}${img}`)),
      description: product.shortDescription,
      brand: {
        '@type': 'Brand',
        name: 'Rangrez Haveli',
      },
      offers: {
        '@type': 'Offer',
        priceCurrency: 'INR',
        price: product.price,
        availability:
          totalStock > 0
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock',
        url: `${baseUrl}/product/${product.slug}`,
      },
    };

    if (realApprovedReviews.length > 0) {
      const avg = Number(
        (
          realApprovedReviews.reduce((acc, r) => acc + r.rating, 0) /
          realApprovedReviews.length
        ).toFixed(1)
      );
      productLd.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: avg,
        reviewCount: realApprovedReviews.length,
      };
      productLd.review = realApprovedReviews.slice(0, 5).map((r) => ({
        '@type': 'Review',
        author: { '@type': 'Person', name: r.author },
        datePublished: r.createdAt,
        reviewBody: r.comment,
        reviewRating: {
          '@type': 'Rating',
          ratingValue: r.rating,
          bestRating: 5,
          worstRating: 1,
        },
      }));
    }

    const breadcrumbLd = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${baseUrl}/` },
        { '@type': 'ListItem', position: 2, name: 'Shop', item: `${baseUrl}/shop` },
        {
          '@type': 'ListItem',
          position: 3,
          name: product.name,
          item: `${baseUrl}/product/${product.slug}`,
        },
      ],
    };

    const imgUrl = product.images[0]?.startsWith('http')
      ? product.images[0]
      : `${baseUrl}${product.images[0] || '/assets/hero/hawa-hero-1280.webp'}`;

    return {
      status: 200,
      title: `${product.name} | ${product.craftType} — Rangrez Haveli`,
      description: product.shortDescription,
      canonicalUrl: `${baseUrl}/product/${product.slug}`,
      robots: product.isMock && isProductionEnv() ? 'noindex, nofollow' : 'index, follow',
      ogType: 'product',
      ogImage: imgUrl,
      jsonLd: [...orgLd, productLd, breadcrumbLd],
      criticalHtmlSnapshot: `<article><h1>${escapeHtml(product.name)}</h1><p>Price: ₹${product.price.toLocaleString('en-IN')} (GST inclusive)</p><p>${escapeHtml(product.shortDescription)}</p></article>`,
    };
  }

  // Blog article route: /blog/:slug
  if (cleanPath.startsWith('/blog/')) {
    const slug = decodeURIComponent(cleanPath.slice('/blog/'.length));
    const posts = getPublicBlogPosts(state);
    const post: BlogPost | undefined = posts.find((b) => b.slug === slug);
    if (!post) {
      return {
        status: 404,
        title: 'Heritage Journal Story Not Found — Rangrez Haveli',
        description: 'The requested journal article was not found.',
        canonicalUrl: `${baseUrl}${cleanPath}`,
        robots: 'noindex, nofollow',
        ogType: 'article',
        ogImage: defaultImg,
        jsonLd: orgLd,
        criticalHtmlSnapshot: '<h1>Article Not Found</h1>',
      };
    }
    const articleLd = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.title,
      description: post.excerpt,
      author: { '@type': 'Person', name: post.author },
      datePublished: post.publishedAt,
      image: post.coverImage.startsWith('http') ? post.coverImage : `${baseUrl}${post.coverImage}`,
      publisher: { '@type': 'Organization', name: 'Rangrez Haveli' },
    };
    return {
      status: 200,
      title: `${post.title} — Rangrez Haveli Journal`,
      description: post.excerpt,
      canonicalUrl: `${baseUrl}/blog/${post.slug}`,
      robots: 'index, follow',
      ogType: 'article',
      ogImage: post.coverImage.startsWith('http') ? post.coverImage : `${baseUrl}${post.coverImage}`,
      jsonLd: [...orgLd, articleLd],
      criticalHtmlSnapshot: `<article><h1>${escapeHtml(post.title)}</h1><p>${escapeHtml(post.excerpt)}</p></article>`,
    };
  }

  // Shop catalog & filtered query combinations
  if (cleanPath === '/shop') {
    const categorySlug = typeof query.category === 'string' ? query.category : '';
    const categoryInfo = state.categories.find((c) => c.slug === categorySlug);
    const filterKeys = Object.keys(query).filter(
      (k) => query[k] !== '' && query[k] !== undefined && k !== 'category' && k !== 'sort'
    );
    const hasFilterCombos = filterKeys.length > 0 || Boolean(query.sort);
    const canonical = categoryInfo ? `${baseUrl}/shop?category=${encodeURIComponent(categoryInfo.slug)}` : `${baseUrl}/shop`;
    const robots = hasFilterCombos ? 'noindex, follow' : 'index, follow';

    const title = categoryInfo
      ? `${categoryInfo.name} — Handcrafted Rajasthan | Rangrez Haveli`
      : 'Shop All Handcrafted Rajasthani Creations — Rangrez Haveli';
    const description = categoryInfo
      ? `${categoryInfo.tagline}. Shop verified Rajasthani ${categoryInfo.name.toLowerCase()} with transparent artisan provenance.`
      : 'Browse handcrafted Rajasthani sarees, razai quilts, Jaipur Blue Pottery, Meenakari & Thewa jewellery, mojari footwear, and festive hampers.';

    return {
      status: 200,
      title,
      description,
      canonicalUrl: canonical,
      robots,
      ogType: 'website',
      ogImage: defaultImg,
      jsonLd: orgLd,
      criticalHtmlSnapshot: `<section><h1>${escapeHtml(categoryInfo ? categoryInfo.name : 'Shop Rajasthani Handicrafts')}</h1><p>${escapeHtml(description)}</p></section>`,
    };
  }

  const staticMeta: Record<string, { title: string; description: string }> = {
    '/': {
      title: 'Rangrez Haveli — Rajasthan, crafted by hand',
      description:
        'Explore Hawa Mahal & shop authentic Rajasthani block-printed textiles, Jaipur Blue Pottery, Meenakari & Thewa jewellery, mojari, and B2B orders.',
    },
    '/b2b': {
      title: 'B2B Partner & Hospitality Curation — Rangrez Haveli',
      description:
        'B2B onboarding, GSTIN verification, tiered MOQ pricing upon approval, custom hotel & gifting RFQs, and export documentation for Indian handicrafts.',
    },
    '/blog': {
      title: 'Heritage Craft Journal — Rangrez Haveli',
      description:
        'Field dispatches, block-carving histories, festival style guides, and natural dye care rituals from Rajasthan.',
    },
    '/about': {
      title: 'About Our Haveli & Artisan Cooperatives — Rangrez Haveli',
      description:
        'Meet our partner artisan cooperatives across 7 craft regions of Rajasthan and learn our transparent pricing ledger.',
    },
    '/track-order': {
      title: 'Track Your Order — Rangrez Haveli',
      description: 'Check dispatch progress and GST invoice summary for your Rangrez Haveli order.',
    },
    '/privacy': {
      title: 'Privacy Policy & DPDP Rights — Rangrez Haveli',
      description: 'How Rangrez Haveli protects personal data, consent choices, and patron deletion/export rights.',
    },
    '/terms': {
      title: 'Terms of Sale — Rangrez Haveli',
      description: 'Terms and conditions governing D2C and B2B orders on Rangrez Haveli.',
    },
    '/shipping': {
      title: 'Shipping & Dispatch Policy — Rangrez Haveli',
      description: 'Pan-India courier dispatch rules, fragile pottery crating, and export lead times.',
    },
    '/returns': {
      title: 'Returns & Exchange Policy — Rangrez Haveli',
      description: '14-day return and damaged-in-transit replacement guidelines for handcrafted pieces.',
    },
    '/cancellation': {
      title: 'Order Cancellation & Refund Policy — Rangrez Haveli',
      description: 'Cancellation windows prior to artisan dispatch and refund timelines.',
    },
    '/contact': {
      title: 'Contact & Grievance Redressal — Rangrez Haveli',
      description: 'Reach Rangrez Haveli patron care, trade support, or the designated Grievance Officer.',
    },
    '/faq': {
      title: 'Frequently Asked Questions — Rangrez Haveli',
      description: 'Answers about handcrafted care, Mohar loyalty points, GST invoices, COD, and B2B.',
    },
    '/fair-design': {
      title: 'Fair Design & Transparency Disclosure — Rangrez Haveli',
      description: 'Our anti-dark-pattern pledge, verified claims registry policy, and honest review rules.',
    },
  };

  if (staticMeta[cleanPath]) {
    const m = staticMeta[cleanPath];
    return {
      status: 200,
      title: m.title,
      description: m.description,
      canonicalUrl: `${baseUrl}${cleanPath === '/' ? '' : cleanPath}`,
      robots: 'index, follow',
      ogType: 'website',
      ogImage: defaultImg,
      jsonLd: orgLd,
      criticalHtmlSnapshot: `<section><h1>${escapeHtml(m.title)}</h1><p>${escapeHtml(m.description)}</p></section>`,
    };
  }

  return {
    status: 404,
    title: 'Page Not Found — Rangrez Haveli',
    description: 'The requested page could not be found on Rangrez Haveli.',
    canonicalUrl: `${baseUrl}${cleanPath}`,
    robots: 'noindex, nofollow',
    ogType: 'website',
    ogImage: defaultImg,
    jsonLd: orgLd,
    criticalHtmlSnapshot: '<h1>404 — Courtyard Not Found</h1>',
  };
}

export function injectSeoIntoHtml(rawHtml: string, seo: SeoResolutionResult): string {
  const jsonLdScript = seo.jsonLd
    .map((obj) => `<script type="application/ld+json">${JSON.stringify(obj)}</script>`)
    .join('\n    ');

  const metaBlock = `
    <title>${escapeHtml(seo.title)}</title>
    <meta name="description" content="${escapeHtml(seo.description)}" />
    <meta name="robots" content="${escapeHtml(seo.robots)}" />
    <link rel="canonical" href="${escapeHtml(seo.canonicalUrl)}" />
    <meta property="og:title" content="${escapeHtml(seo.title)}" />
    <meta property="og:description" content="${escapeHtml(seo.description)}" />
    <meta property="og:type" content="${escapeHtml(seo.ogType)}" />
    <meta property="og:url" content="${escapeHtml(seo.canonicalUrl)}" />
    <meta property="og:image" content="${escapeHtml(seo.ogImage)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(seo.title)}" />
    <meta name="twitter:description" content="${escapeHtml(seo.description)}" />
    ${jsonLdScript}`;

  let html = rawHtml
    .replace(/<title>[\s\S]*?<\/title>/i, '')
    .replace(/<meta\s+name="description"[\s\S]*?\/>/gi, '')
    .replace(/<meta\s+property="og:[^"]+"[\s\S]*?\/>/gi, '')
    .replace(/<meta\s+name="twitter:[^"]+"[\s\S]*?\/>/gi, '')
    .replace('</head>', `${metaBlock}\n  </head>`);

  html = html.replace(
    '<div id="root"></div>',
    `<div id="ssr-seo-snapshot" class="sr-only">${seo.criticalHtmlSnapshot}</div>\n    <div id="root"></div>`
  );
  return html;
}

export function buildSitemapXml(state: DatabaseState, reqOrigin?: string): string {
  const baseUrl = getBaseUrl(reqOrigin);
  const products = getPublicProducts(state);
  const posts = getPublicBlogPosts(state);

  const staticPaths = [
    '/',
    '/shop',
    '/b2b',
    '/blog',
    '/about',
    '/faq',
    '/contact',
    '/privacy',
    '/terms',
    '/shipping',
    '/returns',
    '/cancellation',
    '/fair-design',
  ];

  const urls: string[] = [];
  for (const p of staticPaths) {
    urls.push(`  <url><loc>${escapeHtml(`${baseUrl}${p === '/' ? '' : p}`)}</loc><changefreq>weekly</changefreq></url>`);
  }
  for (const cat of state.categories) {
    urls.push(
      `  <url><loc>${escapeHtml(`${baseUrl}/shop?category=${cat.slug}`)}</loc><changefreq>weekly</changefreq></url>`
    );
  }
  for (const prod of products) {
    urls.push(
      `  <url><loc>${escapeHtml(`${baseUrl}/product/${prod.slug}`)}</loc><changefreq>daily</changefreq></url>`
    );
  }
  for (const post of posts) {
    urls.push(
      `  <url><loc>${escapeHtml(`${baseUrl}/blog/${post.slug}`)}</loc><lastmod>${escapeHtml(post.publishedAt)}</lastmod></url>`
    );
  }

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
}

export function buildRobotsTxt(reqOrigin?: string): string {
  const baseUrl = getBaseUrl(reqOrigin);
  return `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /account\nDisallow: /checkout\nDisallow: /wishlist\nDisallow: /api/\n\nSitemap: ${baseUrl}/sitemap.xml\n`;
}
