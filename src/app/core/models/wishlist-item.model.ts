export interface WishlistItemDto {
  itemId: number;
  productId: number;
  productTitle: string;
  minPrice: number;
  variantCount: number;
  addedAt: string;
}

export interface WishlistResponse {
  wishlistId: number | null;
  totalItems: number;
  items: WishlistItemDto[];
}
