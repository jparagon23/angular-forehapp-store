import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AssistedCustomer, AssistedOrderRequest, OrderResponse } from '../models/order.model';

/** Pedidos que el seller registra a nombre de un cliente que pidió por fuera de la app. */
@Injectable({ providedIn: 'root' })
export class AssistedOrderService {
  private http = inject(HttpClient);
  private base = environment.apiBaseUrl;

  lookupCustomer(storeId: number, email: string): Observable<AssistedCustomer> {
    return this.http.get<AssistedCustomer>(`${this.base}/stores/${storeId}/assisted-orders/customer`, {
      params: { email },
    });
  }

  /** checkoutUrl en la respuesta es el link de MercadoPago para enviarle al cliente (solo MERCADO_PAGO). */
  placeOrder(storeId: number, body: AssistedOrderRequest): Observable<OrderResponse> {
    return this.http.post<OrderResponse>(`${this.base}/stores/${storeId}/assisted-orders`, body);
  }
}
