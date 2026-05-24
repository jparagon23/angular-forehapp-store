export interface LowStockItem {
  variantId: number;
  productId: number;
  productTitle: string;
  sku: string | null;
  stock: number;
}

export interface ReportSummary {
  totalOrders: number;
  totalRevenue: number;
  averageTicket: number;
  pendingToShip: number;
  inTransit: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalReturns: number;
  totalRefunded: number;
  lowStockCount: number;
  lowStockItems: LowStockItem[];
}

export interface RevenuePoint {
  period: string;
  orderCount: number;
  revenue: number;
}

export interface TopProduct {
  productId: number;
  productTitle: string;
  variantSku: string | null;
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
