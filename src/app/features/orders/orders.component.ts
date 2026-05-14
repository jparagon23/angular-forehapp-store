import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { AsyncPipe, DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { take } from 'rxjs';
import { selectIsLoggedIn, selectAuthUser } from '../../store/auth/auth.selectors';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { CurrencyCopPipe } from '../../shared/pipes/currency-cop.pipe';
import { OrderService } from '../../core/services/order.service';
import { OrderResponse, OrderSummaryDto, SellerGroupStatus } from '../../core/models/order.model';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [AsyncPipe, NgFor, NgIf, NgClass, DatePipe, RouterLink, NavbarComponent, CurrencyCopPipe],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.scss',
})
export class OrdersComponent implements OnInit {
  private store        = inject(Store);
  private router       = inject(Router);
  private orderService = inject(OrderService);

  authUser$   = this.store.select(selectAuthUser);
  isLoggedIn$ = this.store.select(selectIsLoggedIn);

  orders        = signal<OrderSummaryDto[]>([]);
  loading       = signal(true);
  error         = signal<string | null>(null);
  expandedId    = signal<number | null>(null);
  details       = signal<Record<number, OrderResponse>>({});
  loadingDetail = signal<Set<number>>(new Set());

  ngOnInit() {
    this.isLoggedIn$.pipe(take(1)).subscribe(loggedIn => {
      if (!loggedIn) {
        this.router.navigate(['/login'], { queryParams: { redirect: '/orders' } });
        return;
      }
      this.orderService.getBuyerOrders().subscribe({
        next:  orders => { this.orders.set(orders); this.loading.set(false); },
        error: ()     => { this.error.set('No se pudieron cargar tus pedidos.'); this.loading.set(false); },
      });
    });
  }

  toggleExpand(orderId: number) {
    if (this.expandedId() === orderId) { this.expandedId.set(null); return; }
    this.expandedId.set(orderId);
    if (!this.details()[orderId]) this.fetchDetail(orderId);
  }

  private fetchDetail(orderId: number) {
    this.loadingDetail.update(s => { const n = new Set(s); n.add(orderId); return n; });
    this.orderService.getOrderById(orderId).subscribe({
      next:  detail => {
        this.details.update(d => ({ ...d, [orderId]: detail }));
        this.loadingDetail.update(s => { const n = new Set(s); n.delete(orderId); return n; });
      },
      error: () => this.loadingDetail.update(s => { const n = new Set(s); n.delete(orderId); return n; }),
    });
  }

  orderStatusLabel(status: string): string {
    return ({ PENDING: 'Pago pendiente', PAID: 'Pagado', CANCELLED: 'Cancelado' } as Record<string, string>)[status] ?? status;
  }

  orderStatusClass(status: string): string {
    return ({ PENDING: 'orange', PAID: 'green', CANCELLED: 'red' } as Record<string, string>)[status] ?? '';
  }

  groupStatusLabel(status: SellerGroupStatus): string {
    const m: Record<SellerGroupStatus, string> = {
      PENDING: 'Pendiente', PREPARING: 'Preparando', SHIPPED: 'En camino',
      DELIVERED: 'Entregado', CANCELLED: 'Cancelado',
    };
    return m[status];
  }

  groupStatusClass(status: SellerGroupStatus): string {
    const m: Record<SellerGroupStatus, string> = {
      PENDING: 'orange', PREPARING: 'purple', SHIPPED: 'blue',
      DELIVERED: 'green', CANCELLED: 'red',
    };
    return m[status];
  }
}
