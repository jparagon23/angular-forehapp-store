import { Component, HostListener, computed, effect, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe, NgClass, NgFor, NgIf, TitleCasePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { CurrencyCopPipe } from '../../../shared/pipes/currency-cop.pipe';
import { OrderService } from '../../../core/services/order.service';
import { EditOrderItemsResult, OrderItemChange, SellerGroupStatus, SellerOrderGroupDetail } from '../../../core/models/order.model';
import { apiCode, apiMessage } from '../../../core/models/api-error.model';
import { selectActiveSellerStoreId } from '../../../store/seller/seller.selectors';
import { ToastComponent } from '../../../shared/components/toast/toast.component';
import { OrderItemsEditorComponent } from './edit-items/order-items-editor.component';

interface OrderProfit {
  /** Al menos una línea tiene costo. */
  known: boolean;
  /** Todas las líneas tienen costo. */
  complete: boolean;
  missing: number;
  sales: number;
  cost: number;
  productDiscount: number;
  profit: number;
  percent: number | null;
}

/** Paso pendiente de un pedido activo (sub-filtros de "Por atender"). */
type OrderStep = 'PAY' | 'PREPARE' | 'SHIP' | 'TRANSIT';
type NextActionKind = 'CONFIRM_PAYMENT' | 'PREPARE' | 'SHIP' | 'DELIVER';

@Component({
  selector: 'app-seller-orders',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, RouterLink, DatePipe, DecimalPipe, TitleCasePipe, CurrencyCopPipe, ToastComponent,
            OrderItemsEditorComponent],
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

  /** Sub-filtro de "Por atender" por paso del proceso. */
  stepFilter = signal<OrderStep | null>(null);
  /** Menú ⋯ abierto (groupId). */
  menuOpenId = signal<number | null>(null);

  shipModal         = signal<number | null>(null);
  shipModalTracking = signal<string>('');
  cancelModal       = signal<number | null>(null);
  cancelReason      = signal('');
  removeShippingModal  = signal<number | null>(null);
  removeShippingReason = signal('');
  removeShippingError  = signal('');
  actionLoading     = signal<Set<number>>(new Set());

  // ── Edición de productos ─────────────────────────────────────
  editingGroupId = signal<number | null>(null);
  editingGroup   = computed(() => this.groups().find(g => g.groupId === this.editingGroupId()) ?? null);
  editorStoreId  = computed(() => this.storeId() ?? 0);
  /** Link nuevo de MercadoPago tras una edición, para copiarlo y mandarlo por WhatsApp. */
  lastPaymentUrl = signal<{ groupId: number; url: string } | null>(null);
  itemChanges    = signal<Record<number, OrderItemChange[]>>({});

  toastMsg  = signal('');
  toastType = signal<'success' | 'error'>('success');

  modalOrder    = computed(() => this.groups().find(g => g.groupId === this.shipModal()) ?? null);
  cancelOrder   = computed(() => this.groups().find(g => g.groupId === this.cancelModal()) ?? null);
  removeShippingOrder = computed(() => this.groups().find(g => g.groupId === this.removeShippingModal()) ?? null);
  shipModalBusy = computed(() => { const id = this.shipModal(); return id !== null && this.actionLoading().has(id); });

  private readonly ACTIVE_STATUSES: SellerGroupStatus[] = ['PENDING', 'PREPARING', 'SHIPPED'];

  readonly STEPS: { value: OrderStep; label: string }[] = [
    { value: 'PAY',     label: 'Por confirmar pago' },
    { value: 'PREPARE', label: 'Por preparar' },
    { value: 'SHIP',    label: 'Por enviar' },
    { value: 'TRANSIT', label: 'En camino' },
  ];

  stepCounts = computed(() => {
    const counts: Record<OrderStep, number> = { PAY: 0, PREPARE: 0, SHIP: 0, TRANSIT: 0 };
    for (const g of this.groups()) {
      const step = this.stepOf(g);
      if (step) counts[step]++;
    }
    return counts;
  });

  filtered = computed(() => {
    const gs = this.groups();
    switch (this.activeTab()) {
      case 'ACTIVE': {
        const step = this.stepFilter();
        return gs.filter(g => this.ACTIVE_STATUSES.includes(g.status) && (!step || this.stepOf(g) === step));
      }
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

  selectTab(tab: 'ACTIVE' | 'DELIVERED' | 'CANCELLED' | 'ALL') {
    this.activeTab.set(tab);
    this.stepFilter.set(null);
  }

  toggleStep(step: OrderStep) {
    this.stepFilter.update(cur => cur === step ? null : step);
  }

  toggleExpand(id: number) {
    this.menuOpenId.set(null);
    this.expandedId.update(cur => cur === id ? null : id);
    const g = this.groups().find(x => x.groupId === id);
    if (this.expandedId() === id && g?.itemsEditedAt) this.loadItemChanges(id);
  }

  // ── Proceso: en qué paso va cada pedido y cuál es la siguiente acción ──

  /** Paso pendiente de un pedido activo; null si está entregado o cancelado. */
  stepOf(g: SellerOrderGroupDetail): OrderStep | null {
    switch (g.status) {
      case 'SHIPPED':   return 'TRANSIT';
      case 'PREPARING': return 'SHIP';
      case 'PENDING':   return this.isPaid(g) || g.paymentMethod === 'CASH_ON_DELIVERY' ? 'PREPARE' : 'PAY';
      default:          return null;
    }
  }

  /** La única acción principal de la fila; null si no hay nada que hacer (o se espera al cliente). */
  nextAction(g: SellerOrderGroupDetail): { kind: NextActionKind; label: string; busyLabel: string } | null {
    if (this.canConfirmPayment(g)) return { kind: 'CONFIRM_PAYMENT', label: 'Confirmar pago', busyLabel: 'Confirmando…' };
    switch (g.status) {
      case 'PENDING':
        return this.stepOf(g) === 'PREPARE' ? { kind: 'PREPARE', label: 'Preparar pedido', busyLabel: 'Procesando…' } : null;
      case 'PREPARING': return { kind: 'SHIP', label: 'Marcar enviado', busyLabel: 'Procesando…' };
      case 'SHIPPED':   return { kind: 'DELIVER', label: 'Confirmar entrega', busyLabel: 'Guardando…' };
      default:          return null;
    }
  }

  runNextAction(g: SellerOrderGroupDetail) {
    switch (this.nextAction(g)?.kind) {
      case 'CONFIRM_PAYMENT': return this.confirmPayment(g.groupId);
      case 'PREPARE':         return this.confirmPrepare(g.groupId);
      case 'SHIP':            return this.startShip(g.groupId);
      case 'DELIVER':         return this.confirmDeliver(g.groupId);
    }
  }

  /** Se espera que el cliente pague en línea: no hay acción del seller. */
  awaitingOnlinePayment(g: SellerOrderGroupDetail): boolean {
    return g.status === 'PENDING' && !this.isPaid(g) && g.paymentMethod === 'MERCADO_PAGO';
  }

  isPaid(g: SellerOrderGroupDetail): boolean {
    return g.orderPaymentStatus === 'PAID' || g.orderPaymentStatus === 'PAYMENT_CONFIRMED';
  }

  hasMenu(g: SellerOrderGroupDetail): boolean {
    return this.canEditItems(g) || this.canRemoveShipping(g) || this.canCancel(g);
  }

  canCancel(g: SellerOrderGroupDetail): boolean {
    return g.status === 'PENDING' || g.status === 'PREPARING';
  }

  toggleMenu(groupId: number) {
    this.menuOpenId.update(cur => cur === groupId ? null : groupId);
  }

  @HostListener('document:click')
  closeMenu() {
    this.menuOpenId.set(null);
  }

  /** Línea de progreso del detalle. */
  progress(g: SellerOrderGroupDetail): { label: string; done: boolean; current: boolean; date: string | null }[] {
    const cod = g.paymentMethod === 'CASH_ON_DELIVERY';
    const steps = [
      { label: cod ? 'Pago (contraentrega)' : 'Pago', done: this.isPaid(g) || (cod && g.status !== 'PENDING'), date: null as string | null },
      { label: 'Preparación', done: !!g.preparedAt || g.status === 'SHIPPED' || g.status === 'DELIVERED', date: g.preparedAt },
      { label: 'Envío',       done: !!g.shippedAt || g.status === 'DELIVERED', date: g.shippedAt },
      { label: 'Entrega',     done: !!g.deliveredAt || g.status === 'DELIVERED', date: g.deliveredAt },
    ];
    const current = steps.findIndex(s => !s.done);
    return steps.map((s, i) => ({ ...s, current: i === current }));
  }

  /** Historial unificado del pedido, del más reciente al más antiguo. */
  history(g: SellerOrderGroupDetail): { at: string; title: string; detail?: string; kind: string }[] {
    const events: { at: string; title: string; detail?: string; kind: string }[] = [];
    if (g.preparedAt)  events.push({ at: g.preparedAt, title: 'Pedido en preparación', kind: 'status' });
    if (g.shippedAt)   events.push({ at: g.shippedAt, title: 'Enviado',
      detail: g.trackingNumber ? `Guía ${g.trackingNumber}` : 'Entrega propia', kind: 'status' });
    if (g.deliveredAt) events.push({ at: g.deliveredAt, title: 'Entregado', kind: 'status' });
    if (g.cancelledAt) events.push({ at: g.cancelledAt, title: 'Cancelado', detail: g.cancellationReason ?? undefined, kind: 'cancel' });
    if (g.shippingRemovedAt) events.push({ at: g.shippingRemovedAt, kind: 'shipping',
      title: `Se quitó el cobro de envío (${this.money(g.shippingCostWaived)})`, detail: g.shippingRemovedReason ?? undefined });
    for (const c of this.itemChanges()[g.groupId] ?? []) {
      events.push({ at: c.changedAt, kind: c.type, title: `${this.changeTypeLabel(c.type)}: ${this.changeText(c)}`, detail: c.reason });
    }
    return events.sort((a, b) => b.at.localeCompare(a.at));
  }

  /**
   * Ganancia del pedido para el seller: venta de productos − costo, solo con las líneas que tienen costo.
   * El descuento del cupón sobre productos (no el de envío gratis) se resta aparte.
   */
  profit(g: SellerOrderGroupDetail): OrderProfit {
    let sales = 0, cost = 0, missing = 0;
    for (const i of g.items) {
      if (i.unitCost == null) { missing++; continue; }
      sales += i.subtotal;
      cost += i.unitCost * i.quantity;
    }
    const shippingCovered = Math.max(0, g.shippingCost - (g.shippingChargedNet ?? g.shippingCost));
    const productDiscount = Math.max(0, (g.couponDiscount ?? 0) - shippingCovered);
    // Con líneas sin costo no se sabe a qué productos aplica el descuento: se deja fuera
    const discount = missing === 0 ? productDiscount : 0;
    const revenue = sales - discount;
    const net = revenue - cost;
    return {
      known: g.items.length > missing,
      complete: missing === 0,
      missing,
      sales,
      cost,
      productDiscount: discount,
      profit: net,
      percent: revenue > 0 ? (net / revenue) * 100 : null,
    };
  }

  lineProfit(i: { unitCost: number | null; unitPrice: number; quantity: number }): number | null {
    return i.unitCost == null ? null : (i.unitPrice - i.unitCost) * i.quantity;
  }

  paymentMethodLabel(g: SellerOrderGroupDetail): string {
    return ({ MERCADO_PAGO: 'MercadoPago', TRANSFER: 'Transferencia', CASH: 'Efectivo', CASH_ON_DELIVERY: 'Contraentrega' } as Record<string, string>)[g.paymentMethod] ?? g.paymentMethod;
  }

  private changeText(c: OrderItemChange): string {
    const side = (label: string | null, q: number | null, p: number | null) =>
      label ? `${label} (${q} × ${this.money(p)})` : '';
    const before = side(c.oldLabel, c.oldQuantity, c.oldUnitPrice);
    const after = side(c.newLabel, c.newQuantity, c.newUnitPrice);
    return before && after ? `${before} → ${after}` : before || after;
  }

  private money(v: number | null | undefined): string {
    return '$' + Math.round(v ?? 0).toLocaleString('es-CO');
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
    this.menuOpenId.set(null);
    this.cancelReason.set('');
    this.cancelModal.set(groupId);
  }

  abortCancel() {
    this.cancelModal.set(null);
  }

  confirmCancel() {
    const groupId = this.cancelModal();
    const reason = this.cancelReason().trim();
    const storeId = this.storeId();
    if (groupId === null || !reason || !storeId) return;
    this.setLoading(groupId, true);
    this.orderService.cancelSellerGroup(storeId, groupId, reason).subscribe({
      next: () => {
        this.patchGroup(groupId, 'CANCELLED', { cancelledAt: new Date().toISOString(), cancellationReason: reason });
        this.abortCancel();
        this.setLoading(groupId, false);
        this.showToast('Pedido cancelado.', 'success');
      },
      error: err => {
        this.setLoading(groupId, false);
        this.showToast(apiMessage(err, 'No se pudo cancelar el pedido.'), 'error');
      },
    });
  }

  canRemoveShipping(g: SellerOrderGroupDetail): boolean {
    return g.status !== 'DELIVERED' && g.status !== 'CANCELLED' && g.shippingCost > 0;
  }

  startRemoveShipping(groupId: number) {
    this.menuOpenId.set(null);
    this.removeShippingReason.set('');
    this.removeShippingError.set('');
    this.removeShippingModal.set(groupId);
  }

  abortRemoveShipping() {
    this.removeShippingModal.set(null);
  }

  confirmRemoveShipping() {
    const groupId = this.removeShippingModal();
    if (groupId === null) return;
    const reason = this.removeShippingReason().trim();
    if (!reason || reason.length > 500) {
      this.removeShippingError.set(!reason ? 'El motivo es obligatorio.' : 'El motivo no puede superar los 500 caracteres.');
      return;
    }
    const storeId = this.storeId();
    if (!storeId) return;
    const group = this.groups().find(g => g.groupId === groupId);
    if (!group) return;
    const waived = group.shippingCost;
    this.removeShippingError.set('');
    this.setLoading(groupId, true);
    this.orderService.removeShippingCost(storeId, groupId, reason).subscribe({
      next: () => {
        this.patchGroup(groupId, group.status, {
          shippingCost: 0,
          orderTotal: group.orderTotal - waived,
          shippingCostWaived: waived,
          shippingRemovedAt: new Date().toISOString(),
          shippingRemovedReason: reason,
        });
        this.abortRemoveShipping();
        this.setLoading(groupId, false);
        this.showToast('Cobro de envío eliminado. Le avisamos al cliente por correo.', 'success');
      },
      error: err => {
        this.setLoading(groupId, false);
        const code = apiCode(err);

        if (code === 'VALIDATION_ERROR') {
          this.removeShippingError.set(apiMessage(err, 'El motivo es obligatorio.'));
          return;
        }
        if (code === 'ORDER_GROUP_INVALID_STATUS') {
          this.abortRemoveShipping();
          this.showToast('Ya no se puede modificar este pedido.', 'error');
          this.refreshGroup(storeId, groupId);
          return;
        }
        if (code === 'ORDER_GROUP_SHIPPING_ALREADY_REMOVED') {
          this.abortRemoveShipping();
          this.showToast('El envío ya fue quitado.', 'error');
          this.refreshGroup(storeId, groupId);
          return;
        }
        if (code === 'ORDER_GROUP_ACCESS_DENIED' || code === 'STORE_ACCESS_DENIED') {
          this.abortRemoveShipping();
          this.showToast('No tienes permiso para modificar este pedido.', 'error');
          return;
        }
        if (code === 'ORDER_GROUP_NOT_FOUND') {
          this.abortRemoveShipping();
          this.showToast('Este pedido ya no existe. Actualizando lista...', 'error');
          this.reloadGroups();
          return;
        }
        this.removeShippingError.set('No se pudo quitar el cobro de envío.');
      },
    });
  }

  private showToast(message: string, type: 'success' | 'error') {
    this.toastType.set(type);
    this.toastMsg.set(message);
  }

  private refreshGroup(storeId: number, groupId: number) {
    this.orderService.getSellerOrderGroupById(storeId, groupId).subscribe({
      next: fresh => this.groups.update(gs => gs.map(g => g.groupId === groupId ? fresh : g)),
      error: () => this.groups.update(gs => gs.filter(g => g.groupId !== groupId)),
    });
  }

  private reloadGroups() {
    const storeId = this.storeId();
    if (!storeId) return;
    this.orderService.getSellerOrderGroups(storeId).subscribe({
      next: groups => this.groups.set(groups),
      error: () => {},
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

  // ── Edición de productos ─────────────────────────────────────

  canEditItems(g: SellerOrderGroupDetail): boolean {
    return (g.status === 'PENDING' || g.status === 'PREPARING') && g.orderPaymentStatus !== 'CANCELLED';
  }

  openItemsEditor(groupId: number) {
    this.menuOpenId.set(null);
    this.lastPaymentUrl.set(null);
    this.editingGroupId.set(groupId);
  }

  onItemsSaved(res: EditOrderItemsResult) {
    const storeId = this.storeId();
    this.editingGroupId.set(null);
    let msg = 'Productos actualizados. Le enviamos un correo al cliente con los cambios.';
    if (res.balanceDue && res.balanceDue > 0) msg += ' Quedó una diferencia por cobrar.';
    if (res.balanceDue && res.balanceDue < 0) msg += ' Quedó un saldo a favor del cliente.';
    if (res.paymentUrl) {
      this.lastPaymentUrl.set({ groupId: res.groupId, url: res.paymentUrl });
      msg += ' Se generó un link nuevo de MercadoPago.';
    }
    this.showToast(msg, 'success');
    this.itemChanges.update(m => { const n = { ...m }; delete n[res.groupId]; return n; });
    if (storeId) this.refreshGroup(storeId, res.groupId);
    this.loadItemChanges(res.groupId);
  }

  copyPaymentUrl() {
    const link = this.lastPaymentUrl();
    if (!link) return;
    navigator.clipboard?.writeText(link.url).then(
      () => this.showToast('Link copiado.', 'success'),
      () => this.showToast('No se pudo copiar el link.', 'error'));
  }

  settleBalance(g: SellerOrderGroupDetail) {
    const storeId = this.storeId();
    if (!storeId) return;
    const what = (g.balanceDue ?? 0) > 0 ? 'cobraste la diferencia' : 'le devolviste el saldo al cliente';
    if (!confirm(`¿Confirmas que ya ${what}?`)) return;
    this.setLoading(g.groupId, true);
    this.orderService.settleSellerBalance(storeId, g.groupId).subscribe({
      next: () => {
        this.setLoading(g.groupId, false);
        this.showToast('Diferencia marcada como saldada.', 'success');
        this.refreshGroup(storeId, g.groupId);
      },
      error: err => {
        this.setLoading(g.groupId, false);
        this.showToast(apiCode(err) === 'ORDER_PAYMENT_OTHER_STORES'
          ? 'El pedido incluye productos de otras tiendas: la diferencia la salda el administrador.'
          : apiMessage(err, 'No se pudo marcar como saldada.'), 'error');
      },
    });
  }

  private loadItemChanges(groupId: number) {
    const storeId = this.storeId();
    if (!storeId || this.itemChanges()[groupId]) return;
    this.orderService.getSellerGroupItemChanges(storeId, groupId).subscribe({
      next: cs => this.itemChanges.update(m => ({ ...m, [groupId]: cs })),
      error: () => this.itemChanges.update(m => ({ ...m, [groupId]: [] })),
    });
  }

  changeTypeLabel(type: string): string {
    return ({ REPLACED: 'Reemplazado', UPDATED: 'Modificado', ADDED: 'Agregado', REMOVED: 'Retirado' } as Record<string, string>)[type] ?? type;
  }

  /** Pago en efectivo o transferencia pendiente: el seller lo confirma cuando recibe el dinero. */
  canConfirmPayment(g: SellerOrderGroupDetail): boolean {
    return g.orderPaymentStatus === 'PENDING'
      && (g.paymentMethod === 'CASH' || g.paymentMethod === 'TRANSFER')
      && g.status !== 'CANCELLED';
  }

  confirmPayment(groupId: number) {
    const storeId = this.storeId();
    if (!storeId) return;
    this.setLoading(groupId, true);
    this.orderService.confirmSellerPayment(storeId, groupId).subscribe({
      next: () => {
        this.setLoading(groupId, false);
        this.showToast('Pago confirmado. Le avisamos al cliente por correo.', 'success');
        this.refreshGroup(storeId, groupId);
      },
      error: err => {
        this.setLoading(groupId, false);
        const code = apiCode(err);
        if (code === 'PAYMENT_ORDER_NOT_PENDING') {
          this.showToast('Este pago ya estaba confirmado.', 'error');
          this.refreshGroup(storeId, groupId);
        } else if (code === 'ORDER_PAYMENT_OTHER_STORES') {
          this.showToast('El pedido incluye productos de otras tiendas: el pago lo confirma el administrador.', 'error');
        } else if (code === 'STORE_ACCESS_DENIED') {
          this.showToast('Solo el dueño o el administrador de la tienda puede confirmar pagos.', 'error');
        } else {
          this.showToast(apiMessage(err, 'No se pudo confirmar el pago.'), 'error');
        }
      },
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
