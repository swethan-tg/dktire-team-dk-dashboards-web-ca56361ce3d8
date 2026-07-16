export type SalesPerformancePeriod = 'wtd' | 'mtd' | 'qtd' | 'ytd';

export type SalesPerformanceMetric = {
  current: number;
  prev: number;
  pct_change: number;
  trend: 'UP' | 'DOWN';
  current_pct: number;
  prev_pct: number;
};

export type SalesPerformanceSiteMetric = {
  current_sales_amt: number;
  prev_sales_amt: number;
  gross_profit: number;
  prev_gross_profit: number;
  profit_pct: number;
  sales_pct: number;
  last_yr_sales_pct: number;
  last_yr_profit_pct: number;
};

export type SalesPerformanceSiteItem = {
  site_id: string;
  wtd?: SalesPerformanceSiteMetric;
  mtd: SalesPerformanceSiteMetric;
  qtd: SalesPerformanceSiteMetric;
  ytd: SalesPerformanceSiteMetric;
};

export type SalesPerformanceResponse = {
  top_cards: {
    sales: Record<SalesPerformancePeriod, SalesPerformanceMetric> & { wtd?: SalesPerformanceMetric };
    gross_profit: Record<SalesPerformancePeriod, SalesPerformanceMetric> & { wtd?: SalesPerformanceMetric };
  };
  site_performance: SalesPerformanceSiteItem[];
};

export type SalesPerformanceChartRow = {
  siteId: string;
  salesAmt: number;
  lastYearSalesAmt?: number;
  salesPct: number;
  lastYearSalesPct: number;
  profitPct: number;
  lastYearProfitPct: number;
};