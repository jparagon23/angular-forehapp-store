import { Component, computed, effect, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of, catchError } from 'rxjs';
import { SupplierSyncService } from '../../../core/services/supplier-sync.service';
import {
  SupplierItem, SupplierLink, SupplierLinkFilter, SyncConfig, SyncEvent, SyncEventType, SyncMode, SyncRun,
} from '../../../core/models/supplier-sync.model';
import { apiMessage } from '../../../core/models/api-error.model';
import { selectActiveSellerStoreId } from '../../../store/seller/seller.selectors';
import { CurrencyCopPipe } from '../../../shared/pipes/currency-cop.pipe';
import { ToastComponent } from '../../../shared/components/toast/toast.component';

const MIN_MARGIN = 5;
const HIGH_SCORE = 0.85;

interface EventGroup {
  type: SyncEventType;
  label: string;
  oldLabel: string | null;
  newLabel: string | null;
  tone: 'bad' | 'good' | 'warn' | 'info';
  events: SyncEvent[];
}

const EVENT_GROUPS: Omit<EventGroup, 'events'>[] = [
  { type: 'MARGIN_ALERT',  label: 'Margen bajo',                              oldLabel: 'Venta / proveedor', newLabel: 'Margen',      tone: 'bad'  },
  { type: 'DISABLED',      label: 'Apagadas (agotadas en Profitness)',        oldLabel: 'Stock anterior',    newLabel: 'Stock',       tone: 'bad'  },
  { type: 'REENABLED',     label: 'Reactivadas',                              oldLabel: 'Stock anterior',    newLabel: 'Stock',       tone: 'good' },
  { type: 'ORDER_AT_RISK', label: 'Pedidos abiertos con productos agotados',  oldLabel: 'Pedido',            newLabel: 'Cantidad',    tone: 'warn' },
  { type: 'BROKEN_LINK',   label: 'Parejas rotas (ya no están en Profitness)', oldLabel: null,               newLabel: null,          tone: 'warn' },
  { type: 'COST_UPDATED',  label: 'Costos actualizados',                      oldLabel: 'Costo anterior',    newLabel: 'Costo nuevo', tone: 'info' },
  { type: 'RELEASED',      label: 'Repuestas a mano',                         oldLabel: null,                newLabel: 'Stock',       tone: 'info' },
];

@Component({
  selector: 'app-seller-supplier-sync',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule, DatePipe, DecimalPipe, CurrencyCopPipe, ToastComponent],
  templateUrl: './seller-supplier-sync.component.html',
  styleUrl: './seller-supplier-sync.component.scss',
})
export class SellerSupplierSyncComponent {
  private svc     = inject(SupplierSyncService);
  private ngrx    = inject(Store);
  private storeId = toSignal(this.ngrx.select(selectActiveSellerStoreId), { initialValue: null });

  readonly minMargin = MIN_MARGIN;
  readonly highScore = HIGH_SCORE;
  readonly tabs: { value: SupplierLinkFilter; label: string }[] = [
    { value: 'SUGGESTED',    label: 'Por revisar' },
    { value: 'CONFIRMED',    label: 'Confirmadas' },
    { value: 'UNLINKED',     label: 'Sin pareja' },
    { value: 'NOT_SUPPLIED', label: 'No se compran a Profitness' },
    { value: 'REJECTED',     label: 'Descartadas' },
  ];

  // ── Configuración ────────────────────────────────────────────
  config        = signal<SyncConfig | null>(null);
  configEnabled = signal(false);
  configMode    = signal<SyncMode>('PREVIEW');
  savingConfig  = signal(false);
  configDirty   = computed(() => {
    const c = this.config();
    return !!c && (c.enabled !== this.configEnabled() || c.mode !== this.configMode());
  });

  // ── Historial ────────────────────────────────────────────────
  runs           = signal<SyncRun[]>([]);
  selectedRun    = signal<SyncRun | null>(null);
  events         = signal<SyncEvent[]>([]);
  loadingEvents  = signal(false);
  eventGroups    = computed<EventGroup[]>(() => EVENT_GROUPS
    .map(g => ({ ...g, events: this.events().filter(e => e.type === g.type) }))
    .filter(g => g.events.length > 0));

  // ── Parejas ──────────────────────────────────────────────────
  activeTab    = signal<SupplierLinkFilter>('SUGGESTED');
  links        = signal<SupplierLink[]>([]);
  loadingLinks = signal(true);
  linksError   = signal('');
  filterText   = signal('');
  selected     = signal<Set<number>>(new Set());
  busyVariant  = signal<number | null>(null);
  confirming   = signal(false);

