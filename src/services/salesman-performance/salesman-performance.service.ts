import type { SalesmanPerformanceResponse } from './salesman-performance.interface';

const SALESMAN_PERFORMANCE_URL = 'https://b2bdashboards.tiredev.net:7071/dashboard/salesman-performance';

export async function fetchSalesmanPerformance(siteId?: string | null): Promise<SalesmanPerformanceResponse> {
  const params = new URLSearchParams();
  
  if (siteId) {
    params.append('site_id', siteId);
  }

  const url = params.toString() ? `${SALESMAN_PERFORMANCE_URL}?${params.toString()}` : SALESMAN_PERFORMANCE_URL;

  const response = await fetch(url);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Salesman Performance API Error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data = (await response.json()) as SalesmanPerformanceResponse;
  console.log('Salesman Performance API Response:', data);
  
  return data;
}
