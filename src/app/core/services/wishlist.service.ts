import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { WishlistResponse } from '../models/wishlist-item.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class WishlistService {
  private http = inject(HttpClient);
  private base = environment.apiBaseUrl;

  getWishlist(): Observable<WishlistResponse> {
    return this.http.get<WishlistResponse>(`${this.base}/wishlist`);
  }

  addItem(productId: number): Observable<WishlistResponse> {
    return this.http.post<WishlistResponse>(`${this.base}/wishlist/items`, { productId });
  }

  removeItem(itemId: number): Observable<WishlistResponse> {
    return this.http.delete<WishlistResponse>(`${this.base}/wishlist/items/${itemId}`);
  }

  clearWishlist(): Observable<void> {
    return this.http.delete<void>(`${this.base}/wishlist`);
  }
}
