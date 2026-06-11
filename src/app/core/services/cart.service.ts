import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { CartItemResponse, CartResponse, CartSellerGroup, ShippingEstimateResponse } from '../models/cart.model';

/* Shape que devuelve POST /cart/items/batch (campos distintos al modelo interno) */
interface BatchItem {
  id: number;
  variantId: number;
  productId: number;
  sku: string | null;
  productTitle: string;
  quantity: number;
  currentPrice: number;
  subtotal: number;
  priceChanged: boolean;
  originalPrice: number | null;
  thumbnailUrl: string | null;
}
interface BatchGroup  { storeId: number; storeName: string; subtotal: number; freeShippingMinAmount?: number | null; items: BatchItem[]; }
interface BatchCartResponse { id: number | null; status: string; updatedAt: string | null; total: number; sellerGroups: BatchGroup[]; }

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly BASE = environment.apiBaseUrl;
  private http = inject(HttpClient);

  getCart(): Observable<CartResponse> {
    return this.http.get<CartResponse>(`${this.BASE}/cart`);
  }

  addItem(variantId: number, quantity: number): Observable<CartResponse> {
    return this.http.post<CartResponse>(`${this.BASE}/cart/items`, { variantId, quantity });
  }

  addItemsBatch(items: { variantId: number; quantity: number }[]): Observable<CartResponse> {
    return this.http.post<BatchCartResponse>(`${this.BASE}/cart/items/batch`, items).pipe(
      map(raw => this.mapBatch(raw))
    );
  }

  updateItem(itemId: number, quantity: number): Observable<CartResponse> {
    return this.http.patch<CartResponse>(`${this.BASE}/cart/items/${itemId}`, { quantity });
  }

  removeItem(itemId: number): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/cart/items/${itemId}`);
  }

  clearCart(): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/cart`);
  }

  getShippingEstimate(addressId: number): Observable<ShippingEstimateResponse> {
    return this.http.get<ShippingEstimateResponse>(`${this.BASE}/cart/shipping-estimate`, {
      params: { addressId: String(addressId) },
    });
  }

  private mapBatch(raw: BatchCartResponse): CartResponse {
    const sellerGroups: CartSellerGroup[] = raw.sellerGroups.map(g => ({
      storeId:               g.storeId,
      storeName:             g.storeName,
      subtotal:              g.subtotal,
      freeShippingMinAmount: g.freeShippingMinAmount ?? null,
      items:      g.items.map((i): CartItemResponse => ({
        itemId:        i.id,
        variantId:     i.variantId,
        productId:     i.productId,
        sku:           i.sku,
        productTitle:  i.productTitle,
        quantity:      i.quantity,
        unitPrice:     i.currentPrice,
        subtotal:      i.subtotal,
        priceChanged:  i.priceChanged,
        previousPrice: i.originalPrice,
        thumbnailUrl:  i.thumbnailUrl ?? undefined,
      })),
    }));
    return { cartId: raw.id, status: raw.status, updatedAt: raw.updatedAt, total: raw.total, sellerGroups };
  }
}
