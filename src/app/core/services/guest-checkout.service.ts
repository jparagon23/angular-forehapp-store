import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ShippingEstimateResponse } from '../models/cart.model';
import {
  CreateAccountRequest, CreateAccountResponse, GuestEstimateRequest, GuestOrderRequest, OrderResponse,
} from '../models/order.model';

@Injectable({ providedIn: 'root' })
export class GuestCheckoutService {
  private readonly BASE = environment.apiBaseUrl;
  private http = inject(HttpClient);

  estimateShipping(body: GuestEstimateRequest): Observable<ShippingEstimateResponse> {
    return this.http.post<ShippingEstimateResponse>(`${this.BASE}/checkout/guest/estimate`, body);
  }

  createOrder(body: GuestOrderRequest): Observable<OrderResponse> {
    return this.http.post<OrderResponse>(`${this.BASE}/checkout/guest`, body);
  }

  /** Envía un código al correo; la sesión se inicia en /verify-code y ahí se vinculan sus pedidos. */
  createAccount(body: CreateAccountRequest): Observable<CreateAccountResponse> {
    return this.http.post<CreateAccountResponse>(`${this.BASE}/checkout/guest/create-account`, body);
  }
}
