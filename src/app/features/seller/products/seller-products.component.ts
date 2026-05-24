import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { AsyncPipe, CurrencyPipe, DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Actions, ofType } from '@ngrx/effects';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  adjustSellerInventory,
  changeSellerProductStatus,
  changeSellerProductStatusSuccess,
  deleteSellerProduct,
  loadSellerProducts,
  sellerActionFailure,
} from '../../../store/seller/seller.actions';
import {
  selectActiveSellerStoreId,
  selectSellerInventoryLoading,
  selectSellerLoading,
  selectSellerProducts,
} from '../../../store/seller/seller.selectors';
import { ToastComponent } from '../../../shared/components/toast/toast.component';
import {
  InventoryMovement, InventoryRequest, MovementReason,
  MovementsPage, ProductStatus, ProductVariant, SellerProduct,
} from '../../../core/models/seller-product.model';
import { SellerProductService } from '../../../core/services/seller-product.service';

@Component({
  selector: 'app-seller-products',
  standalone: true,
  imports: [AsyncPipe, NgFor, NgIf, NgClass, RouterLink, CurrencyPipe, DatePipe, FormsModule, ToastComponent],
  templateUrl: './seller-products.component.html',
  styleUrl: './seller-products.component.scss',
})
export class SellerProductsComponent implements OnInit {
  private store         = inject(Store);
  private sellerService = inject(SellerProductService);
  private actions$      = inject(Actions);
  private destroyRef    = inject(DestroyRef);

  loading$    = this.store.select(selectSellerLoading);
  invLoading$ = this.store.select(selectSellerInventoryLoading);

  private storeId = toSignal(this.store.select(selectActiveSellerStoreId), { initialValue: null });

  allProducts = toSignal(this.store.select(selectSellerProducts), { initialValue: [] as SellerProduct[] });

  togglingVariantId  = signal<number | null>(null);
  variantToggleError = signal<string | null>(null);

  searchQuery  = signal('');
  statusFilter = signal<ProductStatus | null>(null);

  filteredProducts = computed(() => {
    const q      = this.searchQuery().toLowerCase().trim();
    const status = this.statusFilter();
    return this.allProducts().filter(p => {
      const matchesSearch = !q
        || p.title.toLowerCase().includes(q)
        || p.brand.toLowerCase().includes(q)
        || p.category.toLowerCase().includes(q)
        || p.variants.some(v => (v.sku ?? '').toLowerCase().includes(q));
      const matchesStatus = !status || p.status === status;
      return matchesSearch && matchesStatus;
    });
  });

  hasFilters = computed(() => !!this.searchQuery() || this.statusFilter() !== null);

  toastMsg  = signal('');
  toastType = signal<'success' | 'error'>('success');

  expandedId = signal<number | null>(null);

  // Movements history modal state
  movOpen         = signal(false);
  movProductId    = signal(0);
  movVariantId    = signal(0);
  movSku          = signal('');
  movLoading      = signal(false);
  movError        = signal('');
  movements       = signal<InventoryMovement[]>([]);
  movPage         = signal(0);
  movTotalPages   = signal(0);
  movTotalItems   = signal(0);
  movIsFirst      = signal(true);
  movIsLast       = signal(true);
  movReasonFilter = signal<MovementReason | null>(null);
  readonly movPageSize = 10;

  // Inventory modal state
  invOpen      = signal(false);
  invProductId = signal(0);
  invVariantId = signal(0);
  invSku       = signal('');
  invStock     = signal(0);
  invQuantity  = signal<number | null>(null);
  invReason    = signal<InventoryRequest['reason']>('RESTOCK');
  invError     = signal('');

  constructor() {
    this.actions$.pipe(ofType(sellerActionFailure), takeUntilDestroyed(this.destroyRef))
      .subscribe(({ error }) => {
        this.toastType.set('error');
        this.toastMsg.set(error);
      });

    this.actions$.pipe(ofType(changeSellerProductStatusSuccess), takeUntilDestroyed(this.destroyRef))
      .subscribe(({ product }) => {
        const label: Record<string, string> = {
          ACTIVE: 'Producto publicado', INACTIVE: 'Producto desactivado',
          DRAFT: 'Producto guardado como borrador', OUT_OF_STOCK: 'Producto sin stock',
        };
        this.toastType.set('success');
        this.toastMsg.set(label[product.status] ?? 'Estado actualizado');
      });
  }

  ngOnInit() { this.store.dispatch(loadSellerProducts()); }

  clearFilters() { this.searchQuery.set(''); this.statusFilter.set(null); }

  toggleExpand(id: number) {
    this.expandedId.update(cur => cur === id ? null : id);
  }

  openMovements(p: SellerProduct, v: ProductVariant, e: Event) {
    e.stopPropagation();
    this.movProductId.set(p.id);
    this.movVariantId.set(v.id);
    this.movSku.set(v.sku ?? '—');
    this.movPage.set(0);
    this.movReasonFilter.set(null);
    this.movOpen.set(true);
    this.fetchMovements();
  }

  setMovFilter(reason: MovementReason | null) {
    this.movReasonFilter.set(reason);
    this.movPage.set(0);
    this.fetchMovements();
  }

