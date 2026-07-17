'use client';

import { useEffect, useMemo, useState } from 'react';
import { BarChart, Bar, Cell, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Legend, Tooltip, LabelList } from 'recharts';
import { PiInfo } from 'react-icons/pi';
import cn from '@core/utils/class-names';
import { formatNumber } from '@/utils/format-number';
import { fetchSalesmanPerformance } from '@/services/salesman-performance/salesman-performance.service';
import { buildSalesmanDashboard } from '@/services/salesman-performance/salesman-performance.model';
import type { SalesmanDashboard } from '@/services/salesman-performance/salesman-performance.model';
import type { SalesmanPeriod } from '@/services/salesman-performance/salesman-performance.model';

type PeriodMode = 'wtd_mtd' | 'qtd' | 'ytd';

const periodLabels: Record<PeriodMode, string> = {
  wtd_mtd: 'WTD / MTD',
  qtd: 'QTD',
  ytd: 'YTD',
};

const periodCarousel: PeriodMode[] = ['wtd_mtd', 'qtd', 'ytd'];

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
  const [period, setPeriod] = useState<PeriodMode>('wtd_mtd');
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
        const modes: PeriodMode[] = ['wtd_mtd', 'qtd_ytd', 'ytd'];
        const currentIndex = modes.indexOf(prev);
        const nextIndex = (currentIndex + 1) % modes.length;
        return modes[nextIndex];
      });
    }, 60000); // 60 seconds = 1 minute

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

    if (siteId) {
      loadData();
    }
  }, [siteId]);

  const dashboard = useMemo(() => {
    if (!source) return null;
    
    // Map PeriodMode to actual periods to fetch
    if (period === 'wtd_mtd') {
      const wtdDash = buildSalesmanDashboard(source, 'wtd');
      const mtdDash = buildSalesmanDashboard(source, 'mtd');
      return { wtd: wtdDash, mtd: mtdDash };
    } else if (period === 'qtd') {
      return { qtd: buildSalesmanDashboard(source, 'qtd') };
    } else {
      // period === 'ytd'
      return { ytd: buildSalesmanDashboard(source, 'ytd') };
    }
  }, [source, period]);

  const chartRows = useMemo(() => {
    if (!dashboard) return { left: [], right: [] };
    
    if ('wtd' in dashboard) {
      return {
        left: dashboard.wtd?.chartRows ?? [],
        right: dashboard.mtd?.chartRows ?? [],
      };
    } else if ('qtd' in dashboard) {
      return {
        left: dashboard.qtd?.chartRows ?? [],
        right: [],
      };
    } else {
      return {
        left: dashboard.ytd?.chartRows ?? [],
        right: [],
      };
    }
  }, [dashboard]);

  // Responsive sizing
  const barSize = isLargeScreen ? 48 : 18;
  const chartMargin = isLargeScreen ? 200 : 120;

  return (
    <div className="h-screen overflow-hidden bg-slate-900 text-slate-100">
      <div className="flex h-full w-full flex-col gap-1.5">
        <header className="grid grid-cols-[1fr_auto_1fr] items-center px-0 py-1 bg-slate-800 border-b border-slate-700">
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
          <div className="rounded-3xl border border-red-900 bg-red-950 p-6 text-sm text-red-200 shadow-[0_12px_35px_rgba(0,0,0,0.3)]">
            {error}
          </div>
        ) : null}

        <div className="flex h-full w-full flex-col gap-1.5 p-1.5 overflow-auto">
          {/* KPI Cards - Only show for first period in dual mode */}
          {(period !== 'qtd_ytd' || period === 'wtd_mtd') && (
            <div className="grid gap-2 xl:grid-cols-2 shrink-0">
              {(() => {
                const dashToUse = period === 'wtd_mtd' ? dashboard?.wtd : 
                                  period === 'qtd_ytd' ? dashboard?.qtd : 
                                  dashboard?.ytd;
                return (
                  <>
                    <SummaryPanel
                      title="Sales Performance"
                      accent="blue"
                      metricKey="sales"
                      dashboard={dashToUse}
                    />
                    <SummaryPanel
                      title="Gross Profit Performance"
                      accent="orange"
                      metricKey="grossProfit"
                      dashboard={dashToUse}
                    />
                  </>
                );
              })()}
            </div>
          )}

          {/* Salesmen Chart */}
          <section className="flex flex-col rounded-xl border border-slate-700 bg-slate-800 p-3 shadow-[0_14px_40px_rgba(0,0,0,0.3)] sm:p-4 lg:p-5">
            {period === 'wtd_mtd' ? (
              <>
                {/* WTD / MTD Dual Display */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <h2 className="text-lg font-extrabold tracking-tight text-blue-400 sm:text-xl md:text-2xl">
                      WTD Sales by Salesman
                    </h2>
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold tracking-tight text-blue-400 sm:text-xl md:text-2xl">
                      MTD Sales by Salesman
                    </h2>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {/* WTD Column */}
                  <div className="flex flex-col gap-0.5">
                    {chartRows.left
                      .filter((row) => row.salesmanName && row.salesmanName !== 'None' && row.salesmanName !== 'N/A' && row.salesmanName.trim() !== '')
                      .sort((a, b) => (b.currentSales ?? 0) - (a.currentSales ?? 0))
                      .map((row) => {
                        const current = row.currentSales ?? 0;
                        const maxValue = Math.max(...chartRows.left.map(r => r.currentSales ?? 0));
                        const currentPct = maxValue > 0 ? (current / maxValue) * 100 : 0;
                        const nameSize = isLargeScreen ? 'text-lg' : 'text-sm';
                        const valueSize = isLargeScreen ? 'text-lg' : 'text-sm';
                        const barHeight = isLargeScreen ? 'h-7' : 'h-5';
                        const rowPadding = isLargeScreen ? 'py-1.5' : 'py-1';

                        return (
                          <div key={`wtd-${row.salesmanId}`} className={cn('flex items-center gap-1.5 px-1.5 rounded-sm bg-slate-800 hover:bg-slate-750 transition-colors border border-slate-700', rowPadding)}>
                            <div className={cn('font-bold text-slate-100 truncate', nameSize, isLargeScreen ? 'w-32' : 'w-24')}>
                              {row.salesmanName}
                            </div>
                            <div className={cn('flex-1 bg-slate-700 rounded-sm overflow-hidden border border-slate-600 relative', barHeight)}>
                              <div
                                className="h-full bg-gradient-to-r from-blue-600 to-blue-500 transition-all"
                                style={{ width: `${currentPct}%` }}
                              />
                            </div>
                            <div className={cn('flex-shrink-0 text-right font-bold text-blue-400', valueSize, isLargeScreen ? 'w-20' : 'w-16')}>
                              {formatNumber(current)}
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  {/* MTD Column */}
                  <div className="flex flex-col gap-0.5">
                    {chartRows.right
                      .filter((row) => row.salesmanName && row.salesmanName !== 'None' && row.salesmanName !== 'N/A' && row.salesmanName.trim() !== '')
                      .sort((a, b) => (b.currentSales ?? 0) - (a.currentSales ?? 0))
                      .map((row) => {
                        const current = row.currentSales ?? 0;
                        const previous = row.previousSales ?? 0;
                        const maxValue = Math.max(...chartRows.right.map(r => r.currentSales ?? 0));
                        const currentPct = maxValue > 0 ? (current / maxValue) * 100 : 0;
                        const diff = current - previous;
                        const pctChange = previous !== 0 ? ((diff / previous) * 100) : 0;
                        const isPositive = pctChange >= 0;
                        const nameSize = isLargeScreen ? 'text-lg' : 'text-sm';
                        const valueSize = isLargeScreen ? 'text-lg' : 'text-sm';
                        const barHeight = isLargeScreen ? 'h-7' : 'h-5';
                        const rowPadding = isLargeScreen ? 'py-1.5' : 'py-1';

                        return (
                          <div key={`mtd-${row.salesmanId}`} className={cn('flex items-center gap-1.5 px-1.5 rounded-sm bg-slate-800 hover:bg-slate-750 transition-colors border border-slate-700', rowPadding)}>
                            <div className={cn('font-bold text-slate-100 truncate', nameSize, isLargeScreen ? 'w-32' : 'w-24')}>
                              {row.salesmanName}
                            </div>
                            <div className={cn('flex-1 bg-slate-700 rounded-sm overflow-hidden border border-slate-600 relative', barHeight)}>
                              <div
                                className="h-full bg-gradient-to-r from-blue-600 to-blue-500 transition-all"
                                style={{ width: `${currentPct}%` }}
                              />
                            </div>
                            <div className={cn('flex-shrink-0 text-right font-bold text-blue-400', valueSize, isLargeScreen ? 'w-20' : 'w-16')}>
                              {formatNumber(current)}
                            </div>
                            <div className={cn('flex-shrink-0 text-right text-slate-400', valueSize, isLargeScreen ? 'w-20' : 'w-16')}>
                              ({formatNumber(previous)})
                            </div>
                            <div className={cn('flex-shrink-0 font-bold text-center rounded px-1.5', valueSize, isPositive ? 'text-emerald-400' : 'text-red-400', isLargeScreen ? 'w-14' : 'w-12')}>
                              {isPositive ? '↑' : '↓'} {Math.abs(pctChange).toFixed(0)}%
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </>
            ) : period === 'qtd' ? (
              <>
                {/* QTD Single Display */}
                <div>
                  <h2 className="text-lg font-extrabold tracking-tight text-blue-400 sm:text-xl md:text-2xl">
                    QTD Sales by Salesman
                  </h2>
                </div>
                <div className="mt-4 flex flex-col gap-0.5">
                  {chartRows.left
                    .filter((row) => row.salesmanName && row.salesmanName !== 'None' && row.salesmanName !== 'N/A' && row.salesmanName.trim() !== '')
                    .sort((a, b) => (b.currentSales ?? 0) - (a.currentSales ?? 0))
                    .map((row) => {
                      const current = row.currentSales ?? 0;
                      const previous = row.previousSales ?? 0;
                      const maxValue = Math.max(...chartRows.left.map(r => r.currentSales ?? 0));
                      const currentPct = maxValue > 0 ? (current / maxValue) * 100 : 0;
                      const diff = current - previous;
                      const pctChange = previous !== 0 ? ((diff / previous) * 100) : 0;
                      const isPositive = pctChange >= 0;
                      const nameSize = isLargeScreen ? 'text-lg' : 'text-sm';
                      const valueSize = isLargeScreen ? 'text-lg' : 'text-sm';
                      const barHeight = isLargeScreen ? 'h-7' : 'h-5';
                      const rowPadding = isLargeScreen ? 'py-1.5' : 'py-1';

                      return (
                        <div key={`qtd-${row.salesmanId}`} className={cn('flex items-center gap-1.5 px-1.5 rounded-sm bg-slate-800 hover:bg-slate-750 transition-colors border border-slate-700', rowPadding)}>
                          <div className={cn('font-bold text-slate-100 truncate', nameSize, isLargeScreen ? 'w-48' : 'w-32')}>
                            {row.salesmanName}
                          </div>
                          <div className={cn('flex-1 bg-slate-700 rounded-sm overflow-hidden border border-slate-600 relative', barHeight)}>
                            <div
                              className="h-full bg-gradient-to-r from-blue-600 to-blue-500 transition-all"
                              style={{ width: `${currentPct}%` }}
                            />
                          </div>
                          <div className={cn('flex-shrink-0 text-right font-bold text-blue-400', valueSize, isLargeScreen ? 'w-20' : 'w-18')}>
                            {formatNumber(current)}
                          </div>
                          <div className={cn('flex-shrink-0 text-right text-slate-400', valueSize, isLargeScreen ? 'w-20' : 'w-16')}>
                            ({formatNumber(previous)})
                          </div>
                          <div className={cn('flex-shrink-0 font-bold text-center rounded px-1.5', valueSize, isPositive ? 'text-emerald-400' : 'text-red-400', isLargeScreen ? 'w-14' : 'w-12')}>
                            {isPositive ? '↑' : '↓'} {Math.abs(pctChange).toFixed(0)}%
                          </div>
                        </div>
                      );
                    })}
                </div>
              </>
            ) : (
              <>
                {/* YTD Single Display */}
                <div>
                  <h2 className="text-lg font-extrabold tracking-tight text-blue-400 sm:text-xl md:text-2xl">
                    YTD Sales by Salesman
                  </h2>
                </div>
                <div className="mt-4 flex flex-col gap-0.5">
                  {chartRows.left
                    .filter((row) => row.salesmanName && row.salesmanName !== 'None' && row.salesmanName !== 'N/A' && row.salesmanName.trim() !== '')
                    .sort((a, b) => (b.currentSales ?? 0) - (a.currentSales ?? 0))
                    .map((row) => {
                      const current = row.currentSales ?? 0;
                      const previous = row.previousSales ?? 0;
                      const maxValue = Math.max(...chartRows.left.map(r => r.currentSales ?? 0));
                      const currentPct = maxValue > 0 ? (current / maxValue) * 100 : 0;
                      const diff = current - previous;
                      const pctChange = previous !== 0 ? ((diff / previous) * 100) : 0;
                      const isPositive = pctChange >= 0;
                      const nameSize = isLargeScreen ? 'text-lg' : 'text-sm';
                      const valueSize = isLargeScreen ? 'text-lg' : 'text-sm';
                      const barHeight = isLargeScreen ? 'h-7' : 'h-5';
                      const rowPadding = isLargeScreen ? 'py-1.5' : 'py-1';

                      return (
                        <div key={`ytd-full-${row.salesmanId}`} className={cn('flex items-center gap-1.5 px-1.5 rounded-sm bg-slate-800 hover:bg-slate-750 transition-colors border border-slate-700', rowPadding)}>
                          <div className={cn('font-bold text-slate-100 truncate', nameSize, isLargeScreen ? 'w-48' : 'w-32')}>
                            {row.salesmanName}
                          </div>
                          <div className={cn('flex-1 bg-slate-700 rounded-sm overflow-hidden border border-slate-600 relative', barHeight)}>
                            <div
                              className="h-full bg-gradient-to-r from-blue-600 to-blue-500 transition-all"
                              style={{ width: `${currentPct}%` }}
                            />
                          </div>
                          <div className={cn('flex-shrink-0 text-right font-bold text-blue-400', valueSize, isLargeScreen ? 'w-20' : 'w-18')}>
                            {formatNumber(current)}
                          </div>
                          <div className={cn('flex-shrink-0 text-right text-slate-400', valueSize, isLargeScreen ? 'w-20' : 'w-16')}>
                            ({formatNumber(previous)})
                          </div>
                          <div className={cn('flex-shrink-0 font-bold text-center rounded px-1.5', valueSize, isPositive ? 'text-emerald-400' : 'text-red-400', isLargeScreen ? 'w-14' : 'w-12')}>
                            {isPositive ? '↑' : '↓'} {Math.abs(pctChange).toFixed(0)}%
                          </div>
                        </div>
                      );
                    })}
                </div>
              </>
            )}

            {/* Period Carousel */}
            <div className="mt-4 shrink-0 flex justify-center">
              <div className="inline-flex rounded-full border border-slate-600 bg-slate-800 p-1 shadow-[0_8px_22px_rgba(0,0,0,0.3)]">
                {periodCarousel.map((key) => (
                  <button
                    key={key}
                    disabled
                    className={cn(
                      'min-w-40 rounded-full px-5 py-2.5 text-center text-sm font-bold transition cursor-default',
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
                  {title.includes('Gross') ? `${periodLabels[period]} Gross Profit` : `${periodLabels[period]} Sales`}
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
