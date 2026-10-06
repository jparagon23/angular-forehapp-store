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
