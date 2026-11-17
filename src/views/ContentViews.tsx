import React, { Suspense, lazy, useEffect, useState } from 'react';
import { ArrowRight, BookOpen, ShieldCheck } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import type { Artisan, BlogPost } from '../types';
import { CRAFT_MEDIA_ASSETS } from '../config/heritageConstants';
import { JaaliDivider, ResilientImage } from '../components/RajasthaniMotifs';

const ArtisanImpactSection = lazy(() =>
  import('../components/ArtisanImpactSection').then((m) => ({
    default: m.ArtisanImpactSection,
  }))
);

export function BlogView({ activeSlug }: { activeSlug?: string }) {
  const { navigate } = useStore();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [category, setCategory] = useState('All');

  useEffect(() => {
    fetch('/api/blog')
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && setPosts(d))
      .catch(() => {});
  }, []);

  const selected = activeSlug ? posts.find((p) => p.slug === activeSlug) : null;

  useEffect(() => {
    if (selected) {
      document.title = `${selected.title} — Rangrez Haveli Journal`;
    } else if (!activeSlug) {
      document.title = 'Rang aur Rivaaz Journal — Rangrez Haveli';
    }
  }, [selected, activeSlug]);

  if (activeSlug && posts.length > 0 && !selected) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="font-display text-3xl font-bold">Article Not Found</h1>
        <p className="text-sm text-[var(--rh-ink-muted)]">
          The journal dispatch &ldquo;{activeSlug}&rdquo; could not be located.
        </p>
        <button
          type="button"
          onClick={() => navigate({ page: 'blog' })}
          className="px-5 min-h-[42px] text-xs font-semibold rounded-lg bg-[var(--rh-primary)] text-white cursor-pointer"
        >
          View All Journal Stories
        </button>
      </div>
    );
  }

  if (selected) {
    return (
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <button
          type="button"
          onClick={() => navigate({ page: 'blog' })}
          className="text-xs font-medium text-[var(--rh-primary)] hover:underline cursor-pointer"
        >
          ← Back to Rang aur Rivaaz
        </button>
        <p className="text-xs text-[var(--rh-ink-muted)]">
          {selected.category} · {selected.readingTimeMin} min read · {selected.author}
          {selected.isMock && ' · Sample Editorial'}
        </p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-balance">{selected.title}</h1>
        <div className="aspect-[16/9] rounded-2xl overflow-hidden border border-[var(--rh-border)]">
          <ResilientImage
            src={selected.coverImage}
            alt={selected.title}
            width={960}
            height={540}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="space-y-6 text-base leading-relaxed text-[var(--rh-ink)]">
          {selected.sections.map((sec) => (
            <section key={sec.heading} className="space-y-2">
              <h2 className="font-display text-2xl font-semibold">{sec.heading}</h2>
              <p className="text-[var(--rh-ink-muted)]">{sec.body}</p>
            </section>
          ))}
        </div>
        <div className="pt-6 border-t border-[var(--rh-border)]">
          <p className="text-xs font-semibold uppercase tracking-wider mb-3">Shop Crafts Mentioned</p>
          <div className="flex flex-wrap gap-3">
            {selected.relatedSlugs.map((slug) => (
              <button
                key={slug}
                type="button"
                onClick={() => navigate({ page: 'product', slug })}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-[var(--rh-surface)] border border-[var(--rh-border)] hover:border-[var(--rh-primary)] cursor-pointer"
              >
                {slug.replace(/-/g, ' ')} →
              </button>
            ))}
          </div>
        </div>
      </article>
    );
  }

  const categories = ['All', 'Craft Stories', 'Care Guides', 'Festivals', 'Home Inspiration', 'Artisan Diaries'];
  const filtered = category === 'All' ? posts : posts.filter((p) => p.category === category);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div>
        <p className="text-xs font-medium text-[var(--rh-primary)] uppercase tracking-wider">Chai pe Charcha</p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold mt-1">Rang aur Rivaaz Journal</h1>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat)}
            className={`px-3.5 min-h-[38px] text-xs font-semibold rounded-lg whitespace-nowrap shrink-0 cursor-pointer ${
              category === cat ? 'bg-[var(--rh-primary)] text-white' : 'bg-[var(--rh-surface-muted)]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="p-8 rounded-2xl bg-[var(--rh-surface)] border border-[var(--rh-border)] text-center text-sm text-[var(--rh-ink-muted)]">
          No journal articles match this category right now.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filtered.map((p) => (
            <article
              key={p.id}
              className="bg-[var(--rh-surface)] border border-[var(--rh-border)] rounded-xl overflow-hidden flex flex-col"
            >
              <div className="aspect-[16/10] overflow-hidden">
                <ResilientImage
                  src={p.coverImage}
                  alt={p.title}
                  width={640}
                  height={400}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                <div>
                  <p className="text-xs text-[var(--rh-ink-muted)]">
                    {p.category} · {p.readingTimeMin} min read
                    {p.isMock && ' · Sample'}
                  </p>
                  <h2 className="font-display text-xl font-bold mt-1.5">
                    <button
                      type="button"
                      onClick={() => navigate({ page: 'blog', slug: p.slug })}
                      className="text-left hover:text-[var(--rh-primary)] cursor-pointer"
                    >
                      {p.title}
                    </button>
                  </h2>
                  <p className="text-xs text-[var(--rh-ink-muted)] mt-2">{p.excerpt}</p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate({ page: 'blog', slug: p.slug })}
                  className="text-xs font-semibold text-[var(--rh-primary)] inline-flex items-center gap-1 cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5" /> Read Story
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}



export function AboutView() {
  const { showToast, guildMetrics, navigate, user } = useStore();
  const [artisans, setArtisans] = useState<Artisan[]>([]);
  const [studioNote, setStudioNote] = useState({ name: '', email: '', message: '' });
  const [sendingNote, setSendingNote] = useState(false);

  useEffect(() => {
    fetch('/api/artisans')
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && setArtisans(d))
      .catch(() => {});
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-12">
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-6 space-y-4">
          <p className="text-xs font-medium text-[var(--rh-primary)] uppercase tracking-wider">
            Our Haveli Charter
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-balance">
            Built with {guildMetrics.partnerGuildsCount} Rajasthani cooperatives so craft stays in the village.
          </h1>
          <p className="text-sm text-[var(--rh-ink-muted)] leading-relaxed">
            Rangrez Haveli connects independent D2C patrons and global hospitality buyers directly with family workshops
            across Sanganer, Bagru, Pratapgarh, Shahpura, Jodhpur, and Kot Jewar—structured around a typical{' '}
            {guildMetrics.typicalArtisanSharePct}% pre-discount retail share returning to maker guilds.
          </p>
          <p className="text-xs text-[var(--rh-ink-muted)] italic">{guildMetrics.methodologyNote}</p>
          <div className="grid grid-cols-3 gap-4 pt-2 font-mono-num">
            <div>
              <p className="text-2xl font-bold">{guildMetrics.partnerGuildsCount}</p>
              <p className="text-xs text-[var(--rh-ink-muted)]">Guilds</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{guildMetrics.documentedCraftRegions}</p>
              <p className="text-xs text-[var(--rh-ink-muted)]">Craft Regions</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{guildMetrics.typicalArtisanSharePct}%</p>
              <p className="text-xs text-[var(--rh-ink-muted)]">Typical Maker Share</p>
            </div>
          </div>
        </div>
        <div className="lg:col-span-6 aspect-[16/10] rounded-2xl overflow-hidden border border-[var(--rh-border)]">
          <ResilientImage
            src={CRAFT_MEDIA_ASSETS.aboutCourtyard}
            alt="Rangrez Haveli Jaipur artisan guild courtyard"
            width={960}
            height={600}
            className="w-full h-full object-cover"
          />
        </div>
      </section>

      <JaaliDivider />

      <Suspense
        fallback={
          <div className="p-8 rounded-2xl border border-[var(--rh-border)] text-center text-xs text-[var(--rh-ink-muted)]">
            Loading Artisan Impact ledger…
          </div>
        }
      >
        <ArtisanImpactSection />
      </Suspense>

      <JaaliDivider />

      <section className="space-y-4">
        <h2 className="font-display text-2xl font-bold">Meet the Makers (Phad Scroll Directory)</h2>
        {artisans.length === 0 ? (
          <p className="text-xs text-[var(--rh-ink-muted)]">Maker profiles are populated from verified guild records.</p>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
            {artisans.map((art, i) => (
              <div
                key={art.id}
                className="min-w-[280px] max-w-[300px] snap-start bg-[var(--rh-surface)] border border-[#C9A227]/40 rounded-xl overflow-hidden flex flex-col"
              >
                {art.image && (
                  <div className="aspect-[16/10] w-full overflow-hidden bg-[var(--rh-surface-muted)]">
                    <ResilientImage
                      src={art.image}
                      alt={`${art.name} — ${art.craft} atelier in ${art.village}`}
                      width={480}
                      height={300}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-5 space-y-2 flex-1">
                  <p className="text-xs font-mono-num text-[var(--rh-primary)]">
                    Panel {String(i + 1).padStart(2, '0')} · {art.village}, {art.district}
                    {art.isMock && ' · Sample'}
                  </p>
                  <h3 className="font-display text-lg font-bold">{art.name}</h3>
                  <p className="text-xs font-semibold text-[var(--rh-peacock)]">
                    {art.craft} · {art.yearsExperience} yrs experience
                  </p>
                  <p className="text-xs text-[var(--rh-ink-muted)] leading-relaxed">{art.story}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6 border-t border-[var(--rh-border)]">
        <div className="lg:col-span-6 space-y-3">
          <h2 className="font-display text-2xl font-bold">Frequently Asked Questions</h2>
          {[
            {
              q: 'Which crafts carry a GI Tag badge?',
              a: 'GI badges display strictly when backed by an IP India registry certificate reference in our Claims Registry. Otherwise crafts showcase their authentic village origin.',
            },
            {
              q: 'Do you offer Cash on Delivery & HSN GST Invoices?',
              a: 'Yes—UPI, Cards, Netbanking, and COD on eligible pincodes (serviceability and ETDs confirmed live at checkout), plus GST tax invoices with HSN codes (0%, 3%, 5%, 18%, or 40%).',
            },
            {
              q: 'How do B2B margins work?',
              a: 'Approved boutiques, hotels, and corporate buyers with Mod-36 verified GSTIN unlock 12% to 40% tiered pricing starting at MOQ 10 units.',
            },
          ].map((faq) => (
            <details key={faq.q} className="p-4 rounded-xl bg-[var(--rh-surface)] border border-[var(--rh-border)]">
              <summary className="text-sm font-semibold cursor-pointer">{faq.q}</summary>
              <p className="mt-2 text-xs text-[var(--rh-ink-muted)] leading-relaxed">{faq.a}</p>
            </details>
          ))}
          <button
            type="button"
            onClick={() => navigate({ page: 'legal', doc: 'fair-design' })}
            className="text-xs font-semibold text-[var(--rh-primary)] hover:underline cursor-pointer"
          >
            Inspect Claims Registry & Fair Design Charter →
          </button>
        </div>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setSendingNote(true);
            try {
              const res = await fetch('/api/queries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  name: studioNote.name || user?.displayName || 'Patron',
                  email: studioNote.email || user?.email,
                  category: 'Product Care',
                  subject: 'Jaipur Studio Inquiry',
                  message: studioNote.message,
                }),
              });
              if (res.ok) {
                showToast('Inquiry & ticket logged for our Jaipur Haveli concierge.');
                setStudioNote({ name: '', email: '', message: '' });
              } else {
                const err = await res.json().catch(() => ({}));
                showToast(err.error || 'Could not submit inquiry.');
              }
            } finally {
              setSendingNote(false);
            }
          }}
          className="lg:col-span-6 p-6 rounded-2xl bg-[var(--rh-surface)] border border-[var(--rh-border)] space-y-3"
        >
          <h2 className="font-display text-xl font-bold inline-flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[var(--rh-peacock)]" /> Write to Our Jaipur Studio
          </h2>
          <input
            required
            value={studioNote.name}
            onChange={(e) => setStudioNote({ ...studioNote, name: e.target.value })}
            placeholder="Your Name"
            className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--rh-border)] bg-[var(--rh-bg)]"
          />
          <input
            required
            type="email"
            value={studioNote.email}
            onChange={(e) => setStudioNote({ ...studioNote, email: e.target.value })}
            placeholder="Email Address"
            className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--rh-border)] bg-[var(--rh-bg)]"
          />
          <textarea
            required
            rows={3}
            value={studioNote.message}
            onChange={(e) => setStudioNote({ ...studioNote, message: e.target.value })}
            placeholder="Ask about custom sizing, hotel sourcing, or craft care..."
            className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--rh-border)] bg-[var(--rh-bg)]"
          />
          <button
            type="submit"
            disabled={sendingNote}
            className="px-5 py-2.5 text-sm font-semibold rounded-lg bg-[var(--rh-primary)] text-white cursor-pointer disabled:opacity-50"
          >
            {sendingNote ? 'Sending…' : 'Send Note'}
          </button>
        </form>
      </section>
    </div>
  );
}
