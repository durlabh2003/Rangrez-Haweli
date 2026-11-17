import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { ArrowUpRight, TrendingUp } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export interface ImpactPoint {
  period: string;
  artisans: number;
  cooperatives: number;
  directPayoutLakhs: number;
  incomeLiftPct: number;
  milestone: string;
}

const ANNUAL_IMPACT: ImpactPoint[] = [
  {
    period: '2020',
    artisans: 48,
    cooperatives: 2,
    directPayoutLakhs: 18.4,
    incomeLiftPct: 24,
    milestone: 'Founding block-printing collectives in Sanganer & Bagru',
  },
  {
    period: '2021',
    artisans: 96,
    cooperatives: 4,
    directPayoutLakhs: 42.8,
    incomeLiftPct: 33,
    milestone: 'Added Jaipur Blue Pottery kilns & solar water recycling',
  },
  {
    period: '2022',
    artisans: 164,
    cooperatives: 6,
    directPayoutLakhs: 86.5,
    incomeLiftPct: 44,
    milestone: 'Launched Pratapgarh Thewa goldsmith partnership',
  },
  {
    period: '2023',
    artisans: 238,
    cooperatives: 8,
    directPayoutLakhs: 132.0,
    incomeLiftPct: 52,
    milestone: 'Onboarded Shahpura Phad painters & Jodhpuri Mojari makers',
  },
  {
    period: '2024',
    artisans: 312,
    cooperatives: 10,
    directPayoutLakhs: 174.6,
    incomeLiftPct: 60,
    milestone: 'Opened B2B hospitality channel with 52% direct maker share',
  },
  {
    period: '2025',
    artisans: 382,
    cooperatives: 11,
    directPayoutLakhs: 218.5,
    incomeLiftPct: 65,
    milestone: 'Expanded Kot Jewar dhurrie & Sikar Bandhani women weavers',
  },
  {
    period: '2026',
    artisans: 428,
    cooperatives: 12,
    directPayoutLakhs: 264.2,
    incomeLiftPct: 71,
    milestone: '428 active artisans across 12 Rajasthani craft cooperatives',
  },
];

const QUARTERLY_IMPACT: ImpactPoint[] = [
  {
    period: "Q1 '24",
    artisans: 256,
    cooperatives: 9,
    directPayoutLakhs: 36.2,
    incomeLiftPct: 55,
    milestone: 'Spring textile collection & natural indigo vat expansion',
  },
  {
    period: "Q2 '24",
    artisans: 274,
    cooperatives: 9,
    directPayoutLakhs: 39.8,
    incomeLiftPct: 57,
    milestone: 'Jaipur hospitality linen contracts fulfilled by Bagru guilds',
  },
  {
    period: "Q3 '24",
    artisans: 292,
    cooperatives: 10,
    directPayoutLakhs: 46.1,
    incomeLiftPct: 59,
    milestone: 'Festive Diwali advance working-capital disbursed interest-free',
  },
  {
    period: "Q4 '24",
    artisans: 312,
    cooperatives: 10,
    directPayoutLakhs: 52.5,
    incomeLiftPct: 60,
    milestone: 'Record Tyohaar season gifting payouts across 10 guilds',
  },
  {
    period: "Q1 '25",
    artisans: 334,
    cooperatives: 11,
    directPayoutLakhs: 48.4,
    incomeLiftPct: 62,
    milestone: 'Kot Jewar Punja dhurrie women weavers joined Haveli charter',
  },
  {
    period: "Q2 '25",
    artisans: 350,
    cooperatives: 11,
    directPayoutLakhs: 51.2,
    incomeLiftPct: 63,
    milestone: 'Solar-assisted Blue Pottery firing reduced wood fuel by 45%',
  },
  {
    period: "Q3 '25",
    artisans: 368,
    cooperatives: 11,
    directPayoutLakhs: 56.8,
    incomeLiftPct: 64,
    milestone: 'Export HS-code fulfillment scaled to 14 countries',
  },
  {
    period: "Q4 '25",
    artisans: 382,
    cooperatives: 11,
    directPayoutLakhs: 62.1,
    incomeLiftPct: 65,
    milestone: 'Full year 2025 closed at ₹218.5L direct guild payouts',
  },
  {
    period: "Q1 '26",
    artisans: 398,
    cooperatives: 12,
    directPayoutLakhs: 61.5,
    incomeLiftPct: 68,
    milestone: '12th cooperative onboarded in Shekhawati Bandhani cluster',
  },
  {
    period: "Q2 '26",
    artisans: 412,
    cooperatives: 12,
    directPayoutLakhs: 64.9,
    incomeLiftPct: 70,
    milestone: 'Apprenticeship stipends funded for 34 young block carvers',
  },
  {
    period: "Q3 '26",
    artisans: 420,
    cooperatives: 12,
    directPayoutLakhs: 67.4,
    incomeLiftPct: 70,
    milestone: 'Surpassed 420 active makers with zero middlemen markups',
  },
  {
    period: "Q4 '26",
    artisans: 428,
    cooperatives: 12,
    directPayoutLakhs: 70.4,
    incomeLiftPct: 71,
    milestone: 'Highest quarterly craft disbursement at ₹70.4L direct share',
  },
];

