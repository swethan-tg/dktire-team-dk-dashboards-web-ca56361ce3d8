'use client';

import { useEffect, useMemo, useState } from 'react';
import { Bar, CartesianGrid, Cell, ComposedChart, LabelList, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { PiInfo } from 'react-icons/pi';
import cn from '@core/utils/class-names';
import { formatNumber } from '@/utils/format-number';
import { fetchSalesmanPerformance } from '@/services/salesman-performance/salesman-performance.service';
import { buildSalesmanDashboard } from '@/services/salesman-performance/salesman-performance.model';
import type { SalesmanDashboard } from '@/services/salesman-performance/salesman-performance.model';
import type { SalesmanPeriod } from '@/services/salesman-performance/salesman-performance.model';

type PeriodMode = 'wtd' | 'mtd' | 'qtd' | 'ytd';

const periodLabels: Record<PeriodMode, string> = {
  wtd: 'WTD',
  mtd: 'MTD',
  qtd: 'QTD',
  ytd: 'YTD',
};

const periodCarousel: PeriodMode[] = ['wtd', 'mtd', 'qtd', 'ytd'];

type ColorsType = {
  current: string;
  previous: string;
};

const colors: ColorsType = {
  current: '#3b82f6',   // blue
  previous: '#94a3b8', // slate
};

function LegendDot({ color, label, solid = true }: { color: string; label: string; solid?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`size-3 rounded-full ${!solid ? 'border-2' : ''}`}
        style={{
          backgroundColor: solid ? color : 'transparent',
          borderColor: solid ? color : color,
        }}
      />
      <span>{label}</span>
    </div>
  );
}

