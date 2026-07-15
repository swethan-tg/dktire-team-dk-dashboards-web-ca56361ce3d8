export type SalesPerformancePeriod = 'mtd' | 'qtd' | 'ytd';

export type SalesPerformanceMetric = {
  current: number;
  prev: number;
  pct_change: number;
  trend: 'UP' | 'DOWN';
  current_pct: number;
  prev_pct: number;
};

export type SalesPerformanceSiteMetric = {
  sales_amt: number;
  profit_pct: number;
  sales_pct: number;
  last_yr_sales_pct: number;
  last_yr_profit_pct: number;
};

export type SalesPerformanceSiteItem = {
  site_id: string;
  mtd: SalesPerformanceSiteMetric;
  qtd: SalesPerformanceSiteMetric;
  ytd: SalesPerformanceSiteMetric;
};

export type SalesPerformanceResponse = {
  top_cards: {
    sales: Record<SalesPerformancePeriod, SalesPerformanceMetric>;
    gross_profit: Record<SalesPerformancePeriod, SalesPerformanceMetric>;
  };
  site_performance: SalesPerformanceSiteItem[];
};

export type SalesPerformanceChartRow = {
  siteId: string;
  salesPct: number;
  lastYearSalesPct: number;
  profitPct: number;
  lastYearProfitPct: number;
};