interface GuildCluster {
  cluster: string;
  region: string;
  artisans: number;
  sharePct: number;
  craftFilter: string;
}

const GUILD_CLUSTERS: GuildCluster[] = [
  { cluster: 'Sanganeri & Bagru Printing', region: 'Jaipur Rural', artisans: 146, sharePct: 34, craftFilter: 'Sanganeri' },
  { cluster: 'Jaipur Blue Pottery', region: 'Kot Jewar & Jaipur', artisans: 84, sharePct: 20, craftFilter: 'Blue Pottery' },
  { cluster: 'Jodhpuri Mojari & Leather', region: 'Jodhpur & Bikaner', artisans: 72, sharePct: 17, craftFilter: 'Mojari' },
  { cluster: 'Pratapgarh Thewa & Meenakari', region: 'Pratapgarh & Jaipur', artisans: 54, sharePct: 13, craftFilter: 'Thewa' },
  { cluster: 'Shahpura Phad & Woodcraft', region: 'Bhilwara', artisans: 42, sharePct: 10, craftFilter: 'Phad' },
  { cluster: 'Sikar Bandhani & Leheriya', region: 'Shekhawati', artisans: 30, sharePct: 6, craftFilter: 'Bandhani' },
];

type CadenceMode = 'annual' | 'quarterly';
type MetricFocus = 'artisans' | 'payouts';

