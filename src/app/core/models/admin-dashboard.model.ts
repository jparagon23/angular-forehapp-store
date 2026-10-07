/** Inicio del admin. "Ventas" = pedidos no cancelados, pagados o contraentrega. */
export interface AdminDashboard {
  period: { from: string; to: string; days: number };
  kpis: {
    revenue: Metric;
    orders: Metric;
    averageTicket: Metric;
    /** Precio de venta − costo, en las líneas vendidas que tienen costo. */
    profit: Metric;
    soldItems: number;
    itemsWithoutCost: number;
    buyers: Metric;
    newUsers: Metric;
  };
  /** Trabajo pendiente ahora mismo (no depende del período). */
  operations: {
    awaitingPayment: number;
    awaitingPaymentAmount: number;
    toPrepare: number;
    toShip: number;
    inTransit: number;
    balancesDue: number;
    balancesDueAmount: number;
  };
  catalog: { activeProducts: number; outOfStockProducts: number; variantsWithoutCost: number; lowOwnStock: number };
  reviews: { average: number | null; approved: number; pending: number };
  series: { date: string; orders: number; revenue: number }[];
  topProducts: { productId: number; title: string; units: number; revenue: number }[];
  recentOrders: {
    orderId: number;
    buyerName: string | null;
    createdAt: string;
    total: number;
    status: string;
    paymentMethod: string;
    channel: string | null;
    stores: string | null;
  }[];
  supplierSync: {
    status: string;
    startedAt: string;
    disabled: number;
    reenabled: number;
    costUpdates: number;
    marginAlerts: number;
    abortReason: string | null;
  } | null;
}

export interface Metric { value: number; previous: number }
