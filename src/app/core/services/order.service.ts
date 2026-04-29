import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Order, OrderStatus } from '../models/order.model';

const MOCK_ORDERS: Order[] = [
  { id: 'FH-102941', customer: 'Carlos M.',     date: '22/04/2026', items: 3, total: '$740,000',    status: 'Pendiente' },
  { id: 'FH-102940', customer: 'Daniela R.',    date: '22/04/2026', items: 1, total: '$320,000',    status: 'Enviado' },
  { id: 'FH-102938', customer: 'Jorge P.',      date: '21/04/2026', items: 5, total: '$1,125,000',  status: 'Pendiente' },
  { id: 'FH-102935', customer: 'Ana G.',        date: '21/04/2026', items: 2, total: '$465,000',    status: 'Entregado' },
  { id: 'FH-102930', customer: 'Luis T.',       date: '20/04/2026', items: 1, total: '$180,000',    status: 'Entregado' },
  { id: 'FH-102928', customer: 'Valentina C.',  date: '20/04/2026', items: 4, total: '$850,000',    status: 'Cancelado' },
  { id: 'FH-102925', customer: 'Felipe A.',     date: '19/04/2026', items: 2, total: '$390,000',    status: 'Enviado' },
  { id: 'FH-102920', customer: 'Marta S.',      date: '18/04/2026', items: 1, total: '$295,000',    status: 'Entregado' },
];

@Injectable({ providedIn: 'root' })
export class OrderService {
  getOrders(): Observable<Order[]> {
    return of(MOCK_ORDERS);
  }

  updateOrderStatus(id: string, status: OrderStatus): Observable<{ id: string; status: OrderStatus }> {
    return of({ id, status });
  }
}
