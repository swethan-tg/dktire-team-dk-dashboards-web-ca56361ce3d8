'use client';

import { useEffect, useMemo, useState } from 'react';
import { Bar, CartesianGrid, Cell, ComposedChart, LabelList, Line, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { PiInfo, PiArrowUpRight, PiArrowDownRight } from 'react-icons/pi';
import cn from '@core/utils/class-names';
import { formatNumber } from '@/utils/format-number';
import { fetchSalesPerformance } from '@/services/sales-performance/sales-performance.service';
import type { SalesPerformanceDashboard as SalesPerformanceDashboardType } from '@/services/sales-performance/sales-performance.model';
import { buildSalesPerformanceDashboard } from '@/services/sales-performance/sales-performance.model';
import type { SalesPerformancePeriod } from '@/services/sales-performance/sales-performance.interface';

const periodLabels: Record<SalesPerformancePeriod, string> = {
  wtd: 'WTD',
  mtd: 'MTD',
  qtd: 'QTD',
  ytd: 'YTD',
};

const periodCarousel: SalesPerformancePeriod[] = ['wtd', 'mtd', 'qtd', 'ytd'];

type ColorsType = {
  sales: string;
  salesPrev: string;
  profit: string;
  profitLight: string;
  currentSite: string;
  currentSitePrev: string;
};

const colors: ColorsType = {
  sales: '#3b82f6',           // blue (current for other sites)
  salesPrev: '#94a3b8',       // slate-400 (previous for other sites)
  profit: '#f97316',
  profitLight: '#fb923c',
  currentSite: '#ef4444',     // red (current for selected site)
  currentSitePrev: '#fbbf24', // amber (previous for selected site)
};

function buildPercentDomain(values: number[], fallbackMax: number): [number, number] {
  const finiteValues = values.filter((value) => Number.isFinite(value));

  if (!finiteValues.length) {
    return [0, fallbackMax];
  }

  const min = Math.min(...finiteValues);
  const max = Math.max(...finiteValues);

  const nonOutlierValues = finiteValues.filter((value) => value <= 40);
  const effectiveMax = max > 60 && nonOutlierValues.length ? Math.max(...nonOutlierValues) : max;

  const domainMin = min < 0 ? Math.floor(min - 3) : 0;
  const domainMax = Math.max(domainMin + 6, Math.ceil(effectiveMax + 4));

  return [domainMin, domainMax];
}

function buildSalesDomain(values: number[]): [number, number] {
  const finiteValues = values.filter((value) => Number.isFinite(value) && value > 0);

  if (!finiteValues.length) {
    return [0, 100000000];
  }

  const max = Math.max(...finiteValues);
  const domainMax = Math.ceil((max / 1000000) * 1.1) * 1000000; // Add 10% padding

  return [0, domainMax];
}

export default function SalesPerformanceDashboard() {
  const [period, setPeriod] = useState<SalesPerformancePeriod>('mtd');
  const [siteId, setSiteId] = useState<string | null>(null);
  const [source, setSource] = useState<SalesPerformanceDashboardType['source'] | null>(null);
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

  useEffect(() => {
    let mounted = true;

    fetchSalesPerformance(siteId)
      .then((response) => {
        if (mounted) {
          setSource(response);
          setError(null);
        }
      })
      .catch((err: Error) => {
        if (mounted) {
          setError(err.message);
        }
      });

    return () => {
      mounted = false;
    };
  }, [siteId]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setPeriod((prev) => {
        const currentIndex = periodCarousel.indexOf(prev);
        const nextIndex = (currentIndex + 1) % periodCarousel.length;
        return periodCarousel[nextIndex];
      });
    }, 30000);

    return () => window.clearInterval(timer);
  }, []);

  const dashboard = useMemo(
    () => (source ? buildSalesPerformanceDashboard(source, period) : null),
    [period, source]
  );

  const chartRows = useMemo(() => {
    const rows = dashboard?.chartRows ?? [];
    return [...rows].sort((a, b) => {
      // Sort by current sales amount (highest to lowest)
      const salesA = a.salesAmt ?? 0;
      const salesB = b.salesAmt ?? 0;
      return salesB - salesA;
    });
  }, [dashboard]);
  const salesDomain = useMemo<[number, number]>(() => {
    const values = chartRows.flatMap((row) => [row.salesAmt ?? 0, row.lastYearSalesAmt ?? 0]);
    return buildSalesDomain(values);
  }, [chartRows]);

  const profitDomain: [number, number] = [0, 50];

  const currentPeriodLabel = periodLabels[period];
  const xTickInterval = 0;
  const xTickAngle = chartRows.length > 12 ? -45 : 0;
  
  // Responsive font and spacing based on screen size
  const xTickHeight = isLargeScreen 
    ? (chartRows.length > 16 ? 120 : 80)
    : (chartRows.length > 16 ? 64 : 42);
  const xTickFontSize = isLargeScreen ? 36 : 18;
  const labelFontSize = isLargeScreen ? 20 : 10;
  const labelBoxHeight = isLargeScreen ? 32 : 16;
  const labelTextMultiplier = isLargeScreen ? 14 : 6;
  const labelPaddingMultiplier = isLargeScreen ? 16 : 8;
  const labelMinWidth = isLargeScreen ? 60 : 40;
  const labelStrokeWidth = isLargeScreen ? 2 : 1;
  const labelRounding = isLargeScreen ? 8 : 5;
  const labelYPrevious = isLargeScreen ? 58 : 26;
  const barSize = useMemo(() => {
    // Fixed base size without screen scaling
    return chartRows.length > 24 ? 12 : chartRows.length > 16 ? 14 : 18;
  }, [chartRows.length]);
  const salesCenterShift = barSize / 2 + 2;

  return (
    <div className="h-screen overflow-hidden bg-slate-900 text-slate-100">
      <div className="flex h-full w-full flex-col gap-1.5">
        <header className="grid grid-cols-[1fr_auto_1fr] items-center px-0 py-1 bg-slate-800 border-b border-slate-700">
          <div className="text-sm font-extrabold uppercase tracking-[0.05em] text-blue-400 sm:text-base md:text-lg xl:text-xl 2xl:text-2xl">
            DK Tire {siteId && `- ${siteId}`}
          </div>
          <h1 className="text-center text-sm font-extrabold uppercase tracking-[0.05em] text-blue-400 sm:text-base md:text-lg xl:text-xl 2xl:text-2xl">
            Sales Performance Dashboard
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

        <div className="grid gap-2 xl:grid-cols-2">
          <SummaryPanel
            title="Sales Performance"
            accent="blue"
            metricKey="sales"
            dashboard={dashboard}
            siteId={siteId}
            source={source}
            period={period}
          />
          <SummaryPanel
            title="Gross Profit Performance"
            accent="orange"
            metricKey="grossProfit"
            dashboard={dashboard}
            siteId={siteId}
            source={source}
            period={period}
          />
        </div>

        <section className="min-h-0 flex flex-1 flex-col rounded-xl border border-slate-700 bg-slate-800 p-3 shadow-[0_14px_40px_rgba(0,0,0,0.3)] sm:p-4 lg:p-5">
          <div>
            <h2 className="text-lg font-extrabold tracking-tight text-blue-400 sm:text-xl md:text-2xl xl:text-3xl">
              {currentPeriodLabel} Sales by Site{' '}
              <span className="text-sm font-semibold text-slate-400 sm:text-base md:text-lg xl:text-xl">(vs Last Year {currentPeriodLabel})</span>
            </h2>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-slate-300 sm:text-sm md:text-base">
              <LegendDot color={colors.sales} label={`${currentPeriodLabel} Sales (Current)`} solid />
              <LegendDot color={colors.salesPrev} label={`${currentPeriodLabel} Sales (Last Year)`} dashed />
            </div>
          </div>

            <div className="mt-3 min-h-0 flex-1 rounded-lg bg-slate-900 pb-1">
            <div className="h-full w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={chartRows}
                  margin={{ top: 44, right: 18, bottom: 14, left: 10 }}
                  barCategoryGap={18}
                  className="[&_.recharts-cartesian-axis-tick-value]:fill-slate-400 [&_.recharts-cartesian-grid-vertical]:opacity-0"
                >
                  <defs>
                    <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={colors.sales} stopOpacity={0.95} />
                      <stop offset="100%" stopColor={colors.sales} stopOpacity={0.65} />
                    </linearGradient>
                    <linearGradient id="salesOutline" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={colors.salesPrev} stopOpacity={0.95} />
                      <stop offset="100%" stopColor={colors.salesPrev} stopOpacity={0.65} />
                    </linearGradient>
                    <linearGradient id="salesFillCurrentSite" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={colors.currentSite} stopOpacity={0.95} />
                      <stop offset="100%" stopColor={colors.currentSite} stopOpacity={0.65} />
                    </linearGradient>
                    <linearGradient id="salesOutlineCurrentSite" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={colors.currentSitePrev} stopOpacity={0.95} />
                      <stop offset="100%" stopColor={colors.currentSitePrev} stopOpacity={0.65} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#334155" strokeDasharray="4 8" vertical={false} />
                  <XAxis
                    dataKey="siteId"
                    axisLine={false}
                    tickLine={false}
                    tickMargin={14}
                    angle={xTickAngle}
                    textAnchor={xTickAngle !== 0 ? 'end' : 'middle'}
                    height={xTickHeight}
                    interval={xTickInterval}
                    tick={{ fontSize: xTickFontSize, fontWeight: 700, fill: '#94a3b8' }}
                  />
                  <YAxis
                    yAxisId="left"
                    axisLine={false}
                    tickLine={false}
                    tickMargin={14}
                    width={52}
                    domain={salesDomain}
                    tickFormatter={(value) => formatNumber(value)}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    axisLine={false}
                    tickLine={false}
                    tickMargin={14}
                    width={52}
                    domain={profitDomain}
                    allowDataOverflow
                    ticks={[0, 10, 20, 30, 40, 50]}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Bar yAxisId="left" dataKey="salesAmt" name={`${currentPeriodLabel} Sales (Current)`} fill="url(#salesFill)" barSize={barSize} radius={[8, 8, 0, 0]}>
                    {chartRows.map((row, index) => (
                      <Cell key={`salesAmt-${index}`} fill={row.siteId === siteId ? 'url(#salesFillCurrentSite)' : 'url(#salesFill)'} />
                    ))}
                    <LabelList
                      dataKey="salesAmt"
                      content={(props) => (
                        <SalesFlatRowLabel
                          {...props}
                          mode="current"
                          centerShift={salesCenterShift}
                          selectedSiteId={siteId}
                          colors={colors}
                          isLargeScreen={isLargeScreen}
                          labelFontSize={labelFontSize}
                          labelBoxHeight={labelBoxHeight}
                          labelTextMultiplier={labelTextMultiplier}
                          labelPaddingMultiplier={labelPaddingMultiplier}
                          labelMinWidth={labelMinWidth}
                          labelStrokeWidth={labelStrokeWidth}
                          labelRounding={labelRounding}
                          labelYPrevious={labelYPrevious}
                        />
                      )}
                    />
                  </Bar>
                  <Bar yAxisId="left" dataKey="lastYearSalesAmt" name={`${currentPeriodLabel} Sales (Last Year)`} fill="url(#salesOutline)" barSize={barSize} radius={[8, 8, 0, 0]}>
                    {chartRows.map((row, index) => (
                      <Cell key={`lastYearSalesAmt-${index}`} fill={row.siteId === siteId ? 'url(#salesOutlineCurrentSite)' : 'url(#salesOutline)'} />
                    ))}
                    <LabelList
                      dataKey="lastYearSalesAmt"
                      content={(props) => (
                        <SalesFlatRowLabel
                          {...props}
                          mode="lastYear"
                          centerShift={salesCenterShift}
                          selectedSiteId={siteId}
                          colors={colors}
                          isLargeScreen={isLargeScreen}
                          labelFontSize={labelFontSize}
                          labelBoxHeight={labelBoxHeight}
                          labelTextMultiplier={labelTextMultiplier}
                          labelPaddingMultiplier={labelPaddingMultiplier}
                          labelMinWidth={labelMinWidth}
                          labelStrokeWidth={labelStrokeWidth}
                          labelRounding={labelRounding}
                          labelYPrevious={labelYPrevious}
                        />
                      )}
                    />
                  </Bar>
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-2 shrink-0 flex justify-center">
            <div className="inline-flex rounded-full border border-slate-600 bg-slate-800 p-1 shadow-[0_8px_22px_rgba(0,0,0,0.3)]">
              {periodCarousel.map((key) => (
                <span
                  key={key}
                  className={cn(
                    'min-w-32 rounded-full px-5 py-2.5 text-center text-sm font-bold transition',
                    period === key
                      ? 'bg-blue-600 text-white shadow-[0_8px_20px_rgba(37,99,246,0.5)]'
                      : 'text-slate-400'
                  )}
                >
                  {periodLabels[key]}
                </span>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function SummaryPanel({
  title,
  accent,
  metricKey,
  dashboard,
  siteId,
  source,
  period,
}: {
  title: string;
  accent: 'blue' | 'orange';
  metricKey: 'sales' | 'grossProfit';
  dashboard: SalesPerformanceDashboardType | null;
  siteId: string | null;
  source: SalesPerformanceDashboardType['source'] | null;
  period: SalesPerformancePeriod;
}) {
  const toneColorClass = accent === 'blue' ? 'text-blue-400' : 'text-orange-400';
  const toneBackgroundClass = accent === 'blue' ? 'bg-blue-600' : 'bg-orange-600';
  
  // Get site-specific data if siteId is available
  const getSiteSummary = useMemo(() => {
    if (!siteId || !source) {
      return dashboard?.[metricKey] ?? null;
    }
    
    const site = source.site_performance.find((s) => s.site_id === siteId);
    if (!site) {
      return dashboard?.[metricKey] ?? null;
    }
    
    // Create fallback metric for when wtd is not available
    const fallbackSiteMetric = {
      current_sales_amt: 0,
      prev_sales_amt: 0,
      gross_profit: 0,
      prev_gross_profit: 0,
      profit_pct: 0,
      sales_pct: 0,
      last_yr_sales_pct: 0,
      last_yr_profit_pct: 0,
    };
    
    if (metricKey === 'sales') {
      // Convert site metrics to period summaries for all periods
      const wtdMetric = site.wtd ?? fallbackSiteMetric;
      const mtdMetric = site.mtd;
      const qtdMetric = site.qtd;
      const ytdMetric = site.ytd;
      
      const convertSiteMetricToSummary = (metric: typeof wtdMetric) => {
        const currentSales = metric.current_sales_amt ?? 0;
        const prevSales = metric.prev_sales_amt ?? 0;
        const change = prevSales !== 0 
          ? ((currentSales - prevSales) / prevSales) * 100
          : 0;
        
        return {
          current: currentSales,
          previous: prevSales,
          change: Number.isFinite(change) ? change : 0,
          trend: currentSales >= prevSales ? 'UP' as const : 'DOWN' as const,
          currentPercent: metric.sales_pct ?? 0,
          previousPercent: metric.last_yr_sales_pct ?? 0,
        };
      };
      
      return {
        wtd: convertSiteMetricToSummary(wtdMetric),
        mtd: convertSiteMetricToSummary(mtdMetric),
        qtd: convertSiteMetricToSummary(qtdMetric),
        ytd: convertSiteMetricToSummary(ytdMetric),
      };
    } else {
      // For grossProfit, calculate percentage for each period
      const wtdMetric = site.wtd ?? fallbackSiteMetric;
      const mtdMetric = site.mtd;
      const qtdMetric = site.qtd;
      const ytdMetric = site.ytd;
      
      const convertGrossProfitMetricToSummary = (metric: typeof wtdMetric) => {
        // Use profit_pct directly from API instead of calculating
        const currentProfitPct = metric.profit_pct ?? 0;
        const prevProfitPct = metric.last_yr_profit_pct ?? 0;
        
        return {
          current: currentProfitPct,
          previous: prevProfitPct,
          change: currentProfitPct - prevProfitPct,
          trend: currentProfitPct - prevProfitPct >= 0 ? 'UP' as const : 'DOWN' as const,
          currentPercent: currentProfitPct,
          previousPercent: prevProfitPct,
        };
      };
      
      return {
        wtd: convertGrossProfitMetricToSummary(wtdMetric),
        mtd: convertGrossProfitMetricToSummary(mtdMetric),
        qtd: convertGrossProfitMetricToSummary(qtdMetric),
        ytd: convertGrossProfitMetricToSummary(ytdMetric),
      };
    }
  }, [siteId, source, metricKey, period, dashboard]);
  
  const summary = getSiteSummary;
  const isSalesMetric = metricKey === 'sales';

  const periods = ['wtd', 'mtd', 'qtd', 'ytd'] as const;
  
  // Helper to format numbers
  const formatNumber = (value: number) => {
    if (value === undefined || value === null) return '--';
    if (Math.abs(value) >= 1_000_000_000) {
      return `${(value / 1_000_000_000).toFixed(2)}B`;
    }
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
          const item = summary?.[period] ?? null;
          const computedChange = item ? item.change : 0;
          const isPositive = item ? item.trend === 'UP' : false;
          const primaryValue = item
            ? isSalesMetric
              ? `$${formatNumber(item.current)}`
              : `${item.currentPercent > 0 ? '+' : ''}${item.currentPercent.toFixed(1)}%`
            : '--';
          const previousValue = item
            ? isSalesMetric
              ? `Prev: $${formatNumber(item.previous)}`
              : `Prev: ${item.previousPercent > 0 ? '+' : ''}${item.previousPercent.toFixed(1)}%`
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
                  {isPositive ? <PiArrowUpRight /> : <PiArrowDownRight />}
                  <span>{item ? `${Math.abs(computedChange).toFixed(1)}%` : '--'}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function formatShortNumber(value: number) {
  if (Math.abs(value) >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(2)}B`;
  }

  if (Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`;
  }

  if (Math.abs(value) >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }

  return value.toFixed(0);
}

function LegendDot({
  color,
  label,
  solid,
  line,
  dashed,
}: {
  color: string;
  label: string;
  solid?: boolean;
  line?: boolean;
  dashed?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={cn('inline-block', line ? 'h-0.5 w-7' : 'h-3.5 w-3.5 rounded-sm', dashed && 'border-2 border-dashed bg-transparent')}
        style={{ backgroundColor: solid && !dashed ? color : undefined, borderColor: color }}
      />
      <span>{label}</span>
    </div>
  );
}

function LineValueLabel({
  x,
  y,
  value,
  mode,
}: {
  x?: number | string;
  y?: number | string;
  value?: number | string;
  mode: 'current' | 'lastYear';
}) {
  const px = typeof x === 'string' ? Number(x) : x;
  const py = typeof y === 'string' ? Number(y) : y;
  const pvalue = typeof value === 'string' ? Number(value) : value;

  if (
    typeof px !== 'number' ||
    typeof py !== 'number' ||
    typeof pvalue !== 'number' ||
    Number.isNaN(px) ||
    Number.isNaN(py) ||
    Number.isNaN(pvalue)
  ) {
    return null;
  }

  const isCurrent = mode === 'current';
  const yShift = isCurrent ? -26 : -44;

  const fill = isCurrent ? '#e24a00' : '#0a6f84';
  const text = `${pvalue.toFixed(2)}%`;
  const width = text.length * 7 + 12;

  return (
    <g transform={`translate(${px - width / 2},${py + yShift})`}>
      <rect width={width} height={18} rx={6} fill="#ffffff" fillOpacity={0.95} stroke="#f1f5ff" />
      <text x={width / 2} y={13} textAnchor="middle" fontSize="11" fontWeight="700" fill={fill}>
        {text}
      </text>
    </g>
  );
}

function SalesFlatRowLabel({
  x,
  y,
  value,
  payload,
  mode,
  centerShift,
  selectedSiteId,
  colors,
  isLargeScreen,
  labelFontSize,
  labelBoxHeight,
  labelTextMultiplier,
  labelPaddingMultiplier,
  labelMinWidth,
  labelStrokeWidth,
  labelRounding,
  labelYPrevious,
}: {
  x?: number | string;
  y?: number | string;
  value?: number | string;
  payload?: any;
  mode: 'current' | 'lastYear';
  centerShift?: number;
  selectedSiteId?: string | null;
  colors?: ColorsType;
  isLargeScreen?: boolean;
  labelFontSize?: number;
  labelBoxHeight?: number;
  labelTextMultiplier?: number;
  labelPaddingMultiplier?: number;
  labelMinWidth?: number;
  labelStrokeWidth?: number;
  labelRounding?: number;
  labelYPrevious?: number;
}) {
  const px = typeof x === 'string' ? Number(x) : (x ?? 0);
  const py = typeof y === 'string' ? Number(y) : (y ?? 0);
  
  if (typeof px !== 'number' || Number.isNaN(px)) {
    return null;
  }

  // Get sales amount from value (dataKey) or payload
  const numValue = typeof value === 'string' ? Number(value) : value;
  const salesAmt = numValue ?? payload?.salesAmt ?? 0;
  if (!salesAmt || salesAmt === 0) {
    return null;
  }

  const text = formatShortNumber(salesAmt);
  const textWidth = Math.max(text.length * (labelTextMultiplier ?? 6) + (labelPaddingMultiplier ?? 8), labelMinWidth ?? 40);
  const isCurrent = mode === 'current';
  const yPosition = isCurrent ? 8 : (labelYPrevious ?? 26);
  const xAligned = isCurrent 
    ? px + (centerShift ?? 0)
    : px - (centerShift ?? 0);
  
  // Determine if this bar is the selected site
  const isSelectedSite = payload?.siteId === selectedSiteId;
  
  // Use colors based on whether this is the selected site and current/previous
  let textColor: string;
  let strokeColor: string;
  
  if (isSelectedSite) {
    // Selected site: red for current, amber for previous
    textColor = isCurrent ? '#dc2626' : '#b45309';
    strokeColor = isCurrent ? '#fecaca' : '#fcd34d';
  } else {
    // Other sites: blue for current, gray for previous
    textColor = isCurrent ? '#1e40af' : '#475569';
    strokeColor = isCurrent ? '#bfdbfe' : '#cbd5e1';
  }
  
  const fillColor = '#f9fafb';

  return (
    <g transform={`translate(${xAligned - textWidth / 2},${yPosition})`}>
      <rect width={textWidth} height={labelBoxHeight ?? 16} rx={labelRounding ?? 5} fill={fillColor} fillOpacity={1} stroke={strokeColor} strokeWidth={labelStrokeWidth ?? 1} />
      <text x={textWidth / 2} y={(labelBoxHeight ?? 16) * 0.7} textAnchor="middle" fontSize={labelFontSize ?? 10} fontWeight="700" fill={textColor}>
        {text}
      </text>
    </g>
  );
}


