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
  mtd: 'MTD',
  qtd: 'QTD',
  ytd: 'YTD',
};

const periodCarousel: SalesPerformancePeriod[] = ['mtd', 'qtd', 'ytd'];

const colors = {
  sales: '#1d63f2',
  salesLight: '#c5d8ff',
  profit: '#ff5d14',
  profitLight: '#0b8ea8',
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
  const [source, setSource] = useState<SalesPerformanceDashboardType['source'] | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      const siteIdA = parseInt(a.siteId ?? '0', 10);
      const siteIdB = parseInt(b.siteId ?? '0', 10);
      return siteIdA - siteIdB;
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
  const xTickHeight = chartRows.length > 16 ? 64 : 42;
  const barSize = useMemo(() => {
    // Fixed base size without screen scaling
    return chartRows.length > 24 ? 12 : chartRows.length > 16 ? 14 : 18;
  }, [chartRows.length]);
  const salesCenterShift = barSize / 2 + 2;

  return (
    <div className="h-screen overflow-hidden bg-white px-3 py-1 text-[--sales-text] sm:px-4 lg:px-5">
      <div className="mx-auto flex h-full w-full max-w-[1520px] flex-col gap-1.5">
        <header className="grid grid-cols-[1fr_auto_1fr] items-center px-1 py-1">
          <p className="text-base font-black tracking-tight text-[#0f1f54] sm:text-lg md:text-xl xl:text-2xl 2xl:text-3xl">DK TIRE</p>
          <h1 className="text-center text-sm font-extrabold uppercase tracking-[0.05em] text-[#122263] sm:text-base md:text-lg xl:text-xl 2xl:text-2xl">
            Sales Performance Dashboard
          </h1>
          <p className="justify-self-end inline-flex items-center gap-1.5 text-xs font-semibold text-[#1c2f69] md:text-sm xl:text-base">
            <PiInfo className="size-4 text-[#1d63f2]" />
            <span>The dashboard data is as of till yesterday</span>
          </p>
        </header>

        {error ? (
          <div className="rounded-3xl border border-rose-200 bg-white p-6 text-sm text-rose-700 shadow-[0_12px_35px_rgba(17,31,70,0.06)]">
            {error}
          </div>
        ) : null}

        <div className="grid gap-2 xl:grid-cols-2 -mx-3 sm:-mx-4 lg:-mx-5">
          <SummaryPanel
            title="Sales Performance"
            accent="blue"
            metricKey="sales"
            dashboard={dashboard}
          />
          <SummaryPanel
            title="Gross Profit Performance"
            accent="orange"
            metricKey="grossProfit"
            dashboard={dashboard}
          />
        </div>

        <section className="min-h-0 flex flex-1 flex-col rounded-xl border border-[#e7edf7] bg-white p-3 shadow-[0_14px_40px_rgba(15,23,42,0.05)] sm:p-4 lg:p-5 -mx-3 sm:-mx-4 lg:-mx-5">
          <div>
            <h2 className="text-lg font-extrabold tracking-tight text-[#122263] sm:text-xl md:text-2xl xl:text-3xl">
              {currentPeriodLabel} Sales by Site{' '}
              <span className="text-sm font-semibold text-[#41507a] sm:text-base md:text-lg xl:text-xl">(vs Last Year {currentPeriodLabel})</span>
            </h2>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-[#29407c] sm:text-sm md:text-base">
              <LegendDot color={colors.sales} label={`${currentPeriodLabel} Sales (Current)`} solid />
              <LegendDot color={colors.salesLight} label={`${currentPeriodLabel} Sales (Last Year)`} dashed />
              <LegendDot color={colors.profit} label={`Profit % (${currentPeriodLabel}) (Current)`} solid line />
              <LegendDot color={colors.profitLight} label={`Profit % (${currentPeriodLabel}) (Last Year)`} dashed line />
            </div>
          </div>

          <div className="mt-3 min-h-0 flex-1 rounded-lg bg-white pb-1">
            <div className="h-full w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={chartRows}
                  margin={{ top: 44, right: 18, bottom: 14, left: 10 }}
                  barCategoryGap={18}
                  className="[&_.recharts-cartesian-axis-tick-value]:fill-[#29407c] [&_.recharts-cartesian-grid-vertical]:opacity-0"
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
                  <CartesianGrid stroke="#e7edf7" strokeDasharray="4 8" vertical={false} />
                  <XAxis
                    dataKey="siteId"
                    axisLine={false}
                    tickLine={false}
                    tickMargin={14}
                    angle={xTickAngle}
                    textAnchor={xTickAngle !== 0 ? 'end' : 'middle'}
                    height={xTickHeight}
                    interval={xTickInterval}
                    tick={{ fontSize: 13, fontWeight: 700, fill: '#122263' }}
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
                  <Line
                    yAxisId="right"
                    type="linear"
                    dataKey={(row: { lastYearProfitPct?: number; profitPct?: number }) =>
                      row.lastYearProfitPct ?? row.profitPct ?? 0
                    }
                    name={`Profit % (${currentPeriodLabel}) (Last Year)`}
                    stroke={colors.profitLight}
                    strokeWidth={4.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray="6 6"
                    dot={{ r: 7, fill: '#fff', stroke: colors.profitLight, strokeWidth: 2.4 }}
                    activeDot={false}
                    isAnimationActive={false}
                    connectNulls
                    opacity={0.9}
                  />
                  <Bar yAxisId="left" dataKey="salesAmt" name={`${currentPeriodLabel} Sales (Current)`} fill="url(#salesFill)" barSize={barSize} radius={[8, 8, 0, 0]}>
                    <LabelList
                      dataKey="salesAmt"
                      content={(props) => (
                        <SalesFlatRowLabel
                          {...props}
                          mode="current"
                          centerShift={salesCenterShift}
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
                        />
                      )}
                    />
                  </Bar>
                  <Line
                    yAxisId="right"
                    type="linear"
                    dataKey="profitPct"
                    name={`Profit % (${currentPeriodLabel}) (Current)`}
                    stroke={colors.profit}
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    dot={{ r: 5, fill: '#fff', stroke: colors.profit, strokeWidth: 2 }}
                    activeDot={false}
                    isAnimationActive={false}
                    connectNulls
                  >
                    <LabelList
                      dataKey="profitPct"
                      content={(props) => (
                        <LineValueLabel
                          {...props}
                          mode="current"
                        />
                      )}
                    />
                  </Line>
                  <Line
                    yAxisId="right"
                    type="linear"
                    dataKey={(row: { lastYearProfitPct?: number; profitPct?: number }) =>
                      row.lastYearProfitPct ?? row.profitPct ?? 0
                    }
                    name={`Profit % (${currentPeriodLabel}) (Last Year) Labels`}
                    stroke="transparent"
                    strokeWidth={0}
                    dot={false}
                    activeDot={false}
                    isAnimationActive={false}
                    connectNulls
                    legendType="none"
                  >
                    <LabelList
                      dataKey={(row: { lastYearProfitPct?: number; profitPct?: number }) =>
                        row.lastYearProfitPct ?? row.profitPct ?? 0
                      }
                      content={(props) => (
                        <LineValueLabel
                          {...props}
                          mode="lastYear"
                        />
                      )}
                    />
                  </Line>
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
  metricKey: 'sales' | 'grossProfit';
  dashboard: SalesPerformanceDashboardType | null;
}) {
  const toneColorClass = accent === 'blue' ? 'text-[#1d63f2]' : 'text-[#ff5d14]';
  const toneBackgroundClass = accent === 'blue' ? 'bg-[#1460eb]' : 'bg-[#ff5b11]';
  const summary = dashboard?.[metricKey] ?? null;
  const isSalesMetric = metricKey === 'sales';

  const periods = ['mtd', 'qtd', 'ytd'] as const;

  return (
    <section className="overflow-hidden rounded-xl border border-[#e7edf7] bg-white shadow-[0_14px_40px_rgba(15,23,42,0.05)]">
      <div className={cn('px-6 py-1.5 text-center text-xs font-extrabold uppercase tracking-wide text-white sm:text-sm md:text-base xl:text-lg', toneBackgroundClass)}>
        {title}
      </div>
      <div className="grid grid-cols-1 divide-y divide-[#eef2f9] lg:grid-cols-3 lg:divide-x lg:divide-y-0">
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
                <div className="text-xs font-bold uppercase tracking-wide text-[#18275d] sm:text-sm md:text-base xl:text-lg">
                  {title.includes('Gross') ? `${periodLabels[period]} Gross Profit` : `${periodLabels[period]} Sales`}
                </div>
                <div className={cn('mt-2 text-xl font-black tracking-tight sm:text-2xl md:text-3xl xl:text-4xl', toneColorClass)}>
                  {primaryValue}
                </div>
                <div className="mt-2 text-xs font-semibold text-[#2e457e] md:text-sm xl:text-base">
                  {previousValue}
                </div>
              </div>

              <div className={cn('inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold sm:text-sm md:text-base', isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600')}>
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
}: {
  x?: number | string;
  y?: number | string;
  value?: number | string;
  payload?: any;
  mode: 'current' | 'lastYear';
  centerShift?: number;
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
  const textColor = isCurrent ? '#0f46c8' : '#5f7194';
  const strokeColor = isCurrent ? '#cfe0ff' : '#d7e0ef';
  const fillColor = isCurrent ? '#f7faff' : '#fbfcff';

  return (
    <g transform={`translate(${xAligned - textWidth / 2},${yPosition})`}>
      <rect width={textWidth} height={16} rx={5} fill={fillColor} fillOpacity={1} stroke={strokeColor} />
      <text x={textWidth / 2} y={12} textAnchor="middle" fontSize="10" fontWeight="700" fill={textColor}>
        {text}
      </text>
    </g>
  );
}


