import type { SalesPerformanceResponse } from './sales-performance.interface';

const SALES_PERFORMANCE_URL =
  'https://b2bdashboards.tiredev.net:7071/dashboard/sales-performance';

export async function fetchSalesPerformance(siteId?: string | null) {
  const params = new URLSearchParams();
  
  if (siteId) {
    params.append('site_id', siteId);
  }
  
  const url = params.toString() ? `${SALES_PERFORMANCE_URL}?${params.toString()}` : SALES_PERFORMANCE_URL;
  
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`API Error ${response.status}:`, errorText);
    throw new Error(`Request failed with status ${response.status}: ${errorText}`);
  }

  const data = (await response.json()) as SalesPerformanceResponse;
  
  // Log WTD data for debugging
  console.log('API Response - WTD Data:', {
    gross_profit_top: data.top_cards?.gross_profit?.wtd,
    site_0_wtd: data.site_performance?.[0]?.wtd,
  });
  
  return data;
}