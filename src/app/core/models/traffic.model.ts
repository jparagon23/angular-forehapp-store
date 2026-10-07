/** Tráfico de la tienda (medición propia, anónima). Las tasas vienen en porcentaje (0-100). */
export interface TrafficReport {
  from: string;
  to: string;
  days: number;
  /** Sesiones con actividad en los últimos 5 minutos. */
  liveNow: number;
  current: TrafficTotals;
  previous: TrafficTotals;
  series: { date: string; visitors: number; sessions: number }[];
  funnel: { sessions: number; viewedProduct: number; addedToCart: number; reachedCheckout: number; purchased: number };
  topPages: { path: string; title: string | null; views: number; sessions: number }[];
  sources: TrafficShare[];
  devices: TrafficShare[];
}

export interface TrafficTotals {
  visitors: number;
  sessions: number;
  pageViews: number;
  avgDurationSeconds: number;
  pagesPerSession: number;
  /** Sesiones de una sola página y menos de 10 segundos. */
  bounceRate: number;
  conversionRate: number;
  /** Visitantes con más de una sesión en el período. */
  returningVisitors: number;
}

export interface TrafficShare { name: string; sessions: number; purchases: number }