export default function SalesmanPerformanceDashboard() {
  const [period, setPeriod] = useState<PeriodMode>('wtd');
  const [siteId, setSiteId] = useState<string | null>(null);
  const [source, setSource] = useState<SalesmanDashboard['source'] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  // Detect screen size for responsive font sizing
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkScreenSize = () => {
        setIsLargeScreen(window.innerWidth >= 2000);
      };
      checkScreenSize();
      window.addEventListener('resize', checkScreenSize);
      return () => window.removeEventListener('resize', checkScreenSize);
    }
  }, []);

  // Extract site_id from query parameter on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const id = params.get('site_id');
      setSiteId(id);
    }
  }, []);

  // Auto-rotate carousel every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setPeriod((prev) => {
        const modes: PeriodMode[] = ['wtd', 'mtd', 'qtd', 'ytd'];
        const currentIndex = modes.indexOf(prev);
        const nextIndex = (currentIndex + 1) % modes.length;
        return modes[nextIndex];
      });
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Fetch data when siteId or period changes
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setError(null);
        const response = await fetchSalesmanPerformance(siteId);
        if (isMounted) {
          setSource(response);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load salesman performance data');
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [siteId]);

  const dashboard = useMemo(() => {
    if (!source) return null;
    if (period === 'wtd') {
      return {
        left: buildSalesmanDashboard(source, 'wtd'),
        right: buildSalesmanDashboard(source, 'mtd'),
        leftLabel: 'WTD',
        rightLabel: 'MTD',
      };
    } else {
      return {
        left: buildSalesmanDashboard(source, 'qtd'),
        right: buildSalesmanDashboard(source, 'ytd'),
        leftLabel: 'QTD',
        rightLabel: 'YTD',
      };
    }
  }, [source, period]);

  const filterRows = (rows: SalesmanDashboard['chartRows']) =>
    rows.filter((r) => r.salesmanName && r.salesmanName !== 'None' && r.salesmanName !== 'N/A' && r.salesmanName.trim() !== '');

  const leftRows = useMemo(() => filterRows(dashboard?.left?.chartRows ?? []), [dashboard]);
  const rightRows = useMemo(() => filterRows(dashboard?.right?.chartRows ?? []), [dashboard]);

  // Each chart uses its own scale so WTD bars are not dwarfed by MTD/QTD/YTD values
  const leftYMax = useMemo(() => {
    const vals = leftRows.flatMap(r => [r.currentSales ?? 0, r.previousSales ?? 0]);
    return Math.ceil(Math.max(...vals, 1) * 1.18);
  }, [leftRows]);

  const rightYMax = useMemo(() => {
    const vals = rightRows.flatMap(r => [r.currentSales ?? 0, r.previousSales ?? 0]);
    return Math.ceil(Math.max(...vals, 1) * 1.18);
  }, [rightRows]);

  const fs = isLargeScreen ? 13 : 10;
  const barSize = isLargeScreen ? 22 : 14;
  const barGap = 3;

  function ValueBox(props: {
    x?: number; y?: number; width?: number; index?: number;
    data: { name: string; current: number; previous: number }[];
    isWtd: boolean;
  }) {
    const { x = 0, y = 0, width = 0, index = 0, data, isWtd } = props;
    const row = data[index];
    if (!row) return null;
    const curText = formatNumber(row.current);
    const prevText = formatNumber(row.previous);
    // Min width based on text length so values always fit
    const charW = fs * 0.65;
    const textMinW = Math.max(curText.length, prevText.length) * charW + 12;
    const groupW = isWtd ? width : width * 2 + barGap;
    const rawBx = isWtd ? x : x - width / 2 - barGap / 2;
    const boxW = Math.max(groupW, textMinW);
    // Center box over group even if wider than group
    const boxX = rawBx + groupW / 2 - boxW / 2;
    const boxH = isWtd ? 18 : 32;
    const boxY = y - boxH - 4;
    const cx = boxX + boxW / 2;
    return (
      <g>
        <rect x={boxX} y={boxY} width={boxW} height={boxH} rx={3} fill="#1e293b" stroke="#475569" strokeWidth={1} />
        <text x={cx} y={boxY + 12} textAnchor="middle" fontSize={fs} fontWeight={800} fill="#60a5fa">{curText}</text>
        {!isWtd && <>
          <line x1={boxX+2} y1={boxY+16} x2={boxX+boxW-2} y2={boxY+16} stroke="#334155" strokeWidth={1}/>
          <text x={cx} y={boxY + 28} textAnchor="middle" fontSize={fs} fontWeight={700} fill="#94a3b8">{prevText}</text>
        </>}
      </g>
    );
  }

  function XTick({ x, y, payload, data, isWtd }: {
    x?: number; y?: number; payload?: { value: string };
    data: { name: string; current: number; previous: number }[];
    isWtd: boolean;
  }) {
    if (!x || !y || !payload) return null;
    const row = data.find(d => d.name === payload.value);
    const pct = !isWtd && row && row.previous !== 0 ? ((row.current - row.previous) / row.previous) * 100 : null;
    const isPos = pct !== null && pct >= 0;
    return (
      <g transform={`translate(${x},${y+4})`}>
        <text transform="rotate(-40)" textAnchor="end" fontSize={fs} fontWeight={800} fill="#e2e8f0" dy={0}>{payload.value}</text>
        {pct !== null && <text transform="rotate(-40)" textAnchor="end" fontSize={fs + 1} fontWeight={900} fill={isPos ? '#22c55e' : '#ef4444'} dy={fs + 5}>{isPos ? '↑' : '↓'} {Math.abs(pct).toFixed(0)}%</text>}
      </g>
    );
  }

  function SalesmanChart({ rows, title, isWtd, yMax }: { rows: SalesmanDashboard['chartRows']; title: string; isWtd: boolean; yMax: number }) {
    const data = rows.map(r => ({ name: r.salesmanName ?? '', current: r.currentSales ?? 0, previous: r.previousSales ?? 0 }));
    const xH = isLargeScreen ? 100 : 78;
    const topM = 36;
    return (
      <div className="flex flex-col min-h-0 flex-1">
        <h2 className="text-sm font-extrabold tracking-tight text-blue-400 sm:text-base md:text-lg xl:text-xl mb-1">{title}</h2>
        <div className="flex gap-3 mb-1 text-xs font-medium text-slate-300">
          <span className="flex items-center gap-1"><span className="inline-block w-3 h-2.5 rounded-sm bg-blue-500"></span>Current</span>
          {!isWtd && <span className="flex items-center gap-1"><span className="inline-block w-3 h-2.5 rounded-sm bg-slate-500"></span>Previous</span>}
        </div>
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: topM, right: 8, bottom: 4, left: 4 }} barCategoryGap="38%" barGap={barGap}
              className="[&_.recharts-cartesian-axis-tick-value]:fill-slate-400 [&_.recharts-surface]:overflow-visible">
              <CartesianGrid stroke="#334155" strokeDasharray="4 8" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} interval={0} height={xH}
                tick={(props) => <XTick {...props} data={data} isWtd={isWtd} />} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: fs, fill: '#94a3b8' }}
                tickFormatter={(v) => formatNumber(v)} width={50}
                domain={[0, yMax]} />
              <Bar dataKey="current" fill="#3b82f6" barSize={barSize} radius={[4,4,0,0]}>
                <LabelList dataKey="current" content={(p: any) => <ValueBox {...p} data={data} isWtd={isWtd} />} />
              </Bar>
              {!isWtd && <Bar dataKey="previous" fill="#475569" barSize={barSize} radius={[4,4,0,0]} />}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-slate-900 text-slate-100">
      <div className="flex h-full w-full flex-col">
        <header className="grid grid-cols-[1fr_auto_1fr] items-center px-0 py-1 bg-slate-800 border-b border-slate-700 shrink-0">
          <div className="px-4 py-2 text-sm font-extrabold uppercase tracking-[0.05em] text-blue-400 sm:text-base md:text-lg xl:text-xl 2xl:text-2xl">
            DK Tire {siteId && `- ${siteId}`}
          </div>
          <h1 className="text-center text-sm font-extrabold uppercase tracking-[0.05em] text-blue-400 sm:text-base md:text-lg xl:text-xl 2xl:text-2xl">
            Salesman Performance Dashboard
          </h1>
          <p className="justify-self-end inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 md:text-sm xl:text-base">
            <PiInfo className="size-4 text-blue-400" />
            <span>The dashboard data is as of till yesterday</span>
          </p>
        </header>

        {error ? (
          <div className="m-1.5 rounded-xl border border-red-900 bg-red-950 p-4 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <div className="min-h-0 flex-1 flex flex-col gap-1.5 p-1.5 overflow-hidden">
          {/* KPI Cards */}
          <div className="grid gap-2 xl:grid-cols-2 shrink-0">
            <SummaryPanel
              title="Sales Performance"
              accent="blue"
              metricKey="sales"
              dashboard={dashboard?.left ?? null}
            />
            <SummaryPanel
              title="Gross Profit Performance"
              accent="orange"
              metricKey="grossProfit"
              dashboard={dashboard?.left ?? null}
            />
          </div>

          {/* Dual Charts */}
          <section className="min-h-0 flex-1 flex flex-col rounded-xl border border-slate-700 bg-slate-800 p-3 shadow-[0_14px_40px_rgba(0,0,0,0.3)] overflow-hidden">
            <div className="grid grid-cols-1 gap-4 min-h-0 flex-1">
              <SalesmanChart rows={leftRows} title={`${dashboard?.leftLabel ?? ''} Sales by Salesman`} isWtd={period === 'wtd'} yMax={leftYMax} />
            </div>

            {/* Period Carousel */}
            <div className="mt-3 shrink-0 flex justify-center">
              <div className="inline-flex rounded-full border border-slate-600 bg-slate-800 p-1 shadow-[0_8px_22px_rgba(0,0,0,0.3)]">
                {periodCarousel.map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setPeriod(key)}
                    className={cn(
                      'min-w-40 rounded-full px-5 py-2.5 text-center text-sm font-bold transition',
                      period === key
                        ? 'bg-blue-600 text-white shadow-[0_8px_20px_rgba(37,99,246,0.5)]'
                        : 'text-slate-400'
                    )}
                  >
                    {periodLabels[key]}
                  </button>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function SummaryPanel({
  title,
  accent,
  metricKey,
  dashboard,
}: {
  title: string;
  accent: 'blue' | 'orange';
  metricKey: 'sales' | 'grossProfit';
  dashboard: SalesmanDashboard | null;
}) {
  const periods: SalesmanPeriod[] = ['wtd', 'mtd', 'qtd', 'ytd'];
  const periodDisplayLabels: Record<SalesmanPeriod, string> = {
    wtd: 'WTD',
    mtd: 'MTD',
    qtd: 'QTD',
    ytd: 'YTD',
  };
  const toneColorClass = accent === 'blue' ? 'text-blue-400' : 'text-orange-400';
  const toneBackgroundClass = accent === 'blue' ? 'bg-blue-600' : 'bg-orange-600';
  const isSalesMetric = metricKey === 'sales';

  const metricKey2: 'sales' | 'gross_profit' = metricKey === 'sales' ? 'sales' : 'gross_profit';

  const formatNumber = (value: number | undefined) => {
    if (value === undefined || value === null) return '0';
    if (Math.abs(value) >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(2)}M`;
    }
    if (Math.abs(value) >= 1_000) {
      return `${(value / 1_000).toFixed(2)}K`;
    }
    return value.toFixed(0);
  };

  return (
    <section className="overflow-hidden rounded-xl border border-slate-700 bg-slate-800 shadow-[0_14px_40px_rgba(0,0,0,0.3)]">
      <div className={cn('px-6 py-1.5 text-center text-xs font-extrabold uppercase tracking-wide text-white sm:text-sm md:text-base xl:text-lg', toneBackgroundClass)}>
        {title}
      </div>
      <div className="grid grid-cols-1 divide-y divide-slate-700 lg:grid-cols-4 lg:divide-x lg:divide-y-0">
        {periods.map((period) => {
          const metric = dashboard?.topCards[metricKey2]?.[period] ?? null;
          
          // For gross profit, calculate percentage from dollar amounts if current_pct is invalid (100%)
          let grossProfitCurrentPct = metric?.current_pct ?? 0;
          let grossProfitPrevPct = metric?.prev_pct ?? 0;
          
          if (metricKey === 'grossProfit' && metric) {
            const salesMetric = dashboard?.topCards.sales?.[period];
            if (salesMetric) {
              grossProfitCurrentPct = salesMetric.current > 0 
                ? (metric.current / salesMetric.current) * 100 
                : 0;
              grossProfitPrevPct = salesMetric.prev > 0 
                ? (metric.prev / salesMetric.prev) * 100 
                : 0;
            }
          }
          
          // Calculate trend based on actual values being displayed (not API trend)
          let isPositive = metric ? metric.trend === 'UP' : false;
          let trendValue = '--';
          
          if (metric && period !== 'wtd') {
            if (metricKey === 'sales') {
              // For sales, use API trend and pct_change
              isPositive = metric.trend === 'UP';
              trendValue = `${Math.abs(((metric.pct_change ?? 0)) * 100).toFixed(1)}%`;
            } else {
              // For gross profit percentage, calculate trend from the percentages
              isPositive = grossProfitCurrentPct >= grossProfitPrevPct;
              const percentageDiff = Math.abs(grossProfitCurrentPct - grossProfitPrevPct);
              trendValue = `${percentageDiff.toFixed(1)}%`;
            }
          }
          
          const primaryValue = metric
            ? isSalesMetric
              ? `$${formatNumber(metric.current ?? 0)}`
              : `${grossProfitCurrentPct > 0 ? '+' : ''}${grossProfitCurrentPct.toFixed(1)}%`
            : '--';
          const previousValue = metric
            ? isSalesMetric
              ? `Prev: $${formatNumber(metric.prev ?? 0)}`
              : `Prev: ${grossProfitPrevPct > 0 ? '+' : ''}${grossProfitPrevPct.toFixed(1)}%`
            : 'Prev: --';

          return (
            <div key={period} className="flex min-h-[132px] flex-col items-center justify-between px-3 py-3 text-center lg:min-h-[140px] lg:px-4 lg:py-4">
              <div>
                <div className="text-xs font-bold uppercase tracking-wide text-slate-300 sm:text-sm md:text-base xl:text-lg">
                  {title.includes('Gross') ? `${periodDisplayLabels[period]} Gross Profit` : `${periodDisplayLabels[period]} Sales`}
                </div>
                <div className={cn('mt-2 text-xl font-black tracking-tight sm:text-2xl md:text-3xl xl:text-4xl', toneColorClass)}>
                  {primaryValue}
                </div>
                {period !== 'wtd' && (
                  <div className="mt-2 text-xs font-semibold text-slate-400 md:text-sm xl:text-base">
                    {previousValue}
                  </div>
                )}
              </div>

              {period !== 'wtd' && (
                <div className={cn('inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold sm:text-sm md:text-base', isPositive ? 'bg-emerald-950 text-emerald-400' : 'bg-red-950 text-red-400')}>
                  {isPositive ? '↑' : '↓'}
                  <span>{trendValue}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