  visibleLinks = computed(() => {
    const q = this.normalize(this.filterText());
    if (!q) return this.links();
    return this.links().filter(l => this.normalize(
      `${l.variant.productTitle} ${l.variant.sku ?? ''} ${l.variant.attributes ?? ''} ${l.supplierItem?.name ?? ''}`
    ).includes(q));
  });
  selectableIds = computed(() => this.visibleLinks()
    .filter(l => l.linkId !== null && (l.status === 'SUGGESTED' || l.status === 'REJECTED'))
    .map(l => l.linkId!));

  // ── Modal de emparejar / cambiar ─────────────────────────────
  pickerFor      = signal<SupplierLink | null>(null);
  pickerQuery    = signal('');
  pickerResults  = signal<SupplierItem[]>([]);
  pickerLoading  = signal(false);
  private search$ = new Subject<string>();

  toastMsg  = signal('');
  toastType = signal<'success' | 'error'>('success');

  constructor() {
    effect(() => {
      if (this.storeId()) {
        this.loadConfig();
        this.loadRuns();
        this.loadLinks();
      }
    }, { allowSignalWrites: true });

    this.search$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(q => {
        const storeId = this.storeId();
        if (!storeId) return of([] as SupplierItem[]);
        this.pickerLoading.set(true);
        return this.svc.searchItems(storeId, q).pipe(catchError(() => of([] as SupplierItem[])));
      }),
    ).subscribe(items => {
      this.pickerResults.set(items);
      this.pickerLoading.set(false);
    });
  }

  // ── Configuración ────────────────────────────────────────────

  private loadConfig() {
    this.svc.getConfig(this.storeId()!).subscribe({
      next: c => {
        this.config.set(c);
        this.configEnabled.set(c.enabled);
        this.configMode.set(c.mode);
      },
      error: err => this.toast(apiMessage(err, 'No se pudo cargar la configuración.'), 'error'),
    });
  }

  saveConfig() {
    const storeId = this.storeId();
    if (!storeId) return;
    const goingLive = this.configEnabled() && this.configMode() === 'APPLY'
      && !(this.config()?.enabled && this.config()?.mode === 'APPLY');
    if (goingLive && !confirm(
      'A partir de la próxima sincronización se pondrán en stock 0 las variantes confirmadas que estén ' +
      'agotadas en Profitness, se reactivarán cuando vuelvan y se actualizarán sus costos. ¿Continuar?')) {
      return;
    }
    this.savingConfig.set(true);
    this.svc.updateConfig(storeId, this.configEnabled(), this.configMode()).subscribe({
      next: c => {
        this.config.set(c);
        this.savingConfig.set(false);
        this.toast('Configuración guardada.');
      },
      error: err => {
        this.savingConfig.set(false);
        this.toast(apiMessage(err, 'No se pudo guardar la configuración.'), 'error');
      },
    });
  }

  // ── Historial ────────────────────────────────────────────────

  private loadRuns() {
    this.svc.getRuns(this.storeId()!, 10).subscribe({
      next: runs => {
        this.runs.set(runs);
        if (runs.length) this.selectRun(runs[0]);
      },
    });
  }

  selectRun(run: SyncRun) {
    this.selectedRun.set(run);
    this.events.set([]);
    this.loadingEvents.set(true);
    this.svc.getRunEvents(this.storeId()!, run.id).subscribe({
      next: events => { this.events.set(events); this.loadingEvents.set(false); },
      error: () => this.loadingEvents.set(false),
    });
  }

  runStatusLabel(run: SyncRun): string {
    return run.status === 'APPLIED' ? 'Aplicada' : run.status === 'PREVIEW' ? 'Vista previa' : 'Detenida';
  }

  // ── Parejas ──────────────────────────────────────────────────

  setTab(tab: SupplierLinkFilter) {
    this.activeTab.set(tab);
    this.loadLinks();
  }

  loadLinks() {
    const storeId = this.storeId();
    if (!storeId) return;
    this.loadingLinks.set(true);
    this.linksError.set('');
    this.selected.set(new Set());
    this.svc.getLinks(storeId, this.activeTab()).subscribe({
      next: links => { this.links.set(links); this.loadingLinks.set(false); },
      error: err => {
        this.linksError.set(apiMessage(err, 'No se pudieron cargar las parejas.'));
        this.loadingLinks.set(false);
      },
    });
  }

  isSelected(link: SupplierLink): boolean {
    return link.linkId !== null && this.selected().has(link.linkId);
  }

  toggle(link: SupplierLink) {
    if (link.linkId === null) return;
    const next = new Set(this.selected());
    next.has(link.linkId) ? next.delete(link.linkId) : next.add(link.linkId);
    this.selected.set(next);
  }

  toggleAll() {
    const ids = this.selectableIds();
    const allSelected = ids.length > 0 && ids.every(id => this.selected().has(id));
    this.selected.set(allSelected ? new Set() : new Set(ids));
  }

  selectHighScore() {
    this.selected.set(new Set(this.visibleLinks()
      .filter(l => l.linkId !== null && l.status === 'SUGGESTED' && (l.score ?? 0) >= HIGH_SCORE)
      .map(l => l.linkId!)));
  }

  confirmSelected() {
    this.confirm([...this.selected()]);
  }

  confirm(linkIds: number[]) {
    const storeId = this.storeId();
    if (!storeId || !linkIds.length) return;
    this.confirming.set(true);
    this.svc.confirmLinks(storeId, linkIds).subscribe({
      next: confirmed => {
        this.removeFromList(confirmed.map(l => l.variant.variantId));
        this.selected.set(new Set());
        this.confirming.set(false);
        this.toast(`${confirmed.length} pareja(s) confirmada(s).`);
      },
      error: err => {
        this.confirming.set(false);
        this.toast(apiMessage(err, 'No se pudieron confirmar las parejas.'), 'error');
      },
    });
  }

  reject(link: SupplierLink) {
    const storeId = this.storeId();
    if (!storeId || link.linkId === null) return;
    this.busyVariant.set(link.variant.variantId);
    this.svc.rejectLink(storeId, link.linkId).subscribe({
      next: () => this.afterRowAction(link, 'Pareja descartada.'),
      error: err => this.rowError(err),
    });
  }

  markNotSupplied(link: SupplierLink) {
    const storeId = this.storeId();
    if (!storeId) return;
    this.busyVariant.set(link.variant.variantId);
    this.svc.markNotSupplied(storeId, link.variant.variantId).subscribe({
      next: () => this.afterRowAction(link, 'Marcada como "no se compra a Profitness".'),
      error: err => this.rowError(err),
    });
  }

  unlink(link: SupplierLink) {
    const storeId = this.storeId();
    if (!storeId) return;
    if (link.disabledBySync && !confirm(
      'La sincronización tiene esta variante en stock 0. Al quitar la pareja se le devolverá el stock. ¿Continuar?')) {
      return;
    }
    this.busyVariant.set(link.variant.variantId);
    this.svc.unlink(storeId, link.variant.variantId).subscribe({
      next: () => this.afterRowAction(link, 'Pareja quitada.'),
      error: err => this.rowError(err),
    });
  }

  marginIsLow(link: SupplierLink): boolean {
    return link.marginPercent !== null && link.marginPercent < MIN_MARGIN;
  }

  // ── Modal de emparejar / cambiar ─────────────────────────────

  openPicker(link: SupplierLink) {
    this.pickerFor.set(link);
    const initial = link.variant.productTitle;
    this.pickerQuery.set(initial);
    this.pickerResults.set([]);
    this.search$.next(initial);
  }

  closePicker() {
    this.pickerFor.set(null);
  }

  onPickerInput(value: string) {
    this.pickerQuery.set(value);
    this.search$.next(value.trim());
  }

  pick(item: SupplierItem) {
    const storeId = this.storeId();
    const link = this.pickerFor();
    if (!storeId || !link) return;
    this.busyVariant.set(link.variant.variantId);
    this.svc.linkManually(storeId, link.variant.variantId, item.id).subscribe({
      next: () => {
        this.closePicker();
        this.afterRowAction(link, 'Pareja confirmada.');
      },
      error: err => this.rowError(err),
    });
  }

  // ── Helpers ──────────────────────────────────────────────────

  private afterRowAction(link: SupplierLink, message: string) {
    this.removeFromList([link.variant.variantId]);
    this.busyVariant.set(null);
    this.toast(message);
  }

  private rowError(err: unknown) {
    this.busyVariant.set(null);
    this.toast(apiMessage(err, 'No se pudo completar la acción.'), 'error');
  }

  private removeFromList(variantIds: number[]) {
    const ids = new Set(variantIds);
    this.links.update(list => list.filter(l => !ids.has(l.variant.variantId)));
  }

  private toast(message: string, type: 'success' | 'error' = 'success') {
    this.toastType.set(type);
    this.toastMsg.set('');
    setTimeout(() => this.toastMsg.set(message));
  }

  private normalize(text: string): string {
    return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  }
}
