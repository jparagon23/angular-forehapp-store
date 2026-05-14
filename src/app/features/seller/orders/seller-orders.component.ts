import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { CurrencyCopPipe } from '../../../shared/pipes/currency-cop.pipe';
import { OrderService } from '../../../core/services/order.service';
import { SellerGroupStatus, SellerOrderGroupDetail } from '../../../core/models/order.model';

@Component({
  selector: 'app-seller-orders',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, DatePipe, CurrencyCopPipe],
  templateUrl: './seller-orders.component.html',
  styleUrl: './seller-orders.component.scss',
})
export class SellerOrdersComponent implements OnInit {
  private orderService = inject(OrderService);

  groups       = signal<SellerOrderGroupDetail[]>([]);
  loading      = signal(true);
  error        = signal<string | null>(null);
  activeFilter = signal<SellerGroupStatus | null>(null);
  expandedId   = signal<number | null>(null);

  shippingMode  = signal<Set<number>>(new Set());
  trackingDraft = signal<Record<number, string>>({});
  actionLoading = signal<Set<number>>(new Set());

  filtered = computed(() => {
    const f = this.activeFilter();
    return f ? this.groups().filter(g => g.status === f) : this.groups();
  });

  counts = computed(() => {
    const gs = this.groups();
    return {
      ALL:       gs.length,
      PENDING:   gs.filter(g => g.status === 'PENDING').length,
      PREPARING: gs.filter(g => g.status === 'PREPARING').length,
      SHIPPED:   gs.filter(g => g.status === 'SHIPPED').length,
      DELIVERED: gs.filter(g => g.status === 'DELIVERED').length,
      CANCELLED: gs.filter(g => g.status === 'CANCELLED').length,
    };
  });

  ngOnInit() {
    this.orderService.getSellerOrderGroups().subscribe({
      next:  groups => { this.groups.set(groups); this.loading.set(false); },
      error: ()     => { this.error.set('No se pudieron cargar los pedidos.'); this.loading.set(false); },
    });
  }

  toggleExpand(id: number) {
    this.expandedId.update(cur => cur === id ? null : id);
  }

  startShip(groupId: number) {
    this.shippingMode.update(s => { const n = new Set(s); n.add(groupId); return n; });
    this.trackingDraft.update(d => ({ ...d, [groupId]: '' }));
  }

  cancelShip(groupId: number) {
    this.shippingMode.update(s => { const n = new Set(s); n.delete(groupId); return n; });
  }

  setTracking(groupId: number, value: string) {
    this.trackingDraft.update(d => ({ ...d, [groupId]: value }));
  }

  confirmShip(groupId: number) {
    const tracking = (this.trackingDraft()[groupId] ?? '').trim();
    if (!tracking) return;
    this.setLoading(groupId, true);
    this.orderService.shipSellerGroup(groupId, tracking).subscribe({
      next: () => {
        this.patchGroup(groupId, 'SHIPPED', { trackingNumber: tracking, shippedAt: new Date().toISOString() });
        this.cancelShip(groupId);
        this.setLoading(groupId, false);
      },
      error: () => this.setLoading(groupId, false),
    });
  }

  confirmDeliver(groupId: number) {
    this.setLoading(groupId, true);
    this.orderService.deliverSellerGroup(groupId).subscribe({
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