  movPrev() { if (!this.movIsFirst()) { this.movPage.update(p => p - 1); this.fetchMovements(); } }
  movNext() { if (!this.movIsLast())  { this.movPage.update(p => p + 1); this.fetchMovements(); } }

  closeMovements() { this.movOpen.set(false); }

  private fetchMovements() {
    this.movLoading.set(true);
    this.movError.set('');
    const reason = this.movReasonFilter() ?? undefined;
    this.sellerService.getInventoryMovements(
      this.movProductId(), this.movVariantId(),
      { page: this.movPage(), size: this.movPageSize, reason }
    ).subscribe({
      next: (page: MovementsPage) => {
        this.movements.set(page.content);
        this.movTotalPages.set(page.totalPages);
        this.movTotalItems.set(page.totalElements);
        this.movIsFirst.set(page.first);
        this.movIsLast.set(page.last);
        this.movLoading.set(false);
      },
      error: err => {
        this.movError.set(err.error?.message ?? 'Error al cargar el historial.');
        this.movLoading.set(false);
      },
    });
  }

  movReasonLabel(r: MovementReason): string {
    const map: Record<MovementReason, string> = {
      RESTOCK: 'Reposición', RETURN: 'Devolución', ADJUSTMENT: 'Ajuste', SALE: 'Venta',
    };
    return map[r];
  }

  movReasonClass(r: MovementReason): string {
    const map: Record<MovementReason, string> = {
      RESTOCK: 'mov-restock', RETURN: 'mov-return', ADJUSTMENT: 'mov-adj', SALE: 'mov-sale',
    };
    return map[r];
  }

  openInvModal(p: SellerProduct, v: ProductVariant, e: Event) {
    e.stopPropagation();
    this.invProductId.set(p.id);
    this.invVariantId.set(v.id);
    this.invSku.set(v.sku ?? '—');
    this.invStock.set(v.stock);
    this.invQuantity.set(null);
    this.invReason.set('RESTOCK');
    this.invError.set('');
    this.invOpen.set(true);
  }

  closeInvModal() { this.invOpen.set(false); }

  submitInventory() {
    const qty = this.invQuantity();
    if (!qty) {
      this.invError.set('La cantidad no puede ser 0.');
      return;
    }
    if (qty < 0 && this.invReason() !== 'ADJUSTMENT') {
      this.invError.set('Solo "Ajuste manual" permite cantidades negativas.');
      return;
    }
    this.store.dispatch(adjustSellerInventory({
      productId: this.invProductId(),
      variantId: this.invVariantId(),
      quantity: qty,
      reason: this.invReason(),
    }));
    this.invOpen.set(false);
  }

  toggleVariant(p: SellerProduct, v: ProductVariant, e: Event) {
    e.stopPropagation();
    const storeId = this.storeId();
    if (!storeId || this.togglingVariantId() !== null) return;
    this.togglingVariantId.set(v.id);
    this.variantToggleError.set(null);
    const call = v.active
      ? this.sellerService.deactivateVariant(storeId, p.id, v.id)
      : this.sellerService.activateVariant(storeId, p.id, v.id);
    call.subscribe({
      next: () => {
        this.togglingVariantId.set(null);
        this.store.dispatch(loadSellerProducts());
      },
      error: err => {
        const code: string = err.error?.errorCode ?? '';
        const msg = code === 'PRODUCT_VARIANT_LAST_ACTIVE'
          ? 'No puedes desactivar la última variante activa. Desactiva el producto completo.'
          : (err.error?.message ?? 'No se pudo cambiar el estado de la variante.');
        this.toastType.set('error');
        this.toastMsg.set(msg);
        this.togglingVariantId.set(null);
      },
    });
  }

  statusLabel(s: ProductStatus): string {
    const map: Record<ProductStatus, string> = {
      DRAFT: 'Borrador', ACTIVE: 'Activo', INACTIVE: 'Inactivo', OUT_OF_STOCK: 'Sin stock',
    };
    return map[s];
  }

  statusClass(s: ProductStatus): string {
    const map: Record<ProductStatus, string> = {
      DRAFT: 'status-draft', ACTIVE: 'status-active',
      INACTIVE: 'status-inactive', OUT_OF_STOCK: 'status-out',
    };
    return map[s];
  }

  activeVariantCount(variants: ProductVariant[]): number {
    return variants.filter(v => v.active).length;
  }

  minPrice(variants: ProductVariant[]): number {
    const active = variants.filter(v => v.active);
    if (!active.length) return 0;
    return Math.min(...active.map(v => v.price));
  }

  delete(id: number) {
    if (confirm('¿Eliminar este producto? Solo se pueden eliminar borradores.')) {
      this.store.dispatch(deleteSellerProduct({ id }));
    }
  }

  publish(id: number)    { this.store.dispatch(changeSellerProductStatus({ id, action: 'publish' })); }
  deactivate(id: number) { this.store.dispatch(changeSellerProductStatus({ id, action: 'deactivate' })); }
  activate(id: number)   { this.store.dispatch(changeSellerProductStatus({ id, action: 'activate' })); }
}
