import type {
  SalesmanChartRow,
  SalesmanPerformanceResponse,
  SalesmanPeriod,
} from './salesman-performance.interface';

export type { SalesmanPeriod };

export interface SalesmanDashboard {
  topCards: SalesmanPerformanceResponse['top_cards'];
  chartRows: SalesmanChartRow[];
  source: SalesmanPerformanceResponse;
}

export function mapSalesmanItem(
  item: SalesmanPerformanceResponse['wtd_top_salesmen'][0]
): SalesmanChartRow {
  return {
    salesmanId: item.salesman_id,
    salesmanName: item.salesman_name,
    currentSales: item.current_sales,
    previousSales: item.prior_sales,
    trend: item.trend,
  };
}

export function buildSalesmanDashboard(
  response: SalesmanPerformanceResponse,
  period: SalesmanPeriod
): SalesmanDashboard {
  // Get the salesmen for the selected period
  let salesmen: typeof response.wtd_top_salesmen = [];
  
  switch (period) {
    case 'wtd':
      salesmen = response.wtd_top_salesmen;
      break;
    case 'mtd':
      salesmen = response.mtd_top_salesmen;
      break;
    case 'qtd':
      salesmen = response.qtd_top_salesmen;
      break;
    case 'ytd':
      salesmen = response.ytd_top_salesmen;
      break;
  }

  // Map and sort by current sales (highest to lowest)
  const chartRows = salesmen
    .map(mapSalesmanItem)
    .sort((a, b) => b.currentSales - a.currentSales);

  return {
    topCards: response.top_cards,
    chartRows,
    source: response,
  };
}
