import { Component, inject, OnInit, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { AsyncPipe, CurrencyPipe, DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  adjustSellerInventory,
  changeSellerProductStatus,
  deleteSellerProduct,
  loadSellerProducts,
} from '../../../store/seller/seller.actions';
import {
  selectSellerError,
  selectSellerInventoryLoading,
  selectSellerLoading,
  selectSellerProducts,
} from '../../../store/seller/seller.selectors';
import {
  InventoryMovement, InventoryRequest, MovementReason,
  MovementsPage, ProductStatus, ProductVariant, SellerProduct,
} from '../../../core/models/seller-product.model';
import { SellerProductService } from '../../../core/services/seller-product.service';

@Component({
  selector: 'app-seller-products',
  standalone: true,
  imports: [AsyncPipe, NgFor, NgIf, NgClass, RouterLink, CurrencyPipe, DatePipe, FormsModule],
  templateUrl: './seller-products.component.html',
  styleUrl: './seller-products.component.scss',
})
export class SellerProductsComponent implements OnInit {
  private store         = inject(Store);
  private sellerService = inject(SellerProductService);

  products$   = this.store.select(selectSellerProducts);
  loading$    = this.store.select(selectSellerLoading);
  error$      = this.store.select(selectSellerError);
  invLoading$ = this.store.select(selectSellerInventoryLoading);

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

  ngOnInit() { this.store.dispatch(loadSellerProducts()); }

  toggleExpand(id: number) {
    this.expandedId.update(cur => cur === id ? null : id);
  }

  openMovements(p: SellerProduct, v: ProductVariant, e: Event) {
    e.stopPropagation();
    this.movProductId.set(p.id);
    this.movVariantId.set(v.id);
    this.movSku.set(v.sku);
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
    this.invSku.set(v.sku);
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

  minPrice(variants: { price: number }[]): number {
    if (!variants.length) return 0;
    return Math.min(...variants.map(v => v.price));
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
