// ── Shared ──────────────────────────────────────────────────────────────────

export type PaymentMethod = 'MERCADO_PAGO' | 'CASH' | 'TRANSFER' | 'CASH_ON_DELIVERY';
export type PaymentStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'REFUNDED';
export type OrderApiStatus = 'PENDING' | 'PAYMENT_CONFIRMED' | 'PAID' | 'CANCELLED';
export type SellerGroupStatus = 'PENDING' | 'PREPARING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
/** ONLINE: lo hizo el comprador. ASSISTED: lo registró el seller por el cliente (WhatsApp, etc.). */
export type OrderChannel = 'ONLINE' | 'ASSISTED';

export interface VariantAttributeDto {
  attribute: string;
  value: string;
}

export interface OrderItemResponse {
  itemId: number;
  variantId: number;
  sku: string | null;
  productTitle: string;
  categoryName: string;
  brandName: string;
  lineName: string | null;
  attributes: VariantAttributeDto[];
  quantity: number;
  unitPrice: number;
  subtotal: number;
  unitCost: number | null;
  totalCost: number | null;
  unitMargin: number | null;
  /** Solo vista del seller: unidades a pedir al proveedor (null para el comprador). */
  dropshipQuantity?: number | null;
}

// ── Buyer-facing ─────────────────────────────────────────────────────────────

export interface OrderSummaryDto {
  orderId: number;
  paymentStatus: OrderApiStatus;
  shippingStatus: SellerGroupStatus;
  paymentMethod: PaymentMethod;
  total: number;
  createdAt: string;
}

export interface OrderSellerGroup {
  groupId: number;
  storeId: number;
  storeName: string;
  status: SellerGroupStatus;
  subtotal: number;
  shippingCost: number;
  trackingNumber: string | null;
  shippedAt: string | null;
  items: OrderItemResponse[];
}

export interface OrderResponse {
  orderId: number;
  paymentStatus: OrderApiStatus;
  paymentMethod: PaymentMethod;
  subtotal: number;
  shippingTotal: number;
  couponCode: string | null;
  couponDiscount: number;
  mercadoPagoSurcharge: number;
  total: number;
  shippingAddress: string;
  shippingCity: string;
  shippingCountry: string;
  createdAt: string;
  checkoutUrl: string | null;
  sellerGroups: OrderSellerGroup[];
}

// ── Seller-facing ─────────────────────────────────────────────────────────────

export interface SellerOrderGroupDetail {
  groupId: number;
  orderId: number;
  buyerName: string;
  buyerPhone: string | null;
  buyerEmail: string;
  shippingAddress: string;
  shippingCity: string;
  shippingCountry: string;
  status: SellerGroupStatus;
  paymentMethod: PaymentMethod;
  orderPaymentStatus: OrderApiStatus;
  subtotal: number;
  shippingCost: number;
  orderTotal: number;
  couponCode: string | null;
  couponDiscount: number | null;
  trackingNumber: string | null;
  preparedAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  shippingCostWaived: number | null;
  shippingRemovedAt: string | null;
  shippingRemovedReason: string | null;
  items: OrderItemResponse[];
  totalCost: number | null;
  totalMargin: number | null;
  marginPercent: number | null;
  channel?: OrderChannel;
  /** Unidades del grupo a pedir al proveedor; 0 = todo sale de bodega. */
  dropshipUnits?: number;
  /** Tras editar un pedido ya pagado: positivo = el cliente debe, negativo = saldo a favor del cliente. */
  balanceDue?: number | null;
  /** Última vez que el seller cambió los productos (null = nunca). */
  itemsEditedAt?: string | null;
}

// ── Edición de productos de un pedido (seller) ─────────────────────────────────

/** Una línea del pedido tal como debe quedar: con itemId se conserva/cambia, sin itemId se agrega. */
export interface EditOrderItemLine {
  itemId?: number;
  variantId: number;
  quantity: number;
  unitPrice: number;
}

export interface EditOrderItemsResult {
  orderId: number;
  groupId: number;
  groupSubtotal: number;
  orderTotalBefore: number;
  orderTotal: number;
  /** Solo pedidos pagados: positivo = por cobrar, negativo = saldo a favor; null = sin diferencia. */
  balanceDue: number | null;
  /** Link nuevo de MercadoPago si el pedido no estaba pagado y cambió el total. */
  paymentUrl: string | null;
}

export type OrderItemChangeType = 'REPLACED' | 'UPDATED' | 'ADDED' | 'REMOVED';

export interface OrderItemChange {
  id: number;
  editId: string;
  type: OrderItemChangeType;
  oldLabel: string | null;
  oldQuantity: number | null;
  oldUnitPrice: number | null;
  newLabel: string | null;
  newQuantity: number | null;
  newUnitPrice: number | null;
  reason: string;
  orderTotalBefore: number;
  orderTotalAfter: number;
  changedAt: string;
}

// ── Guest checkout ────────────────────────────────────────────────────────────

export interface GuestOrderItem {
  variantId: number;
  quantity: number;
}

export interface GuestOrderRequest {
  name: string;
  lastname: string;
  email: string;
  phone: string;
  shippingAddress: string;
  shippingCityId: number;
  shippingComplement?: string;
  shippingReference?: string;
  items: GuestOrderItem[];
  paymentMethod: PaymentMethod;
  couponCode?: string;
  couponStoreId?: number | null;
  referralCode?: string;
}

export interface GuestEstimateRequest {
  cityId: number;
  items: GuestOrderItem[];
}

export interface CreateAccountRequest {
  email: string;
  password: string;
}

/** La cuenta queda pendiente: se envía un código y los pedidos se vinculan al verificarlo. */
export interface CreateAccountResponse {
  userId: number;
  message: string;
}

// ── Pedidos asistidos (los registra el seller por el cliente) ────────────────

export interface AssistedOrderRequest {
  email: string;
  name: string;
  lastname: string;
  phone: string;
  shippingAddress: string;
  shippingCityId: number;
  shippingComplement?: string;
  shippingReference?: string;
  items: GuestOrderItem[];
  paymentMethod: PaymentMethod;
  /** Solo con CASH o TRANSFER: el pedido nace pagado. */
  alreadyPaid: boolean;
  /** El cliente autorizó el uso de sus datos. Obligatorio. */
  dataConsent: boolean;
  /** Opcional; se aplica sobre los productos y el envío de la tienda (ej. envío gratis). */
  couponCode?: string;
}

export interface AssistedCustomer {
  registered: boolean;
  /** Nombre recortado ("Juan P."); null si no tiene cuenta. */
  displayName: string | null;
}

// ── Admin panel (legacy mock) ─────────────────────────────────────────────────

export type OrderStatus = 'Pendiente' | 'Enviado' | 'Entregado' | 'Cancelado';

export interface Order {
  id: string;
  customer: string;
  date: string;
  items: number;
  total: string;
  status: OrderStatus;
}
