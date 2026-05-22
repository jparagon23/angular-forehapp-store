export interface CartItemResponse {
  itemId: number;
  variantId: number;
  sku: string;
  productTitle: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  priceChanged: boolean;
  previousPrice: number | null;
  thumbnailUrl?: string;
}

export interface CartSellerGroup {
  storeId: number;
  storeName: string;
  subtotal: number;
  items: CartItemResponse[];
}

export interface CartResponse {
  cartId: number | null;
  status: string;
  updatedAt: string | null;
  total: number;
  sellerGroups: CartSellerGroup[];
}
