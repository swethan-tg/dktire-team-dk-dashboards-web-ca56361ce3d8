import type { SalesPerformanceResponse } from './sales-performance.interface';

const SALES_PERFORMANCE_URL =
  'https://b2bdashboards.tiredev.net:7071/dashboard/sales-performance';

// Mock data for testing/fallback
const MOCK_RESPONSE: SalesPerformanceResponse = {
  top_cards: {
    sales: {
      wtd: { current: 1250000, prev: 950000, pct_change: 31.6, trend: 'UP', current_pct: 45, prev_pct: 42 },
      mtd: { current: 6372000, prev: 5000000, pct_change: 27.4, trend: 'UP', current_pct: 48, prev_pct: 45 },
      qtd: { current: 18500000, prev: 16200000, pct_change: 14.2, trend: 'UP', current_pct: 50, prev_pct: 48 },
      ytd: { current: 42100000, prev: 38500000, pct_change: 9.4, trend: 'UP', current_pct: 52, prev_pct: 50 },
    },
    gross_profit: {
      wtd: { current: 350000, prev: 280000, pct_change: 25.0, trend: 'UP', current_pct: 28, prev_pct: 26 },
      mtd: { current: 1530000, prev: 1200000, pct_change: 27.5, trend: 'UP', current_pct: 24, prev_pct: 22 },
      qtd: { current: 4440000, prev: 3890000, pct_change: 14.1, trend: 'UP', current_pct: 24, prev_pct: 23 },
      ytd: { current: 10100000, prev: 9200000, pct_change: 9.8, trend: 'UP', current_pct: 24, prev_pct: 23 },
    },
  },
  site_performance: [
    {
      site_id: '8001',
      wtd: {
        current_sales_amt: 350000,
        prev_sales_amt: 280000,
        gross_profit: 98000,
        prev_gross_profit: 78000,
        profit_pct: 28,
        sales_pct: 28,
        last_yr_sales_pct: 29,
        last_yr_profit_pct: 27,
      },
      mtd: {
        current_sales_amt: 1353000,
        prev_sales_amt: 1871000,
        gross_profit: 325000,
        prev_gross_profit: 412000,
        profit_pct: 24,
        sales_pct: 21,
        last_yr_sales_pct: 37,
        last_yr_profit_pct: 22,
      },
      qtd: {
        current_sales_amt: 4200000,
        prev_sales_amt: 3800000,
        gross_profit: 1008000,
        prev_gross_profit: 874000,
        profit_pct: 24,
        sales_pct: 23,
        last_yr_sales_pct: 23,
        last_yr_profit_pct: 23,
      },
      ytd: {
        current_sales_amt: 9800000,
        prev_sales_amt: 9100000,
        gross_profit: 2352000,
        prev_gross_profit: 2093000,
        profit_pct: 24,
        sales_pct: 23,
        last_yr_sales_pct: 23,
        last_yr_profit_pct: 23,
      },
    },
    {
      site_id: '8002',
      wtd: {
        current_sales_amt: 280000,
        prev_sales_amt: 220000,
        gross_profit: 70000,
        prev_gross_profit: 55000,
        profit_pct: 25,
        sales_pct: 22,
        last_yr_sales_pct: 23,
        last_yr_profit_pct: 25,
      },
      mtd: {
        current_sales_amt: 1100000,
        prev_sales_amt: 950000,
        gross_profit: 264000,
        prev_gross_profit: 228000,
        profit_pct: 24,
        sales_pct: 17,
        last_yr_sales_pct: 19,
        last_yr_profit_pct: 24,
      },
      qtd: {
        current_sales_amt: 3200000,
        prev_sales_amt: 2950000,
        gross_profit: 768000,
        prev_gross_profit: 708000,
        profit_pct: 24,
        sales_pct: 17,
        last_yr_sales_pct: 18,
        last_yr_profit_pct: 24,
      },
      ytd: {
        current_sales_amt: 7400000,
        prev_sales_amt: 7000000,
        gross_profit: 1776000,
        prev_gross_profit: 1610000,
        profit_pct: 24,
        sales_pct: 18,
        last_yr_sales_pct: 18,
        last_yr_profit_pct: 24,
      },
    },
    {
      site_id: '8003',
      wtd: {
        current_sales_amt: 220000,
        prev_sales_amt: 190000,
        gross_profit: 55000,
        prev_gross_profit: 47500,
        profit_pct: 25,
        sales_pct: 18,
        last_yr_sales_pct: 20,
        last_yr_profit_pct: 25,
      },
      mtd: {
        current_sales_amt: 900000,
        prev_sales_amt: 820000,
        gross_profit: 216000,
        prev_gross_profit: 197000,
        profit_pct: 24,
        sales_pct: 14,
        last_yr_sales_pct: 16,
        last_yr_profit_pct: 24,
      },
      qtd: {
        current_sales_amt: 2600000,
        prev_sales_amt: 2450000,
        gross_profit: 624000,
        prev_gross_profit: 588000,
        profit_pct: 24,
        sales_pct: 14,
        last_yr_sales_pct: 15,
        last_yr_profit_pct: 24,
      },
      ytd: {
        current_sales_amt: 6100000,
        prev_sales_amt: 5800000,
        gross_profit: 1464000,
        prev_gross_profit: 1334000,
        profit_pct: 24,
        sales_pct: 15,
        last_yr_sales_pct: 15,
        last_yr_profit_pct: 24,
      },
    },
  ],
};

export async function fetchSalesPerformance() {
  try {
    // Build query parameters
    const params = new URLSearchParams();
    
    // Add default date range for the current request
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    const endDate = today;
    
    params.append('start_date', startDate.toISOString().split('T')[0]);
    params.append('end_date', endDate.toISOString().split('T')[0]);
    
    const url = `${SALES_PERFORMANCE_URL}?${params.toString()}`;
    
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      console.warn(`API returned status ${response.status}, using mock data for testing`);
      return MOCK_RESPONSE;
    }

    return (await response.json()) as SalesPerformanceResponse;
  } catch (error) {
    console.warn('Failed to fetch sales performance data, using mock data:', error);
    return MOCK_RESPONSE;
  }
}