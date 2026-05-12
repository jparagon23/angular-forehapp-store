import { Component, inject, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { loadOrders } from '../../../store/orders/orders.actions';
import { selectRecentOrders } from '../../../store/orders/orders.selectors';
import { loadProducts } from '../../../store/products/products.actions';
import { selectLowStockProducts } from '../../../store/products/products.selectors';
import { AdminTopbarComponent } from '../shared/admin-topbar.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [AsyncPipe, NgFor, NgIf, RouterLink, AdminTopbarComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private store = inject(Store);
  recentOrders$ = this.store.select(selectRecentOrders);
  lowStock$ = this.store.select(selectLowStockProducts);

  kpis = [
    { icon: '💰', val: '$8.4M', label: 'Ingresos este mes', badge: '▲ 12%', up: true },
    { icon: '📦', val: '134',   label: 'Pedidos este mes',  badge: '▲ 8%',  up: true },
    { icon: '👥', val: '87',    label: 'Clientes nuevos',   badge: '▲ 5%',  up: true },
    { icon: '🎾', val: '12',    label: 'Productos activos', badge: '▼ 2',   up: false },
    { icon: '⭐', val: '4.8',   label: 'Calificación prom.',badge: '▲ 0.2', up: true },
    { icon: '🔄', val: '68%',   label: 'Tasa conversión',   badge: '▲ 3%',  up: true },
  ];

  statusClass(status: string): string {
    const map: Record<string, string> = {
      'Pendiente': 's-pending', 'Enviado': 's-shipped',
      'Entregado': 's-done', 'Cancelado': 's-canceled'
    };
    return map[status] || '';
  }

  ngOnInit() {
    this.store.dispatch(loadOrders());
    this.store.dispatch(loadProducts({}));
  }
}
