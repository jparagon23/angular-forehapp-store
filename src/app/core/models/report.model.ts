export interface ReportSummary {
  totalOrders: number;
  totalRevenue: number;
  averageTicket: number;
  cancelledOrders: number;
  totalReturns: number;
  totalRefunded: number;
}

export interface RevenuePoint {
  period: string;
  orderCount: number;
  revenue: number;
}

export interface TopProduct {
  productId: number;
  productTitle: string;
  variantSku: string;
  unitsSold: number;
  revenue: number;
}

export interface SellerSales {
  storeId: number;
  storeName: string;
  totalOrders: number;
  totalRevenue: number;
}

export type GroupBy = 'DAY' | 'WEEK' | 'MONTH';

export interface DateRange {
  from: string;
  to: string;
}
