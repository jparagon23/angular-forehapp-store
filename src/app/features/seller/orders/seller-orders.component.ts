import { Component, computed, effect, inject, signal } from '@angular/core';
import { DatePipe, NgClass, NgFor, NgIf, TitleCasePipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { CurrencyCopPipe } from '../../../shared/pipes/currency-cop.pipe';
import { OrderService } from '../../../core/services/order.service';
import { SellerGroupStatus, SellerOrderGroupDetail } from '../../../core/models/order.model';
import { selectActiveSellerStoreId } from '../../../store/seller/seller.selectors';

@Component({
  selector: 'app-seller-orders',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, DatePipe, TitleCasePipe, CurrencyCopPipe],
  templateUrl: './seller-orders.component.html',
  styleUrl: './seller-orders.component.scss',
})
export class SellerOrdersComponent {
  private orderService = inject(OrderService);
  private ngrx         = inject(Store);

  private storeId = toSignal(this.ngrx.select(selectActiveSellerStoreId), { initialValue: null });

  groups    = signal<SellerOrderGroupDetail[]>([]);
  loading   = signal(true);
  error     = signal<string | null>(null);
  activeTab = signal<'ACTIVE' | 'DELIVERED' | 'CANCELLED' | 'ALL'>('ACTIVE');
  expandedId = signal<number | null>(null);

  shipModal         = signal<number | null>(null);
  shipModalTracking = signal<string>('');
  cancelMode        = signal<Set<number>>(new Set());
  cancelReason      = signal<Record<number, string>>({});
  actionLoading     = signal<Set<number>>(new Set());

  modalOrder    = computed(() => this.groups().find(g => g.groupId === this.shipModal()) ?? null);
  shipModalBusy = computed(() => { const id = this.shipModal(); return id !== null && this.actionLoading().has(id); });

  private readonly ACTIVE_STATUSES: SellerGroupStatus[] = ['PENDING', 'PREPARING', 'SHIPPED'];

  filtered = computed(() => {
    const gs = this.groups();
    switch (this.activeTab()) {
      case 'ACTIVE':    return gs.filter(g => this.ACTIVE_STATUSES.includes(g.status));
      case 'DELIVERED': return gs.filter(g => g.status === 'DELIVERED');
      case 'CANCELLED': return gs.filter(g => g.status === 'CANCELLED');
      default:          return gs;
    }
  });

  counts = computed(() => {
    const gs = this.groups();
    return {
      ACTIVE:    gs.filter(g => this.ACTIVE_STATUSES.includes(g.status)).length,
      DELIVERED: gs.filter(g => g.status === 'DELIVERED').length,
      CANCELLED: gs.filter(g => g.status === 'CANCELLED').length,
      ALL:       gs.length,
    };
  });

  constructor() {
    effect(() => {
      const storeId = this.storeId();
      if (!storeId) return;
      this.loading.set(true);
      this.orderService.getSellerOrderGroups(storeId).subscribe({
        next:  groups => { this.groups.set(groups); this.loading.set(false); },
        error: ()     => { this.error.set('No se pudieron cargar los pedidos.'); this.loading.set(false); },
      });
    }, { allowSignalWrites: true });
  }

  toggleExpand(id: number) {
    this.expandedId.update(cur => cur === id ? null : id);
  }

  startShip(groupId: number) {
    this.shipModal.set(groupId);
    this.shipModalTracking.set('');
  }

  closeShipModal() {
    this.shipModal.set(null);
    this.shipModalTracking.set('');
  }

  confirmPrepare(groupId: number) {
    const storeId = this.storeId();
    if (!storeId) return;
    this.setLoading(groupId, true);
    this.orderService.prepareSellerGroup(storeId, groupId).subscribe({
      next: () => {
        this.patchGroup(groupId, 'PREPARING', { preparedAt: new Date().toISOString() });
        this.setLoading(groupId, false);
      },
      error: () => this.setLoading(groupId, false),
    });
  }

