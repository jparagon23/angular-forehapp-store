export type SyncMode = 'PREVIEW' | 'APPLY';
export type SupplierLinkStatus = 'SUGGESTED' | 'CONFIRMED' | 'REJECTED' | 'NOT_SUPPLIED';
/** Filtro de la lista de parejas: los estados más las variantes sin pareja. */
export type SupplierLinkFilter = SupplierLinkStatus | 'UNLINKED';
export type SyncRunStatus = 'PREVIEW' | 'APPLIED' | 'ABORTED';
export type SyncEventType =
  | 'DISABLED' | 'REENABLED' | 'RELEASED' | 'COST_UPDATED'
  | 'BROKEN_LINK' | 'MARGIN_ALERT' | 'ORDER_AT_RISK';

export interface SyncConfig {
  supplier: string;
  enabled: boolean;
  mode: SyncMode;
}

export interface SupplierItem {
  id: number;
  name: string;
  brand: string | null;
  category: string | null;
  price: number | null;
  outOfStock: boolean;
  lastSeenAt: string;
}

export interface SupplierLink {
  /** null para variantes sin pareja (filtro UNLINKED). */
  linkId: number | null;
  status: SupplierLinkStatus | null;
  /** Similitud del emparejador (0–1); null si la pareja la hizo el seller. */
  score: number | null;
  /** true = la sincronización tiene la variante en stock 0 ahora. */
  disabledBySync: boolean;
  variant: {
    variantId: number;
    productId: number;
    productTitle: string;
    brand: string | null;
    sku: string | null;
    attributes: string | null;
    active: boolean;
    stock: number;
    price: number;
  };
  supplierItem: SupplierItem | null;
  /** (precio venta − precio proveedor) / precio venta × 100. */
  marginPercent: number | null;
}

export interface SyncRun {
  id: number;
  storeId: number;
  supplier: string;
  mode: SyncMode;
  status: SyncRunStatus;
  abortReason: string | null;
  supplierItems: number;
  supplierOutOfStock: number;
  confirmedLinks: number;
  disabled: number;
  reenabled: number;
  costUpdates: number;
  brokenLinks: number;
  marginAlerts: number;
  ordersAtRisk: number;
  startedAt: string;
  finishedAt: string | null;
}

export interface SyncEvent {
  id: number;
  type: SyncEventType;
  variantId: number | null;
  productId: number | null;
  productTitle: string | null;
  variantLabel: string | null;
  supplierItemName: string | null;
  oldValue: string | null;
  newValue: string | null;
  detail: string | null;
  /** true = viene de una pareja sin confirmar. */
  unconfirmed: boolean;
}
