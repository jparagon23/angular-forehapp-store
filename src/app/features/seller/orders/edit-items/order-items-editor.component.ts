import { Component, EventEmitter, Input, OnInit, Output, computed, inject, signal } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { take } from 'rxjs/operators';
import { OrderService } from '../../../../core/services/order.service';
import { SellerProductService } from '../../../../core/services/seller-product.service';
import { EditOrderItemsResult, SellerOrderGroupDetail } from '../../../../core/models/order.model';
import { ProductVariant, SellerProduct, isSellable } from '../../../../core/models/seller-product.model';
import { apiCode, apiMessage } from '../../../../core/models/api-error.model';
import { CurrencyCopPipe } from '../../../../shared/pipes/currency-cop.pipe';

/** Una línea del pedido mientras se edita. itemId vacío = producto agregado. */
interface EditLine {
  key: number;
  itemId?: number;
  variantId: number;
  label: string;
  quantity: number;
  unitPrice: number;
  /** Cómo estaba la línea al abrir el editor (para marcar lo que cambió). */
  original?: { variantId: number; label: string; quantity: number; unitPrice: number };
}

/**
 * Editor de productos de un pedido (antes de enviarlo): reemplazar, cambiar cantidad o precio,
 * quitar y agregar. Al guardar, el back ajusta stock, totales y pago, y le avisa al comprador.
 */
@Component({
  selector: 'app-order-items-editor',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule, CurrencyCopPipe],
  templateUrl: './order-items-editor.component.html',
  styleUrl: './order-items-editor.component.scss',
})
export class OrderItemsEditorComponent implements OnInit {
  @Input({ required: true }) storeId!: number;
  @Input({ required: true }) group!: SellerOrderGroupDetail;
  @Output() saved  = new EventEmitter<EditOrderItemsResult>();
  @Output() closed = new EventEmitter<void>();

  private orderService   = inject(OrderService);
  private productService = inject(SellerProductService);

  private nextKey = 1;
  lines   = signal<EditLine[]>([]);
  reason  = signal('');
  saving  = signal(false);
  error   = signal('');

  // ── Selector de productos ────────────────────────────────────
  /** null = cerrado; 'add' = agregar; número = reemplazar esa línea (key). */
  pickerFor       = signal<'add' | number | null>(null);
  products        = signal<SellerProduct[]>([]);
  productQuery    = signal('');
  openProduct     = signal<SellerProduct | null>(null);
  openVariants    = signal<ProductVariant[]>([]);
  loadingVariants = signal(false);

  productMatches = computed(() => {
    const q = this.normalize(this.productQuery());
    if (!q) return [];
    return this.products()
      .filter(p => p.status === 'ACTIVE' || p.status === 'OUT_OF_STOCK')
      .filter(p => this.normalize(`${p.title} ${p.brand}`).includes(q))
      .slice(0, 8);
  });

  // ── Resumen ──────────────────────────────────────────────────
  subtotal = computed(() => this.lines().reduce((s, l) => s + (Number(l.unitPrice) || 0) * (Number(l.quantity) || 0), 0));
  difference = computed(() => Math.round((this.subtotal() - this.group.subtotal) * 100) / 100);

  removedCount = computed(() => {
    const kept = new Set(this.lines().filter(l => l.itemId).map(l => l.itemId));
    return this.group.items.filter(i => !kept.has(i.itemId)).length;
  });

  hasChanges = computed(() => this.removedCount() > 0 || this.lines().some(l => this.lineStatus(l) !== null));

  invalidLine = computed(() => this.lines().some(l =>
    !Number.isInteger(Number(l.quantity)) || Number(l.quantity) < 1 || Number(l.unitPrice) < 0 || l.unitPrice === null));

  canSave = computed(() => this.hasChanges() && this.lines().length > 0 && !this.invalidLine()
    && this.reason().trim().length > 0 && !this.saving());

  paid = computed(() => this.group.orderPaymentStatus === 'PAID' || this.group.orderPaymentStatus === 'PAYMENT_CONFIRMED');

  ngOnInit() {
    this.lines.set(this.group.items.map(i => {
      const label = this.itemLabel(i.productTitle, i.attributes.map(a => a.value));
      return {
        key: this.nextKey++, itemId: i.itemId, variantId: i.variantId, label,
        quantity: i.quantity, unitPrice: i.unitPrice,
        original: { variantId: i.variantId, label, quantity: i.quantity, unitPrice: i.unitPrice },
      };
    }));
    this.productService.getSellerProducts(this.storeId).pipe(take(1)).subscribe(ps => this.products.set(ps));
  }

  /** Mantiene las filas (y el foco de sus campos) aunque cada edición cree una línea nueva. */
  trackLine = (_: number, l: EditLine) => l.key;

  /** null si la línea no cambió. */
  lineStatus(l: EditLine): 'Agregado' | 'Reemplazado' | 'Modificado' | null {
    if (!l.original) return 'Agregado';
    if (l.variantId !== l.original.variantId) return 'Reemplazado';
    if (Number(l.quantity) !== l.original.quantity || Number(l.unitPrice) !== l.original.unitPrice) return 'Modificado';
    return null;
  }