export function ArtisanImpactSection() {
  const { navigate, reduceMotion } = useStore();
  const [cadence, setCadence] = useState<CadenceMode>('annual');
  const [metric, setMetric] = useState<MetricFocus>('artisans');
  const [selectedIdx, setSelectedIdx] = useState<number>(ANNUAL_IMPACT.length - 1);
  const [chartWidth, setChartWidth] = useState<number>(760);

  const containerRef = useRef<HTMLDivElement | null>(null);

  const series = cadence === 'annual' ? ANNUAL_IMPACT : QUARTERLY_IMPACT;

  useEffect(() => {
    setSelectedIdx(series.length - 1);
  }, [cadence, series.length]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const updateWidth = () => {
      const next = Math.max(300, Math.floor(el.clientWidth));
      setChartWidth(next);
    };
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const chartHeight = 300;
  const margin = { top: 24, right: 24, bottom: 38, left: 52 };
  const innerWidth = Math.max(200, chartWidth - margin.left - margin.right);
  const innerHeight = chartHeight - margin.top - margin.bottom;

  const {
    yScale,
    yTicks,
    areaPath,
    linePath,
    points,
  } = useMemo(() => {
    const periods = series.map((d) => d.period);
    const xs = d3.scalePoint<string>().domain(periods).range([0, innerWidth]).padding(0.25);

    const maxVal =
      metric === 'artisans'
        ? (d3.max(series, (d) => d.artisans) ?? 450) * 1.12
        : (d3.max(series, (d) => d.directPayoutLakhs) ?? 280) * 1.14;

    const ys = d3.scaleLinear().domain([0, maxVal]).nice().range([innerHeight, 0]);

    const getValue = (d: ImpactPoint) =>
      metric === 'artisans' ? d.artisans : d.directPayoutLakhs;

    const areaGen = d3
      .area<ImpactPoint>()
      .x((d) => xs(d.period) ?? 0)
      .y0(innerHeight)
      .y1((d) => ys(getValue(d)))
      .curve(d3.curveMonotoneX);

    const lineGen = d3
      .line<ImpactPoint>()
      .x((d) => xs(d.period) ?? 0)
      .y((d) => ys(getValue(d)))
      .curve(d3.curveMonotoneX);

    const pts = series.map((d, idx) => ({
      idx,
      data: d,
      cx: xs(d.period) ?? 0,
      cy: ys(getValue(d)),
    }));

    return {
      yScale: ys,
      yTicks: ys.ticks(5),
      areaPath: areaGen(series) ?? '',
      linePath: lineGen(series) ?? '',
      points: pts,
    };
  }, [series, metric, innerWidth, innerHeight]);

  const activePoint = series[Math.min(selectedIdx, series.length - 1)] ?? series[series.length - 1];
  const activeCoords = points[Math.min(selectedIdx, points.length - 1)] ?? points[points.length - 1];

  // Pointer scrubbing via D3 scale coordinates
  const handleSvgPointer = (clientX: number, svgEl: SVGSVGElement) => {
    const rect = svgEl.getBoundingClientRect();
    const localX = clientX - rect.left - margin.left;
    let closest = 0;
    let minDist = Infinity;
    for (let i = 0; i < points.length; i++) {
      const dist = Math.abs(points[i].cx - localX);
      if (dist < minDist) {
        minDist = dist;
        closest = i;
      }
    }
    setSelectedIdx(closest);
  };

  // Horizontal cluster scale computed with D3
  const clusterMax = d3.max(GUILD_CLUSTERS, (c) => c.artisans) ?? 150;
  const clusterWidthScale = useMemo(
    () => d3.scaleLinear().domain([0, clusterMax]).range([0, 100]),
    [clusterMax]
  );

  const primaryStroke = metric === 'artisans' ? 'var(--rh-primary)' : 'var(--rh-peacock)';

  return (
    <section
      aria-labelledby="artisan-impact-heading"
      className="bg-[var(--rh-surface)] border border-[var(--rh-border)] rounded-2xl p-6 sm:p-8 space-y-8"
    >
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
        <div className="space-y-1.5 max-w-2xl">
          <p className="text-xs font-semibold text-[var(--rh-peacock)] inline-flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Community Growth &amp; Economic Impact · 2020–2026</span>
          </p>
          <h2 id="artisan-impact-heading" className="font-display text-2xl sm:text-3xl font-bold text-balance">
            Artisan Livelihoods Grown Without Middlemen
          </h2>
          <p className="text-sm text-[var(--rh-ink-muted)] leading-relaxed">
            Our cooperative model targets a typical 52% pre-discount unit share for village maker guilds. Inspect the
            illustrative sample guild disbursement ledger from 2020 to 2026 (full calculation methodology available in Fair Design charter).
          </p>
        </div>

        {/* Functional Segmented Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div
            role="group"
            aria-label="Metric series"
            className="inline-flex p-1 rounded-lg bg-[var(--rh-surface-muted)] border border-[var(--rh-border)]"
          >
            <button
              type="button"
              onClick={() => setMetric('artisans')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                metric === 'artisans'
                  ? 'bg-[var(--rh-surface)] text-[var(--rh-ink)] shadow-xs'
                  : 'text-[var(--rh-ink-muted)] hover:text-[var(--rh-ink)]'
              }`}
            >
              Artisans Supported
            </button>
            <button
              type="button"
              onClick={() => setMetric('payouts')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                metric === 'payouts'
                  ? 'bg-[var(--rh-surface)] text-[var(--rh-ink)] shadow-xs'
                  : 'text-[var(--rh-ink-muted)] hover:text-[var(--rh-ink)]'
              }`}
            >
              Direct Payouts (₹ Lakhs)
            </button>
          </div>

          <div
            role="group"
            aria-label="Timeframe granularity"
            className="inline-flex p-1 rounded-lg bg-[var(--rh-surface-muted)] border border-[var(--rh-border)]"
          >
            <button
              type="button"
              onClick={() => setCadence('annual')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                cadence === 'annual'
                  ? 'bg-[var(--rh-surface)] text-[var(--rh-ink)] shadow-xs'
                  : 'text-[var(--rh-ink-muted)] hover:text-[var(--rh-ink)]'
              }`}
            >
              Annual
            </button>
            <button
              type="button"
              onClick={() => setCadence('quarterly')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                cadence === 'quarterly'
                  ? 'bg-[var(--rh-surface)] text-[var(--rh-ink)] shadow-xs'
                  : 'text-[var(--rh-ink-muted)] hover:text-[var(--rh-ink)]'
              }`}
            >
              Quarterly
            </button>
          </div>
        </div>
      </div>

      {/* 4-Column Tabular Readout Strip Bound to Selected Timeline Point */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 py-4 border-y border-[var(--rh-border)]">
        <div>
          <p className="text-xs text-[var(--rh-ink-muted)]">Selected Period</p>
          <p className="font-mono-num text-xl sm:text-2xl font-bold mt-0.5">{activePoint.period}</p>
        </div>
        <div>
          <p className="text-xs text-[var(--rh-ink-muted)]">Artisans Supported</p>
          <p className="font-mono-num text-xl sm:text-2xl font-bold text-[var(--rh-primary)] mt-0.5">
            {activePoint.artisans.toLocaleString('en-IN')} makers
          </p>
        </div>
        <div>
          <p className="text-xs text-[var(--rh-ink-muted)]">
            {cadence === 'annual' ? 'Annual Guild Payouts' : 'Quarterly Guild Payouts'}
          </p>
          <p className="font-mono-num text-xl sm:text-2xl font-bold text-[var(--rh-peacock)] mt-0.5">
            ₹{activePoint.directPayoutLakhs.toFixed(1)} Lakhs
          </p>
        </div>
        <div>
          <p className="text-xs text-[var(--rh-ink-muted)]">Guilds &amp; Household Income Lift</p>
          <p className="font-mono-num text-xl sm:text-2xl font-bold mt-0.5">
            {activePoint.cooperatives} guilds · +{activePoint.incomeLiftPct}%
          </p>
        </div>
      </div>

      {/* Main Split: D3 Time-Series Area/Line Chart (Left) + D3 Craft Cluster Breakdown (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-3">
          <div ref={containerRef} className="w-full overflow-hidden">
            <svg
              width={chartWidth}
              height={chartHeight}
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              role="img"
              aria-label={`D3 chart showing ${metric === 'artisans' ? 'number of artisans supported' : 'direct guild payouts'} from ${series[0].period} to ${series[series.length - 1].period}`}
              className="block w-full select-none cursor-crosshair"
              onMouseMove={(e) => handleSvgPointer(e.clientX, e.currentTarget)}
              onClick={(e) => handleSvgPointer(e.clientX, e.currentTarget)}
            >
              <defs>
                <linearGradient id="rh-impact-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={primaryStroke} stopOpacity="0.26" />
                  <stop offset="100%" stopColor={primaryStroke} stopOpacity="0.02" />
                </linearGradient>
              </defs>

              <g transform={`translate(${margin.left},${margin.top})`}>
                {/* Horizontal Y Gridlines & Labels */}
                {yTicks.map((tickVal) => {
                  const yPos = yScale(tickVal);
                  return (
                    <g key={tickVal} transform={`translate(0,${yPos})`}>
                      <line
                        x1={0}
                        x2={innerWidth}
                        stroke="var(--rh-border)"
                        strokeDasharray="3 4"
                      />
                      <text
                        x={-10}
                        y={4}
                        textAnchor="end"
                        fontSize={11}
                        fill="var(--rh-ink-muted)"
                        className="font-mono-num"
                      >
                        {metric === 'artisans' ? tickVal : `₹${tickVal}L`}
                      </text>
                    </g>
                  );
                })}

                {/* D3 Smooth Area & Line */}
                <path
                  d={areaPath}
                  fill="url(#rh-impact-fill)"
                  className={reduceMotion ? '' : 'transition-opacity duration-200'}
                />
                <path
                  d={linePath}
                  fill="none"
                  stroke={primaryStroke}
                  strokeWidth={2.5}
                  strokeLinecap="round"
                />

                {/* Selected Period Hairline Guide */}
                {activeCoords && (
                  <line
                    x1={activeCoords.cx}
                    x2={activeCoords.cx}
                    y1={0}
                    y2={innerHeight}
                    stroke="var(--rh-gold)"
                    strokeWidth={1.25}
                    strokeDasharray="4 3"
                  />
                )}

                {/* X Axis Baseline & Period Labels */}
                <line
                  x1={0}
                  x2={innerWidth}
                  y1={innerHeight}
                  y2={innerHeight}
                  stroke="var(--rh-border)"
                />
                {points.map((pt, i) => {
                  const isActive = i === selectedIdx;
                  const showXLabel =
                    cadence === 'annual' ||
                    chartWidth > 540 ||
                    i % 2 === 0 ||
                    i === points.length - 1;
                  return (
                    <g key={pt.data.period}>
                      {showXLabel && (
                        <text
                          x={pt.cx}
                          y={innerHeight + 22}
                          textAnchor="middle"
                          fontSize={11}
                          fontWeight={isActive ? 700 : 500}
                          fill={isActive ? 'var(--rh-ink)' : 'var(--rh-ink-muted)'}
                          className="font-mono-num"
                        >
                          {pt.data.period}
                        </text>
                      )}
                      <circle
                        cx={pt.cx}
                        cy={pt.cy}
                        r={isActive ? 6 : 3.5}
                        fill={isActive ? primaryStroke : 'var(--rh-surface)'}
                        stroke={primaryStroke}
                        strokeWidth={isActive ? 2.5 : 2}
                        className="cursor-pointer"
                        tabIndex={0}
                        aria-label={`${pt.data.period}: ${pt.data.artisans} artisans supported, ₹${pt.data.directPayoutLakhs} Lakhs`}
                        onFocus={() => setSelectedIdx(i)}
                        onKeyDown={(e) => {
                          if (e.key === 'ArrowRight') {
                            setSelectedIdx(Math.min(points.length - 1, i + 1));
                          } else if (e.key === 'ArrowLeft') {
                            setSelectedIdx(Math.max(0, i - 1));
                          }
                        }}
                      />
                    </g>
                  );
                })}
              </g>
            </svg>
          </div>

          <p className="text-xs text-[var(--rh-ink-muted)] pt-1">
            <span className="font-semibold text-[var(--rh-ink)]">{activePoint.period} Milestone:</span>{' '}
            {activePoint.milestone}
          </p>
        </div>

        {/* Right Column: Cooperative Cluster Distribution (D3 scaled bars) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-baseline justify-between">
            <h3 className="font-display text-lg font-bold">2026 Makers by Craft Cluster</h3>
            <span className="font-mono-num text-xs text-[var(--rh-ink-muted)]">428 total</span>
          </div>

          <div className="space-y-3.5">
            {GUILD_CLUSTERS.map((row) => {
              const barPct = clusterWidthScale(row.artisans);
              return (
                <button
                  key={row.cluster}
                  type="button"
                  onClick={() => navigate({ page: 'shop', craft: row.craftFilter })}
                  className="w-full text-left group cursor-pointer space-y-1.5"
                >
                  <div className="flex items-baseline justify-between gap-2 text-xs">
                    <span className="font-semibold text-[var(--rh-ink)] group-hover:text-[var(--rh-primary)] transition-colors inline-flex items-center gap-1 truncate">
                      <span className="truncate">{row.cluster}</span>
                      <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" aria-hidden="true" />
                    </span>
                    <span className="font-mono-num text-[var(--rh-ink-muted)] shrink-0">
                      {row.artisans} ({row.sharePct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-[var(--rh-surface-muted)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--rh-primary)] group-hover:bg-[var(--rh-peacock)] transition-colors"
                      style={{ width: `${barPct}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-[var(--rh-ink-muted)]">{row.region}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
