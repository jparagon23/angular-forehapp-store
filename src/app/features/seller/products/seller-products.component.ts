import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { AsyncPipe, CurrencyPipe, DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Actions, ofType } from '@ngrx/effects';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  adjustSellerInventory,
  adjustSellerInventorySuccess,
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
  MovementsPage, ProductStatus, ProductVariant, SellerProduct, SellerProductDetail, UpdateVariantRequest,
} from '../../../core/models/seller-product.model';
import { SellerProductService } from '../../../core/services/seller-product.service';

@Component({
  selector: 'app-seller-products',
  standalone: true,
  imports: [AsyncPipe, NgFor, NgIf, NgClass, RouterLink, CurrencyPipe, DatePipe, FormsModule, ReactiveFormsModule, ToastComponent],
  templateUrl: './seller-products.component.html',
  styleUrl: './seller-products.component.scss',
})
export class SellerProductsComponent implements OnInit {
  private store         = inject(Store);
  private sellerService = inject(SellerProductService);
  private actions$      = inject(Actions);
  private destroyRef    = inject(DestroyRef);
  private fb            = inject(FormBuilder);

  loading$    = this.store.select(selectSellerLoading);
  invLoading$ = this.store.select(selectSellerInventoryLoading);

  private storeId = toSignal(this.store.select(selectActiveSellerStoreId), { initialValue: null });

  allProducts = toSignal(this.store.select(selectSellerProducts), { initialValue: [] as SellerProduct[] });

  togglingVariantId  = signal<number | null>(null);
  variantToggleError = signal<string | null>(null);
  deletingVariantId  = signal<number | null>(null);
  variantHasOrders   = signal<Set<number>>(new Set());

  editingVariantId   = signal<number | null>(null);
  updatingVariant    = signal(false);
  variantUpdateError = signal<string | null>(null);
  clearCompareAtPrice = false;

  editPriceForm = this.fb.group({
    editPrice:          [null as number | null, [Validators.required, Validators.min(0.01)]],
    editCompareAtPrice: [null as number | null],
  });

  searchQuery  = signal('');
  statusFilter = signal<ProductStatus | null>(null);
  sortField    = signal<'title' | 'category' | 'status' | 'variants' | 'createdAt' | null>(null);
  sortDir      = signal<'asc' | 'desc'>('asc');

  private readonly STATUS_ORDER: Record<ProductStatus, number> = {
    ACTIVE: 0, OUT_OF_STOCK: 1, INACTIVE: 2, DRAFT: 3,
  };

  filteredProducts = computed(() => {
    const q      = this.searchQuery().toLowerCase().trim();
    const status = this.statusFilter();
    const field  = this.sortField();
    const dir    = this.sortDir();

    const filtered = this.allProducts().filter(p => {
      const matchesSearch = !q
        || p.title.toLowerCase().includes(q)
        || p.brand.toLowerCase().includes(q)
        || p.category.toLowerCase().includes(q);
      const matchesStatus = !status || p.status === status;
      return matchesSearch && matchesStatus;
    });

    if (!field) return filtered;

    return [...filtered].sort((a, b) => {
      let cmp = 0;
      switch (field) {
        case 'title':    cmp = a.title.localeCompare(b.title, 'es'); break;
        case 'category': cmp = a.category.localeCompare(b.category, 'es'); break;
        case 'status':   cmp = this.STATUS_ORDER[a.status] - this.STATUS_ORDER[b.status]; break;
        case 'variants': cmp = a.variantCount - b.variantCount; break;
        case 'createdAt': cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(); break;
      }
      return dir === 'asc' ? cmp : -cmp;
    });
  });

  hasFilters = computed(() => !!this.searchQuery() || this.statusFilter() !== null);

  sort(field: 'title' | 'category' | 'status' | 'variants' | 'createdAt') {
    if (this.sortField() === field) {
      this.sortDir.update(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortDir.set('asc');
    }
  }

  toastMsg  = signal('');
  toastType = signal<'success' | 'error'>('success');

  expandedId     = signal<number | null>(null);
  expandedDetail = signal<SellerProductDetail | null>(null);
  detailLoading  = signal(false);

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

    this.actions$.pipe(ofType(adjustSellerInventorySuccess), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.reloadDetail());
  }

