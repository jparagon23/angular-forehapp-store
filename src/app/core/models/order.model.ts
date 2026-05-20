// ── Shared ──────────────────────────────────────────────────────────────────

export type PaymentMethod = 'MERCADO_PAGO' | 'CASH' | 'TRANSFER' | 'CASH_ON_DELIVERY';
export type PaymentStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'REFUNDED';
export type OrderApiStatus = 'PENDING' | 'PAYMENT_CONFIRMED' | 'PAID' | 'CANCELLED';
export type SellerGroupStatus = 'PENDING' | 'PREPARING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export interface OrderItemResponse {
  itemId: number;
  variantId: number;
  sku: string;
  productTitle: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
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
  sellerId: number;
  sellerName: string;
  status: SellerGroupStatus;
  subtotal: number;
  trackingNumber: string | null;
  shippedAt: string | null;
  items: OrderItemResponse[];
}

export interface OrderResponse {
  orderId: number;
  paymentStatus: OrderApiStatus;
  paymentMethod: PaymentMethod;
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
  shippingAddress: string;
  shippingCity: string;
  shippingCountry: string;
  status: SellerGroupStatus;
  subtotal: number;
  trackingNumber: string | null;
  preparedAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  items: OrderItemResponse[];
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
