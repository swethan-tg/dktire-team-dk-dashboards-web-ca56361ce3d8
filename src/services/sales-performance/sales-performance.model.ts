import type {
  SalesPerformanceChartRow,
  SalesPerformanceResponse,
  SalesPerformancePeriod,
  SalesPerformanceSiteItem,
  SalesPerformanceMetric,
} from './sales-performance.interface';

export type SalesPerformancePeriodSummary = {
  current: number;
  previous: number;
  change: number;
  trend: 'UP' | 'DOWN';
  currentPercent: number;
  previousPercent: number;
};

export type SalesPerformanceDashboard = {
  sales: Record<SalesPerformancePeriod, SalesPerformancePeriodSummary>;
  grossProfit: Record<SalesPerformancePeriod, SalesPerformancePeriodSummary>;
  chartRows: SalesPerformanceChartRow[];
  chartSummary: {
    totalSalesPct: number;
    averageProfitPct: number;
  };
  source: SalesPerformanceResponse;
};

export function toSalesPerformanceSummary(
  metric: SalesPerformanceResponse['top_cards']['sales'][SalesPerformancePeriod]
): SalesPerformancePeriodSummary {
  return {
    current: metric.current,
    previous: metric.prev,
    change: metric.pct_change,
    trend: metric.trend,
    currentPercent: metric.current_pct,
    previousPercent: metric.prev_pct,
  };
}

function toGrossProfitSummary(
  grossMetric: SalesPerformanceResponse['top_cards']['gross_profit'][SalesPerformancePeriod],
  salesMetric: SalesPerformanceResponse['top_cards']['sales'][SalesPerformancePeriod]
): SalesPerformancePeriodSummary {
  const computedCurrentPct =
    salesMetric.current !== 0 ? (grossMetric.current / salesMetric.current) * 100 : 0;
  const computedPrevPct =
    salesMetric.prev !== 0 ? (grossMetric.prev / salesMetric.prev) * 100 : 0;

  const apiCurrentPct = grossMetric.current_pct;
  const apiPrevPct = grossMetric.prev_pct;

  const currentLooksInvalid =
    apiCurrentPct >= 99 && Math.abs(apiCurrentPct - computedCurrentPct) > 1;
  const prevLooksInvalid =
    apiPrevPct >= 99 && Math.abs(apiPrevPct - computedPrevPct) > 1;

  const currentPercent = currentLooksInvalid ? computedCurrentPct : apiCurrentPct;
  const previousPercent = prevLooksInvalid ? computedPrevPct : apiPrevPct;

  return {
    current: grossMetric.current,
    previous: grossMetric.prev,
    change: currentPercent - previousPercent,
    trend: currentPercent - previousPercent >= 0 ? 'UP' : 'DOWN',
    currentPercent,
    previousPercent,
  };
}

export function mapSalesPerformanceSiteItem(
  item: SalesPerformanceSiteItem,
  period: SalesPerformancePeriod
): SalesPerformanceChartRow {
  const value = item[period];

  return {
    siteId: item.site_id,
    salesAmt: value.current_sales_amt,
    lastYearSalesAmt: value.prev_sales_amt,
    salesPct: value.sales_pct,
    lastYearSalesPct: value.last_yr_sales_pct,
    profitPct: value.profit_pct,
    lastYearProfitPct: value.last_yr_profit_pct,
  };
}

export function buildSalesPerformanceDashboard(
  response: SalesPerformanceResponse,
  period: SalesPerformancePeriod
): SalesPerformanceDashboard {
  const chartRows = response.site_performance.map((item) =>
    mapSalesPerformanceSiteItem(item, period)
  );

  const selectedSites = response.site_performance.map((item) => item[period]);
  const totalSalesPct =
    selectedSites.reduce((sum, item) => sum + item.sales_pct, 0) /
    Math.max(selectedSites.length, 1);
  const averageProfitPct =
    selectedSites.reduce((sum, item) => sum + item.profit_pct, 0) /
    Math.max(selectedSites.length, 1);

  // Create safe WTD fallback with zeros
  const wtdFallback: SalesPerformanceMetric = {
    current: 0,
    prev: 0,
    pct_change: 0,
    trend: 'DOWN',
    current_pct: 0,
    prev_pct: 0,
  };

  return {
    sales: {
      wtd: response.top_cards.sales.wtd 
        ? toSalesPerformanceSummary(response.top_cards.sales.wtd)
        : toSalesPerformanceSummary(wtdFallback),
      mtd: toSalesPerformanceSummary(response.top_cards.sales.mtd),
      qtd: toSalesPerformanceSummary(response.top_cards.sales.qtd),
      ytd: toSalesPerformanceSummary(response.top_cards.sales.ytd),
    },
    grossProfit: {
      wtd: response.top_cards.gross_profit.wtd && response.top_cards.sales.wtd
        ? toGrossProfitSummary(response.top_cards.gross_profit.wtd, response.top_cards.sales.wtd)
        : toGrossProfitSummary(wtdFallback, wtdFallback),
      mtd: toGrossProfitSummary(response.top_cards.gross_profit.mtd, response.top_cards.sales.mtd),
      qtd: toGrossProfitSummary(response.top_cards.gross_profit.qtd, response.top_cards.sales.qtd),
      ytd: toGrossProfitSummary(response.top_cards.gross_profit.ytd, response.top_cards.sales.ytd),
    },
    chartRows,
    chartSummary: {
      totalSalesPct,
      averageProfitPct,
    },
    source: response,
  };
}