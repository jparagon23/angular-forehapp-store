import { Component, inject, OnInit, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { AsyncPipe, NgFor } from '@angular/common';
import { loadOrders } from '../../../store/orders/orders.actions';
import { selectAllOrders } from '../../../store/orders/orders.selectors';
import { Order } from '../../../core/models/order.model';
import { AdminTopbarComponent } from '../shared/admin-topbar.component';

@Component({
  selector: 'app-orders-admin',
  standalone: true,
  imports: [AsyncPipe, NgFor, AdminTopbarComponent],
  templateUrl: './orders-admin.component.html',
  styleUrl: './orders-admin.component.scss',
})
export class OrdersAdminComponent implements OnInit {
  private store = inject(Store);
  orders$ = this.store.select(selectAllOrders);
  filter = signal('');

  ngOnInit() { this.store.dispatch(loadOrders()); }

  filtered(orders: Order[] | null): Order[] {
    if (!orders) return [];
    const q = this.filter().toLowerCase();
    if (!q) return orders;
    return orders.filter(o =>
      o.id.toLowerCase().includes(q) || o.customer.toLowerCase().includes(q)
    );
  }

  statusClass(s: string): string {
    const map: Record<string, string> = {
      'Pendiente': 's-pending', 'Enviado': 's-shipped',
      'Entregado': 's-done', 'Cancelado': 's-canceled'
    };
    return map[s] || '';
  }
}