  setQuantity(key: number, value: number) {
    this.lines.update(ls => ls.map(l => l.key === key ? { ...l, quantity: Math.floor(Number(value)) || 0 } : l));
  }

  setPrice(key: number, value: number) {
    this.lines.update(ls => ls.map(l => l.key === key ? { ...l, unitPrice: Number(value) } : l));
  }

  removeLine(key: number) {
    this.lines.update(ls => ls.filter(l => l.key !== key));
    if (this.pickerFor() === key) this.closePicker();
  }

  /** Deshace los cambios de una línea que ya estaba en el pedido. */
  restoreLine(key: number) {
    this.lines.update(ls => ls.map(l => l.key === key && l.original
      ? { ...l, variantId: l.original.variantId, label: l.original.label, quantity: l.original.quantity, unitPrice: l.original.unitPrice }
      : l));
  }

  restoreRemoved() {
    const kept = new Set(this.lines().filter(l => l.itemId).map(l => l.itemId));
    const back = this.group.items.filter(i => !kept.has(i.itemId)).map(i => {
      const label = this.itemLabel(i.productTitle, i.attributes.map(a => a.value));
      return { key: this.nextKey++, itemId: i.itemId, variantId: i.variantId, label, quantity: i.quantity,
        unitPrice: i.unitPrice, original: { variantId: i.variantId, label, quantity: i.quantity, unitPrice: i.unitPrice } };
    });
    this.lines.update(ls => [...ls, ...back]);
  }

  // ── Selector ─────────────────────────────────────────────────

  openPicker(target: 'add' | number) {
    this.pickerFor.set(target);
    this.productQuery.set('');
    this.openProduct.set(null);
    this.openVariants.set([]);
  }

  closePicker() {
    this.pickerFor.set(null);
    this.openProduct.set(null);
    this.openVariants.set([]);
  }

  pickProduct(p: SellerProduct) {
    this.openProduct.set(p);
    this.openVariants.set([]);
    this.loadingVariants.set(true);
    this.productService.getProduct(this.storeId, p.id).pipe(take(1)).subscribe({
      next: detail => {
        this.openVariants.set(detail.variants.filter(v => v.active));
        this.loadingVariants.set(false);
      },
      error: () => this.loadingVariants.set(false),
    });
  }

  chooseVariant(v: ProductVariant) {
    const product = this.openProduct();
    const target = this.pickerFor();
    if (!product || target === null) return;
    const label = this.itemLabel(product.title, v.attributes.map(a => a.value));
    if (target === 'add') {
      this.lines.update(ls => [...ls, { key: this.nextKey++, variantId: v.id, label, quantity: 1, unitPrice: v.price }]);
    } else {
      // Precio del nuevo producto por defecto; el seller puede dejar el anterior u otro
      this.lines.update(ls => ls.map(l => l.key === target ? { ...l, variantId: v.id, label, unitPrice: v.price } : l));
    }
    this.closePicker();
  }

  readonly isSellable = isSellable;

  stockLabel(v: ProductVariant): string {
    if (!v.dropship) return `stock ${v.stock}`;
    return v.supplierAvailable === false ? `stock ${v.stock} · proveedor agotado` : `stock ${v.stock} + proveedor`;
  }

  variantLabel(v: ProductVariant): string {
    return v.attributes.map(a => `${a.attribute}: ${a.value}`).join(' · ') || v.sku || `Variante #${v.id}`;
  }

  // ── Guardar ──────────────────────────────────────────────────

  save() {
    if (!this.canSave()) return;
    this.saving.set(true);
    this.error.set('');
    const items = this.lines().map(l => ({
      itemId: l.itemId, variantId: l.variantId, quantity: Number(l.quantity), unitPrice: Number(l.unitPrice),
    }));
    this.orderService.editSellerGroupItems(this.storeId, this.group.groupId, this.reason().trim(), items)
      .pipe(take(1)).subscribe({
        next: res => { this.saving.set(false); this.saved.emit(res); },
        error: err => { this.saving.set(false); this.error.set(this.errorMessage(err)); },
      });
  }

  private errorMessage(err: unknown): string {
    switch (apiCode(err)) {
      case 'ORDER_INSUFFICIENT_STOCK':   return 'No hay stock suficiente: ' + apiMessage(err, '').replace('Insufficient stock for: ', '');
      case 'ORDER_GROUP_INVALID_STATUS': return 'El pedido ya fue enviado o cancelado; no se pueden cambiar sus productos.';
      case 'ORDER_EDIT_VARIANT_INVALID': return 'Uno de los productos elegidos no está activo o no es de tu tienda.';
      case 'ORDER_EDIT_NO_CHANGES':      return 'No hiciste ningún cambio.';
      case 'ORDER_EDIT_ITEM_NOT_FOUND':  return 'El pedido cambió mientras lo editabas. Cierra y vuelve a abrir el editor.';
      case 'STORE_ACCESS_DENIED':        return 'Solo el dueño o el administrador de la tienda puede cambiar productos de un pedido.';
      default:                           return apiMessage(err, 'No se pudieron guardar los cambios.');
    }
  }

  private itemLabel(title: string, values: string[]): string {
    return values.length ? `${title} (${values.join(' · ')})` : title;
  }

  private normalize(text: string): string {
    return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  }
}
