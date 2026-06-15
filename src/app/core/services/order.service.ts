import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Order, OrderResponse, OrderStatus, OrderSummaryDto, PaymentMethod, SellerOrderGroupDetail } from '../models/order.model';
import { environment } from '../../../environments/environment';

const MOCK_ORDERS: Order[] = [
  { id: 'FH-102941', customer: 'Carlos M.',    date: '22/04/2026', items: 3, total: '$740,000',   status: 'Pendiente' },
  { id: 'FH-102940', customer: 'Daniela R.',   date: '22/04/2026', items: 1, total: '$320,000',   status: 'Enviado' },
  { id: 'FH-102938', customer: 'Jorge P.',     date: '21/04/2026', items: 5, total: '$1,125,000', status: 'Pendiente' },
  { id: 'FH-102935', customer: 'Ana G.',       date: '21/04/2026', items: 2, total: '$465,000',   status: 'Entregado' },
  { id: 'FH-102930', customer: 'Luis T.',      date: '20/04/2026', items: 1, total: '$180,000',   status: 'Entregado' },
  { id: 'FH-102928', customer: 'Valentina C.', date: '20/04/2026', items: 4, total: '$850,000',   status: 'Cancelado' },
  { id: 'FH-102925', customer: 'Felipe A.',    date: '19/04/2026', items: 2, total: '$390,000',   status: 'Enviado' },
  { id: 'FH-102920', customer: 'Marta S.',     date: '18/04/2026', items: 1, total: '$295,000',   status: 'Entregado' },
];

@Injectable({ providedIn: 'root' })
export class OrderService {
  private http = inject(HttpClient);
  private base = environment.apiBaseUrl;

  createOrder(addressId: number, paymentMethod: PaymentMethod, couponCode?: string, couponStoreId?: number, referralCode?: string): Observable<OrderResponse> {
    return this.http.post<OrderResponse>(`${this.base}/orders`, {
      addressId,
      paymentMethod,
      ...(couponCode && couponStoreId ? { couponCode, couponStoreId } : {}),
      ...(referralCode ? { referralCode } : {}),
    });
  }

  confirmCashPayment(orderId: number): Observable<void> {
    return this.http.patch<void>(`${this.base}/admin/payments/orders/${orderId}/confirm-cash`, {});
  }

  getBuyerOrders(): Observable<OrderSummaryDto[]> {
    return this.http.get<OrderSummaryDto[]>(`${this.base}/orders`);
  }

  getOrderById(orderId: number): Observable<OrderResponse> {
    return this.http.get<OrderResponse>(`${this.base}/orders/${orderId}`);
  }

  getSellerOrderGroups(storeId: number): Observable<SellerOrderGroupDetail[]> {
    return this.http.get<SellerOrderGroupDetail[]>(`${this.base}/stores/${storeId}/order-groups`);
  }

  getSellerOrderGroupById(storeId: number, groupId: number): Observable<SellerOrderGroupDetail> {
    return this.http.get<SellerOrderGroupDetail>(`${this.base}/stores/${storeId}/order-groups/${groupId}`);
  }

  prepareSellerGroup(storeId: number, groupId: number): Observable<void> {
    return this.http.patch<void>(`${this.base}/stores/${storeId}/order-groups/${groupId}/prepare`, {});
  }

  shipSellerGroup(storeId: number, groupId: number, trackingNumber: string | null): Observable<void> {
    return this.http.patch<void>(`${this.base}/stores/${storeId}/order-groups/${groupId}/ship`, { trackingNumber });
  }

  deliverSellerGroup(storeId: number, groupId: number): Observable<void> {
    return this.http.patch<void>(`${this.base}/stores/${storeId}/order-groups/${groupId}/deliver`, {});
  }

  cancelSellerGroup(storeId: number, groupId: number, reason: string): Observable<void> {
    return this.http.patch<void>(`${this.base}/stores/${storeId}/order-groups/${groupId}/cancel`, { reason });
  }

  // Admin panel (mock)
  getOrders(): Observable<Order[]> {
    return of(MOCK_ORDERS);
  }

  updateOrderStatus(id: string, status: OrderStatus): Observable<{ id: string; status: OrderStatus }> {
    return of({ id, status });
  }
}
