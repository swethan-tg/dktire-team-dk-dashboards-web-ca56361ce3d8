'use client';

import { useEffect, useMemo, useState } from 'react';
import { Bar, CartesianGrid, ComposedChart, LabelList, Line, ResponsiveContainer, XAxis, YAxis } from 'recharts';
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

const colors = {
  sales: '#14b8a6',
  salesLight: '#2dd4bf',
  profit: '#d97706',
  profitLight: '#fcd34d',
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
  const [period, setPeriod] = useState<SalesPerformancePeriod>('wtd');
  const [currentSiteId, setCurrentSiteId] = useState<string | null>(null);
  const [source, setSource] = useState<SalesPerformanceDashboardType['source'] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [screenWidth, setScreenWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1920);

  // Extract currentSiteId from query parameter on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const siteId = params.get('siteId');
      setCurrentSiteId(siteId);
    }
  }, []);

  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    let mounted = true;

    fetchSalesPerformance()
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
  }, []);

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
      // Sort by sales amount descending (highest to lowest)
      return (b.salesAmt ?? 0) - (a.salesAmt ?? 0);
    });
  }, [dashboard]);
  const salesDomain = useMemo<[number, number]>(() => {
    const values = chartRows.flatMap((row) => [row.salesAmt ?? 0, row.lastYearSalesAmt ?? 0]);
    return buildSalesDomain(values);
  }, [chartRows]);

  // Responsive font sizing based on screen width
  const responsiveFontSizes = useMemo(() => {
    if (screenWidth < 640) return { xAxisLabel: 11, numberLabel: 9, xTickHeight: 48 };
    if (screenWidth < 1024) return { xAxisLabel: 13, numberLabel: 11, xTickHeight: 56 };
    if (screenWidth < 1536) return { xAxisLabel: 16, numberLabel: 13, xTickHeight: 64 };
    if (screenWidth < 2560) return { xAxisLabel: 18, numberLabel: 15, xTickHeight: 80 };
    return { xAxisLabel: 22, numberLabel: 18, xTickHeight: 96 }; // 65"+ displays
  }, [screenWidth]);

  const currentPeriodLabel = periodLabels[period];
  const xTickInterval = 0;
  const xTickAngle = chartRows.length > 12 ? -45 : 0;
  const xTickHeight = chartRows.length > 16 ? responsiveFontSizes.xTickHeight : Math.max(responsiveFontSizes.xTickHeight - 16, 40);
  const barSize = useMemo(() => {
    // Scale bar size based on both screen width AND item count
    const baseMultiplier = screenWidth < 1024 ? 0.8 : screenWidth < 1536 ? 1 : screenWidth < 2560 ? 1.2 : 1.5;
    const itemCount = chartRows.length;
    if (itemCount > 24) return Math.round(16 * baseMultiplier);
    if (itemCount > 16) return Math.round(20 * baseMultiplier);
    return Math.round(24 * baseMultiplier);
  }, [chartRows.length, screenWidth]);
  const salesCenterShift = barSize / 2 + 2;

  return (
    <div className="h-screen overflow-hidden bg-gray-50 text-gray-700 dark:bg-gray-50 dark:text-gray-700" data-theme="dark">
      <div className="flex h-full w-full flex-col gap-1.5">
        <header className="grid grid-cols-[1fr_auto_1fr] items-center px-0 py-1">
          <div className="text-sm font-extrabold uppercase tracking-[0.05em] text-gray-700 dark:text-gray-700 sm:text-base md:text-lg xl:text-xl 2xl:text-2xl">
            {currentSiteId && <span>Site# {currentSiteId}</span>}
          </div>
          <h1 className="text-center text-sm font-extrabold uppercase tracking-[0.05em] text-gray-700 dark:text-gray-700 sm:text-base md:text-lg xl:text-xl 2xl:text-2xl">
            Sales Performance Dashboard
          </h1>
          <p className="justify-self-end inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-500 md:text-sm xl:text-base">
            <PiInfo className="size-4 text-blue-600 dark:text-blue-400" />
            <span>The dashboard data is as of till yesterday</span>
          </p>
        </header>

        {error ? (
          <div className="rounded-3xl border border-red-700 dark:border-red-400 bg-red-50 dark:bg-red-950 p-6 text-sm text-red-700 dark:text-red-300 shadow-[0_12px_35px_rgba(0,0,0,0.3)]">
            {error}
          </div>
        ) : null}

        <div className="grid gap-2 xl:grid-cols-2">
          <SummaryPanel
            title="Sales Performance"
            accent="blue"
            metricKey="sales"
            dashboard={dashboard}
          />
        </div>

        <section className="min-h-0 flex flex-1 flex-col rounded-xl border border-gray-200 dark:border-gray-200 bg-white dark:bg-gray-100 p-3 shadow-[0_14px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_14px_40px_rgba(0,0,0,0.3)] sm:p-4 lg:p-5">
          <div>
            <h2 className="text-lg font-extrabold tracking-tight text-gray-700 dark:text-gray-700 sm:text-xl md:text-2xl xl:text-3xl">
              {currentPeriodLabel} Sales by Site{' '}
              <span className="text-sm font-semibold text-gray-600 dark:text-gray-600 sm:text-base md:text-lg xl:text-xl">(vs Last Year {currentPeriodLabel})</span>
            </h2>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-gray-600 dark:text-gray-600 sm:text-sm md:text-base">
              <LegendDot color={colors.sales} label={`${currentPeriodLabel} Sales (Current)`} solid />
              <LegendDot color={colors.salesLight} label={`${currentPeriodLabel} Sales (Last Year)`} dashed />
            </div>
          </div>

          <div className="mt-3 min-h-0 flex-1 rounded-lg bg-white dark:bg-gray-100 pb-1">
            <div className="h-full w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={chartRows}
                  margin={{ top: 44, right: 18, bottom: 14, left: 10 }}
                  barCategoryGap={18}
                  className="[&_.recharts-cartesian-axis-tick-value]:fill-gray-600 dark:[&_.recharts-cartesian-axis-tick-value]:fill-gray-600 [&_.recharts-cartesian-grid-vertical]:opacity-0"
                >
                  <defs>
                    <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={colors.sales} stopOpacity={0.95} />
                      <stop offset="100%" stopColor={colors.sales} stopOpacity={0.65} />
                    </linearGradient>
                    <linearGradient id="salesOutline" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={colors.salesLight} stopOpacity={0.95} />
                      <stop offset="100%" stopColor={colors.salesLight} stopOpacity={0.35} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgb(var(--muted))" strokeDasharray="4 8" vertical={false} />
                  <XAxis
                    dataKey="siteId"
                    axisLine={false}
                    tickLine={false}
                    tickMargin={16}
                    angle={xTickAngle}
                    textAnchor={xTickAngle !== 0 ? 'end' : 'middle'}
                    height={xTickHeight}
                    interval={xTickInterval}
                    tick={{ fontSize: responsiveFontSizes.xAxisLabel, fontWeight: 700, fill: 'rgb(var(--foreground))' }}
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
                  <Bar 
                    yAxisId="left" 
                    dataKey="salesAmt" 
                    name={`${currentPeriodLabel} Sales (Current)`} 
                    fill="url(#salesFill)"
                    barSize={barSize}
                    radius={[8, 8, 0, 0]}
                  >
                    <LabelList
                      dataKey="salesAmt"
                      content={(props) => (
                        <SalesFlatRowLabel
                          {...props}
                          mode="current"
                          centerShift={salesCenterShift}
                          fontSize={responsiveFontSizes.numberLabel}
                        />
                      )}
                    />
                  </Bar>
                  <Bar yAxisId="left" dataKey="lastYearSalesAmt" name={`${currentPeriodLabel} Sales (Last Year)`} fill="url(#salesOutline)" barSize={barSize} radius={[8, 8, 0, 0]}>
                    <LabelList
                      dataKey="lastYearSalesAmt"
                      content={(props) => (
                        <SalesFlatRowLabel
                          {...props}
                          mode="lastYear"
                          centerShift={salesCenterShift}
                          fontSize={responsiveFontSizes.numberLabel}
                        />
                      )}
                    />
                  </Bar>
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-2 shrink-0 flex justify-center">
            <div className="inline-flex rounded-full border border-[#e1e7f3] bg-white p-1 shadow-[0_8px_22px_rgba(17,31,70,0.05)]">
              {periodCarousel.map((key) => (
                <span
                  key={key}
                  className={cn(
                    'min-w-32 rounded-full px-5 py-2.5 text-center text-sm font-bold transition',
                    period === key
                      ? 'bg-[#1d63f2] text-white shadow-[0_8px_20px_rgba(29,99,242,0.35)]'
                      : 'text-[#1c2f69]'
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
}: {
  title: string;
  accent: 'blue' | 'orange';
  metricKey: 'sales';
  dashboard: SalesPerformanceDashboardType | null;
}) {
  const toneColorClass = accent === 'blue' ? 'text-[#1d63f2]' : 'text-[#ff5d14]';
  const toneBackgroundClass = accent === 'blue' ? 'bg-[#1460eb]' : 'bg-[#ff5b11]';
  const summary = dashboard?.[metricKey] ?? null;
  const isSalesMetric = metricKey === 'sales';

  const periods = ['wtd', 'mtd', 'qtd', 'ytd'] as const;

  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-200 bg-white dark:bg-gray-100 shadow-[0_14px_40px_rgba(15,23,42,0.05)] dark:shadow-[0_14px_40px_rgba(0,0,0,0.1)]">
      <div className={cn('px-6 py-1.5 text-center text-xs font-extrabold uppercase tracking-wide text-white sm:text-sm md:text-base xl:text-lg', toneBackgroundClass)}>
        {title}
      </div>
      <div className="grid grid-cols-1 divide-y divide-gray-200 dark:divide-gray-200 lg:grid-cols-3 lg:divide-x lg:divide-y-0">
        {periods.map((period) => {
          const item = summary?.[period] ?? null;
          const computedChange = item ? item.change : 0;
          const isPositive = item ? item.trend === 'UP' : false;
          const primaryValue = item
            ? isSalesMetric
              ? `$${formatShortNumber(item.current)}`
              : `${item.currentPercent > 0 ? '+' : ''}${item.currentPercent.toFixed(1)}%`
            : '--';
          const previousValue = item
            ? isSalesMetric
              ? `Prev: $${formatShortNumber(item.previous)}`
              : `Prev: ${item.previousPercent > 0 ? '+' : ''}${item.previousPercent.toFixed(1)}%`
            : 'Prev: --';

          return (
            <div key={period} className="flex min-h-[132px] flex-col items-center justify-between px-3 py-3 text-center lg:min-h-[140px] lg:px-4 lg:py-4">
              <div>
                <div className="text-xs font-bold uppercase tracking-wide text-gray-600 dark:text-gray-600 sm:text-sm md:text-base xl:text-lg">
                  {title.includes('Gross') ? `${periodLabels[period]} Gross Profit` : `${periodLabels[period]} Sales`}
                </div>
                <div className={cn('mt-2 text-xl font-black tracking-tight sm:text-2xl md:text-3xl xl:text-4xl', toneColorClass)}>
                  {primaryValue}
                </div>
                <div className="mt-2 text-xs font-semibold text-gray-600 dark:text-gray-600 md:text-sm xl:text-base">
                  {previousValue}
                </div>
              </div>

              <div className={cn('inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold sm:text-sm md:text-base', isPositive ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-400')}>
                {isPositive ? <PiArrowUpRight /> : <PiArrowDownRight />}
                <span>{item ? `${Math.abs(computedChange).toFixed(1)}%` : '--'}</span>
              </div>
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
  fontSize,
}: {
  x?: number | string;
  y?: number | string;
  value?: number | string;
  payload?: any;
  mode: 'current' | 'lastYear';
  centerShift?: number;
  fontSize?: number;
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
  const textWidth = Math.max(text.length * 6 + 8, 40);
  const isCurrent = mode === 'current';
  const yPosition = isCurrent ? 8 : 26; // Fixed Y position at top of chart for ALL sites
  const xAligned = isCurrent 
    ? px + (centerShift ?? 0)    // Current bar shifts right to center
    : px - (centerShift ?? 0);   // Previous bar shifts left to center
  const textColor = isCurrent ? '#14b8a6' : '#2dd4bf';
  const strokeColor = isCurrent ? '#0d7a6e' : '#1a9a8a';
  const fillColor = isCurrent ? '#f0fdf9' : '#f5fefe';
  const labelFontSize = fontSize ?? 13;
  const labelHeight = Math.max(labelFontSize + 6, 20);
  const labelY = labelHeight * 0.75;

  return (
    <g transform={`translate(${xAligned - textWidth / 2},${yPosition})`}>
      <rect width={textWidth} height={labelHeight} rx={6} fill={fillColor} fillOpacity={1} stroke={strokeColor} />
      <text x={textWidth / 2} y={labelY} textAnchor="middle" fontSize={labelFontSize} fontWeight="700" fill={textColor}>
        {text}
      </text>
    </g>
  );
}