  ngOnInit() { this.store.dispatch(loadSellerProducts()); }

  clearFilters() { this.searchQuery.set(''); this.statusFilter.set(null); }

  toggleExpand(id: number) {
    if (this.expandedId() === id) {
      this.expandedId.set(null);
      this.expandedDetail.set(null);
    } else {
      this.expandedId.set(id);
      this.expandedDetail.set(null);
      this.loadDetail(id);
    }
  }

  private loadDetail(productId: number) {
    const storeId = this.storeId();
    if (!storeId) return;
    this.detailLoading.set(true);
    this.sellerService.getProduct(storeId, productId).subscribe({
      next: detail => { this.expandedDetail.set(detail); this.detailLoading.set(false); },
      error: ()     => { this.detailLoading.set(false); },
    });
  }

  private reloadDetail() {
    const id = this.expandedId();
    if (id) this.loadDetail(id);
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
        this.reloadDetail();
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

  startEditPrice(p: SellerProduct, v: ProductVariant, e: Event) {
    e.stopPropagation();
    this.editingVariantId.set(v.id);
    this.variantUpdateError.set(null);
    this.clearCompareAtPrice = false;
    this.editPriceForm.reset({ editPrice: v.price, editCompareAtPrice: v.compareAtPrice ?? null });
  }

  cancelEditPrice(e: Event) {
    e.stopPropagation();
    this.editingVariantId.set(null);
    this.variantUpdateError.set(null);
    this.editPriceForm.reset();
  }

  saveVariantPrice(p: SellerProduct, v: ProductVariant) {
    this.editPriceForm.markAllAsTouched();
    if (this.editPriceForm.invalid) return;
    const storeId = this.storeId();
    if (!storeId) return;
    const { editPrice, editCompareAtPrice } = this.editPriceForm.value;
    const req: UpdateVariantRequest = { price: editPrice! };
    if (this.clearCompareAtPrice) {
      req.clearCompareAtPrice = true;
    } else if (editCompareAtPrice) {
      req.compareAtPrice = editCompareAtPrice;
    }
    this.updatingVariant.set(true);
    this.variantUpdateError.set(null);
    this.sellerService.updateVariant(storeId, p.id, v.id, req).subscribe({
      next: () => {
        this.updatingVariant.set(false);
        this.editingVariantId.set(null);
        this.editPriceForm.reset();
        this.toastType.set('success');
        this.toastMsg.set('Precio actualizado correctamente');
        this.reloadDetail();
      },
      error: err => {
        this.variantUpdateError.set(err.error?.message ?? 'Error al actualizar el precio.');
        this.updatingVariant.set(false);
      },
    });
  }

  deleteVariant(p: SellerProduct, v: ProductVariant, e: Event) {
    e.stopPropagation();
    const storeId = this.storeId();
    if (!storeId || this.deletingVariantId() !== null) return;
    if (!confirm('¿Seguro que quieres eliminar esta variante?')) return;

    this.deletingVariantId.set(v.id);
    this.sellerService.deleteVariant(storeId, p.id, v.id).subscribe({
      next: () => {
        this.deletingVariantId.set(null);
        this.toastType.set('success');
        this.toastMsg.set('Variante eliminada correctamente');
        this.store.dispatch(loadSellerProducts());
        this.reloadDetail();
      },
      error: err => {
        this.deletingVariantId.set(null);
        const code: string = err.error?.errorCode ?? '';

        if (err.status === 409 && code === 'PRODUCT_VARIANT_HAS_ORDERS') {
          this.variantHasOrders.update(s => new Set([...s, v.id]));
        } else if (err.status === 400 && code === 'PRODUCT_LAST_VARIANT') {
          this.toastType.set('error');
          this.toastMsg.set('No puedes eliminar la única variante. Elimina el producto completo.');
        } else if (err.status === 403) {
          this.toastType.set('error');
          this.toastMsg.set('No tienes permiso para gestionar este producto.');
        } else if (err.status === 404) {
          this.toastType.set('error');
          this.toastMsg.set('La variante no existe.');
        } else {
          this.toastType.set('error');
          this.toastMsg.set(err.error?.message ?? 'Error al eliminar la variante.');
        }
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
