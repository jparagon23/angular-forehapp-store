// Buyer-facing API types
export type OrderApiStatus = 'PENDING' | 'PAID' | 'CANCELLED';

export interface OrderItemResponse {
  itemId: number;
  variantId: number;
  sku: string;
  productTitle: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface OrderSellerGroup {
  groupId: number;
  sellerId: number;
  sellerName: string;
  status: OrderApiStatus;
  subtotal: number;
  items: OrderItemResponse[];
}

export interface OrderResponse {
  orderId: number;
  status: OrderApiStatus;
  total: number;
  shippingAddress: string;
  shippingCity: string;
  shippingCountry: string;
  createdAt: string;
  checkoutUrl: string | null;
  sellerGroups: OrderSellerGroup[];
}

// Admin/seller types
export type OrderStatus = 'Pendiente' | 'Enviado' | 'Entregado' | 'Cancelado';

export interface Order {
  id: string;
  customer: string;
  date: string;
  items: number;
  total: string;
  status: OrderStatus;
}
