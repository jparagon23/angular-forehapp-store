import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CartResponse } from '../models/cart.model';

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

  updateItem(itemId: number, quantity: number): Observable<CartResponse> {
    return this.http.patch<CartResponse>(`${this.BASE}/cart/items/${itemId}`, { quantity });
  }

  removeItem(itemId: number): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/cart/items/${itemId}`);
  }

  clearCart(): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/cart`);
  }
}
