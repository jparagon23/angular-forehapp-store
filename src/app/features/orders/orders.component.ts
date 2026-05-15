import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { AsyncPipe, DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { take } from 'rxjs';
import { selectIsLoggedIn, selectAuthUser } from '../../store/auth/auth.selectors';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { CurrencyCopPipe } from '../../shared/pipes/currency-cop.pipe';
import { OrderService } from '../../core/services/order.service';
import { OrderResponse, OrderSellerGroup, OrderSummaryDto, SellerGroupStatus } from '../../core/models/order.model';
import { ReturnService } from '../../core/services/return.service';
import { CreateReturnRequest, ReturnType } from '../../core/models/return.model';

interface ReturnFormItem {
  orderItemId: number;
  productTitle: string;
  sku: string;
  quantityOrdered: number;
  unitPrice: number;
  checked: boolean;
  quantityToReturn: number;
}

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [AsyncPipe, NgFor, NgIf, NgClass, DatePipe, RouterLink, NavbarComponent, CurrencyCopPipe],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.scss',
})
export class OrdersComponent implements OnInit {
  private store         = inject(Store);
  private router        = inject(Router);
  private orderService  = inject(OrderService);
  private returnService = inject(ReturnService);

  authUser$   = this.store.select(selectAuthUser);
  isLoggedIn$ = this.store.select(selectIsLoggedIn);

  orders        = signal<OrderSummaryDto[]>([]);
  loading       = signal(true);
  error         = signal<string | null>(null);
  expandedId    = signal<number | null>(null);
  details       = signal<Record<number, OrderResponse>>({});
  loadingDetail = signal<Set<number>>(new Set());

  // ── Return state ─────────────────────────────────────────────────────────────
  returnedGroups     = signal<Set<number>>(new Set());
  returnFormVisible  = signal(false);
  returnActiveGroup  = signal<OrderSellerGroup | null>(null);
  returnActiveOrderId = signal<number | null>(null);
  returnType         = signal<ReturnType>('DEVOLUCION');
  returnReason       = signal('');
  returnFormItems    = signal<ReturnFormItem[]>([]);
  returnSubmitting   = signal(false);
  returnError        = signal<string | null>(null);

  returnEstimatedTotal = computed(() =>
    this.returnFormItems()
      .filter(i => i.checked)
      .reduce((sum, i) => sum + i.unitPrice * i.quantityToReturn, 0)
  );

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
      this.returnService.getMyReturns().subscribe({
        next: returns => this.returnedGroups.set(new Set(returns.map(r => r.orderGroupId))),
        error: () => {},
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

  // ── Return helpers ───────────────────────────────────────────────────────────

  hasReturn(groupId: number): boolean {
    return this.returnedGroups().has(groupId);
  }

  openReturnForm(group: OrderSellerGroup, orderId: number) {
    this.returnActiveGroup.set(group);
    this.returnActiveOrderId.set(orderId);
    this.returnType.set('DEVOLUCION');
    this.returnReason.set('');
    this.returnError.set(null);
    this.returnFormItems.set(group.items.map(item => ({
      orderItemId:    item.itemId,
      productTitle:   item.productTitle,
      sku:            item.sku,
      quantityOrdered: item.quantity,
      unitPrice:       item.unitPrice,
      checked:         true,
      quantityToReturn: item.quantity,
    })));
    this.returnFormVisible.set(true);
  }

  closeReturnForm() {
    this.returnFormVisible.set(false);
    this.returnActiveGroup.set(null);
  }

  onReturnTypeChange(ev: Event) {
    this.returnType.set((ev.target as HTMLInputElement).value as ReturnType);
  }

  onReturnReasonInput(ev: Event) {
    this.returnReason.set((ev.target as HTMLTextAreaElement).value);
  }

  toggleReturnItem(idx: number) {
    this.returnFormItems.update(items => {
      const copy = [...items];
      copy[idx] = { ...copy[idx], checked: !copy[idx].checked };
      return copy;
    });
  }

  updateReturnQty(idx: number, ev: Event) {
    const raw = +(ev.target as HTMLInputElement).value;
    this.returnFormItems.update(items => {
      const copy = [...items];
      const item = copy[idx];
      copy[idx] = { ...item, quantityToReturn: Math.min(Math.max(1, raw || 1), item.quantityOrdered) };
      return copy;
    });
  }

  submitReturn() {
    const group = this.returnActiveGroup();
    if (!group) return;

    const selectedItems = this.returnFormItems().filter(i => i.checked);
    if (selectedItems.length === 0) {
      this.returnError.set('Selecciona al menos un ítem para incluir en la solicitud.');
      return;
    }
    if (!this.returnReason().trim()) {
      this.returnError.set('El motivo es obligatorio. Describe el problema con tu pedido.');
      return;
    }

    const req: CreateReturnRequest = {
      orderGroupId: group.groupId,
      returnType:   this.returnType(),
      reason:       this.returnReason().trim(),
      items:        selectedItems.map(i => ({ orderItemId: i.orderItemId, quantityToReturn: i.quantityToReturn })),
    };

    this.returnSubmitting.set(true);
    this.returnError.set(null);

    this.returnService.createReturn(req).subscribe({
      next: () => {
        this.returnedGroups.update(s => { const n = new Set(s); n.add(group.groupId); return n; });
        this.returnSubmitting.set(false);
        this.closeReturnForm();
      },
      error: err => {
        const msg: string = err?.error?.message ?? '';
        this.returnError.set(
          msg.includes('already exists')
            ? 'Ya existe una solicitud para este grupo de orden.'
            : msg.includes('DELIVERED')
            ? 'Solo puedes solicitar devoluciones de órdenes entregadas.'
            : msg || 'Error al enviar la solicitud. Inténtalo de nuevo.'
        );
        this.returnSubmitting.set(false);
      },
    });
  }

  // ── Order / group helpers ────────────────────────────────────────────────────

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
