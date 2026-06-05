// ── Shared ──────────────────────────────────────────────────────────────────

export type PaymentMethod = 'MERCADO_PAGO' | 'CASH' | 'TRANSFER' | 'CASH_ON_DELIVERY';
export type PaymentStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'REFUNDED';
export type OrderApiStatus = 'PENDING' | 'PAYMENT_CONFIRMED' | 'PAID' | 'CANCELLED';
export type SellerGroupStatus = 'PENDING' | 'PREPARING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export interface VariantAttributeDto {
  attribute: string;
  value: string;
}

export interface OrderItemResponse {
  itemId: number;
  variantId: number;
  sku: string | null;
  productTitle: string;
  attributes: VariantAttributeDto[];
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
  trackingNumber: string | null;
  preparedAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  items: OrderItemResponse[];
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
}

export interface GuestEstimateRequest {
  cityId: number;
  items: GuestOrderItem[];
}

export interface CreateAccountRequest {
  email: string;
  password: string;
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