  confirmShip() {
    const groupId = this.shipModal();
    if (groupId === null) return;
    const storeId = this.storeId();
    if (!storeId) return;
    const tracking = this.shipModalTracking().trim();
    const trackingOrNull = tracking || null;
    this.setLoading(groupId, true);
    this.orderService.shipSellerGroup(storeId, groupId, trackingOrNull).subscribe({
      next: () => {
        this.patchGroup(groupId, 'SHIPPED', { trackingNumber: trackingOrNull, shippedAt: new Date().toISOString() });
        this.closeShipModal();
        this.setLoading(groupId, false);
      },
      error: () => this.setLoading(groupId, false),
    });
  }

  startCancel(groupId: number) {
    this.cancelMode.update(s => { const n = new Set(s); n.add(groupId); return n; });
    this.cancelReason.update(d => ({ ...d, [groupId]: '' }));
  }

  abortCancel(groupId: number) {
    this.cancelMode.update(s => { const n = new Set(s); n.delete(groupId); return n; });
  }

  setCancelReason(groupId: number, value: string) {
    this.cancelReason.update(d => ({ ...d, [groupId]: value }));
  }

  confirmCancel(groupId: number) {
    const reason = (this.cancelReason()[groupId] ?? '').trim();
    if (!reason) return;
    const storeId = this.storeId();
    if (!storeId) return;
    this.setLoading(groupId, true);
    this.orderService.cancelSellerGroup(storeId, groupId, reason).subscribe({
      next: () => {
        this.patchGroup(groupId, 'CANCELLED', { cancelledAt: new Date().toISOString(), cancellationReason: reason });
        this.abortCancel(groupId);
        this.setLoading(groupId, false);
      },
      error: () => this.setLoading(groupId, false),
    });
  }

  confirmDeliver(groupId: number) {
    const storeId = this.storeId();
    if (!storeId) return;
    this.setLoading(groupId, true);
    this.orderService.deliverSellerGroup(storeId, groupId).subscribe({
      next: () => {
        this.patchGroup(groupId, 'DELIVERED', { deliveredAt: new Date().toISOString() });
        this.setLoading(groupId, false);
      },
      error: () => this.setLoading(groupId, false),
    });
  }

  relevantDate(g: SellerOrderGroupDetail): string | null {
    return g.shippedAt ?? g.preparedAt ?? g.deliveredAt ?? null;
  }

  paymentLabel(g: SellerOrderGroupDetail): string {
    if (g.paymentMethod === 'CASH_ON_DELIVERY') return 'Contra entrega';
    if (g.orderPaymentStatus === 'PAID' || g.orderPaymentStatus === 'PAYMENT_CONFIRMED') return 'Pagado';
    return 'Pago pendiente';
  }

  paymentClass(g: SellerOrderGroupDetail): string {
    if (g.paymentMethod === 'CASH_ON_DELIVERY') return 'so-pay-cod';
    if (g.orderPaymentStatus === 'PAID' || g.orderPaymentStatus === 'PAYMENT_CONFIRMED') return 'so-pay-paid';
    return 'so-pay-pending';
  }

  statusLabel(s: SellerGroupStatus): string {
    const m: Record<SellerGroupStatus, string> = {
      PENDING:   'Pendiente',
      PREPARING: 'En preparación',
      SHIPPED:   'Enviado',
      DELIVERED: 'Entregado',
      CANCELLED: 'Cancelado',
    };
    return m[s];
  }

  statusClass(s: SellerGroupStatus): string {
    const m: Record<SellerGroupStatus, string> = {
      PENDING:   'so-pending',
      PREPARING: 'so-preparing',
      SHIPPED:   'so-shipped',
      DELIVERED: 'so-delivered',
      CANCELLED: 'so-cancelled',
    };
    return m[s];
  }

  private setLoading(groupId: number, on: boolean) {
    this.actionLoading.update(s => { const n = new Set(s); on ? n.add(groupId) : n.delete(groupId); return n; });
  }

  private patchGroup(groupId: number, status: SellerGroupStatus, patch: Partial<SellerOrderGroupDetail> = {}) {
    this.groups.update(gs => gs.map(g => g.groupId === groupId ? { ...g, status, ...patch } : g));
  }
}
