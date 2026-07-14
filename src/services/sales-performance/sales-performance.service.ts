import type { SalesPerformanceResponse } from './sales-performance.interface';

const SALES_PERFORMANCE_URL =
  'https://b2bdashboards.tiredev.net:7071/dashboard/sales-performance';

export async function fetchSalesPerformance() {
  const response = await fetch(SALES_PERFORMANCE_URL, {
    headers: {
      Accept: 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return (await response.json()) as SalesPerformanceResponse;
}