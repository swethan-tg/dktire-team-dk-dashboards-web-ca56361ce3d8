import type { SalesPerformancePeriod } from '../sales-performance/sales-performance.interface';

export interface SalesmanMetric {
  current: number;
  prev: number;
  pct_change: number;
  trend: 'UP' | 'DOWN' | 'FLAT';
  current_pct: number;
  prev_pct: number;
}

export interface SalesmanPeriodMetrics {
  sales: Record<SalesPerformancePeriod, SalesmanMetric>;
  gross_profit: Record<SalesPerformancePeriod, SalesmanMetric>;
}

export interface SalesmanItem {
  salesman_id: string;
  salesman_name: string;
  current_sales: number;
  prior_sales: number;
  trend: 'UP' | 'DOWN' | 'FLAT';
}

export interface SalesmanPerformanceResponse {
  site_id: string;
  top_cards: {
    sales: Record<SalesPerformancePeriod, SalesmanMetric>;
    gross_profit: Record<SalesPerformancePeriod, SalesmanMetric>;
  };
  wtd_top_salesmen: SalesmanItem[];
  mtd_top_salesmen: SalesmanItem[];
  qtd_top_salesmen: SalesmanItem[];
  ytd_top_salesmen: SalesmanItem[];
}

export interface SalesmanChartRow {
  salesmanId: string;
  salesmanName: string;
  currentSales: number;
  previousSales: number;
  trend: 'UP' | 'DOWN' | 'FLAT';
}

export interface SalesmanDashboardTopCards {
  sales: Record<SalesPerformancePeriod, SalesmanMetric>;
  gross_profit: Record<SalesPerformancePeriod, SalesmanMetric>;
}

export type SalesmanPeriod = 'wtd' | 'mtd' | 'qtd' | 'ytd';
