import React, { useState } from 'react';
import { AlertTriangle, BookOpen, ExternalLink, Flag, Globe, Search, ShieldCheck } from 'lucide-react';
import { CURATED_GI_FACTS } from '../config/heritageConstants';
import { useStore } from '../context/StoreContext';
import { BandhaniSpinner } from './RajasthaniMotifs';

interface SearchSource {
  title: string;
  uri: string;
}

interface HeritageSearchResponse {
  answer: string;
  sources: SearchSource[];
  searchQueries: string[];
  fallbackUsed?: boolean;
}

const DEFAULT_PROMPTS = [
  'Why is Jaipur Blue Pottery fired without traditional clay?',
  'Difference between Sanganeri and Bagru Dabu hand-block printing',
  'How is Pratapgarh Thewa crafted onto coloured Belgian glass?',
  'Cotton & silk care for handloom Kota Doria sarees',
];

function extractDomain(uri: string): string {
  try {
    return new URL(uri).hostname.replace(/^www\./, '');
  } catch {
    return 'web source';
  }
}

export function HeritageSearchPanel({
  craftContext,
  title = 'Verified Craft & GI Provenance Desk',
  subtitle = 'Start with our reviewed regional GI & craft registry table below, or query live web sources for care rituals and historical background.',
  suggestedQueries = DEFAULT_PROMPTS,
}: {
  craftContext?: string;
  title?: string;
  subtitle?: string;
  suggestedQueries?: string[];
}) {
  const { claimsRegistry, showToast } = useStore();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<HeritageSearchResponse | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportNote, setReportNote] = useState('');
  const [reportSending, setReportSending] = useState(false);

  const runSearch = async (textToSearch: string) => {
    const clean = textToSearch.trim();
    if (!clean) return;
    setLoading(true);
    setError(null);
    setReportOpen(false);
    try {
      const res = await fetch('/api/heritage-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: clean, context: craftContext }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || 'Could not complete heritage lookup.');
        setLoading(false);
        return;
      }
      setResult({
        answer: data.answer || '',
        sources: Array.isArray(data.sources) ? data.sources : [],
        searchQueries: Array.isArray(data.searchQueries) ? data.searchQueries : [],
        fallbackUsed: Boolean(data.fallbackUsed),
      });
    } catch {
      setError('Network error while reaching the heritage archive.');
    } finally {
      setLoading(false);
    }
  };

  const submitMistakeReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!result || reportNote.trim().length < 5) return;
    setReportSending(true);
    try {
      const resp = await fetch('/api/heritage-report-mistake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query || 'Curated query',
          answerExcerpt: result.answer.slice(0, 480),
          note: reportNote.trim(),
        }),
      });
      if (resp.ok) {
        showToast('Reported! Our craft archivist will review this citation.');
        setReportNote('');
        setReportOpen(false);
      }
    } finally {
      setReportSending(false);
    }
  };

  return (
    <section className="rounded-2xl bg-[var(--rh-surface)] border border-[var(--rh-border)] p-4 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--rh-peacock)] inline-flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Curated GI Registry & Live Archive</span>
          </p>
          <h2 className="font-display text-xl sm:text-2xl font-bold mt-1">{title}</h2>
          <p className="text-xs sm:text-sm text-[var(--rh-ink-muted)] mt-1">{subtitle}</p>
        </div>
      </div>

      {/* Curated GI Facts Table Displayed First (Zero-AI Grounded Reference) */}
      <div className="overflow-x-auto rounded-xl border border-[var(--rh-border)]">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[var(--rh-surface-muted)]/70 border-b border-[var(--rh-border)] text-[var(--rh-ink)]">
              <th className="p-3 font-semibold">Craft</th>
              <th className="p-3 font-semibold">Origin Hub</th>
              <th className="p-3 font-semibold">Technique & Material Note</th>
              <th className="p-3 font-semibold">GI Registry Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--rh-border)]">
            {CURATED_GI_FACTS.map((fact) => {
              const matchedClaim = claimsRegistry.find((c) =>
                c.subject.toLowerCase().includes(fact.craft.toLowerCase().split(' ')[0])
              );
              const isVerified = Boolean(matchedClaim?.verified);
              return (
                <tr key={fact.id} className="hover:bg-[var(--rh-surface-muted)]/30">
                  <td className="p-3 font-semibold text-[var(--rh-ink)] whitespace-nowrap">{fact.craft}</td>
                  <td className="p-3 text-[var(--rh-ink-muted)] whitespace-nowrap">{fact.region}</td>
                  <td className="p-3 text-[var(--rh-ink-muted)] leading-relaxed min-w-[240px]">
                    {fact.summary}
                    <span className="block mt-1 text-[11px] text-[var(--rh-ink)]">
                      <strong>Care:</strong> {fact.careNote}
                    </span>
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    {isVerified ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#0F7B6C]/15 text-[#0F7B6C] font-semibold">
                        <ShieldCheck className="w-3 h-3" aria-hidden="true" />
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[var(--rh-surface-muted)] text-[var(--rh-ink-muted)] font-medium">
                        {fact.referenceNote}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Live Grounded Search */}
      <div className="pt-2 space-y-3">
        <p className="text-xs font-semibold text-[var(--rh-ink)]">Ask a specific craft or care question:</p>
        <div className="flex flex-wrap gap-2">
          {suggestedQueries.map((promptText) => (
            <button
              key={promptText}
              type="button"
              onClick={() => {
                setQuery(promptText);
                runSearch(promptText);
              }}
              className="min-h-[40px] px-3 py-2 text-xs font-medium rounded-lg border border-[var(--rh-border)] bg-[var(--rh-bg)] hover:border-[var(--rh-primary)] hover:text-[var(--rh-primary)] text-left transition-colors cursor-pointer"
            >
              {promptText}
            </button>
          ))}
        </div>

        <form onSubmit={(e) => { e.preventDefault(); runSearch(query); }} className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[var(--rh-ink-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              maxLength={320}
              aria-label="Ask heritage provenance or dye care question"
              placeholder="Ask about natural dye care, craft history, or artisan hubs..."
              className="w-full min-h-[44px] pl-10 pr-4 py-2.5 text-sm rounded-lg border border-[var(--rh-border)] bg-[var(--rh-bg)] text-[var(--rh-ink)]"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="min-h-[44px] px-5 py-2.5 text-sm font-semibold rounded-lg bg-[var(--rh-primary)] text-white hover:bg-[var(--rh-primary-hover)] disabled:opacity-60 transition-colors inline-flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
          >
            {loading ? <BandhaniSpinner size={16} /> : <Globe className="w-4 h-4" aria-hidden="true" />}
            <span>{loading ? 'Looking up…' : 'Search Craft Notes'}</span>
          </button>
        </form>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-[#B3123F]/40 bg-[#B3123F]/8 text-xs sm:text-sm text-[#B3123F]">
          {error}
        </div>
      )}

      {result && (
        <div className="p-5 rounded-xl bg-[var(--rh-surface-muted)]/45 border border-[var(--rh-border)] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[var(--rh-ink-muted)] border-b border-[var(--rh-border)] pb-2">
            <span className="inline-flex items-center gap-1.5 font-medium">
              <AlertTriangle className="w-3.5 h-3.5 text-[#F28C1B]" aria-hidden="true" />
              {result.fallbackUsed
                ? 'Curated archive summary (live model offline)'
                : 'AI-assisted web synthesis — verify official GI certificates against IP India registry'}
            </span>
            <button
              type="button"
              onClick={() => setReportOpen((v) => !v)}
              className="inline-flex items-center gap-1 font-semibold text-[var(--rh-primary)] hover:underline cursor-pointer"
            >
              <Flag className="w-3 h-3" aria-hidden="true" />
              Report mistake
            </button>
          </div>

          <div className="text-sm leading-relaxed text-[var(--rh-ink)] whitespace-pre-line">
            {result.answer}
          </div>

          {reportOpen && (
            <form onSubmit={submitMistakeReport} className="p-3.5 rounded-xl bg-[var(--rh-surface)] border border-[var(--rh-border)] space-y-2.5">
              <label className="text-xs font-semibold block">What should our archivist correct?</label>
              <textarea
                required
                rows={2}
                value={reportNote}
                onChange={(e) => setReportNote(e.target.value)}
                placeholder="Describe inaccurate GI status, origin village, or craft technique..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--rh-border)] bg-[var(--rh-bg)]"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={reportSending}
                  className="min-h-[36px] px-3.5 rounded-lg bg-[#B3123F] text-white text-xs font-semibold cursor-pointer"
                >
                  {reportSending ? 'Submitting…' : 'Submit Correction'}
                </button>
                <button
                  type="button"
                  onClick={() => setReportOpen(false)}
                  className="min-h-[36px] px-3 rounded-lg border border-[var(--rh-border)] text-xs cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {result.sources.length > 0 && (
            <div className="pt-3 border-t border-[var(--rh-border)] space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--rh-peacock)]">
                Sources ({result.sources.length})
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {result.sources.map((src) => (
                  <a
                    key={src.uri}
                    href={src.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-lg bg-[var(--rh-surface)] border border-[var(--rh-border)] hover:border-[var(--rh-primary)] flex items-center justify-between gap-2 text-xs transition-colors group"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-[var(--rh-ink)] group-hover:text-[var(--rh-primary)] truncate">
                        {src.title}
                      </p>
                      <p className="text-[11px] text-[var(--rh-ink-muted)] truncate">
                        {extractDomain(src.uri)}
                      </p>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-[var(--rh-ink-muted)] shrink-0" aria-hidden="true" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
