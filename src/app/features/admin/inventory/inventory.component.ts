import { Component, inject, OnInit, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { AsyncPipe, DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { loadProducts } from '../../../store/products/products.actions';
import { selectAllProducts } from '../../../store/products/products.selectors';
import { Product, DetailVariant } from '../../../core/models/product.model';
import {
  InventoryMovement, InventoryRequest,
  MovementReason, MovementsPage,
} from '../../../core/models/seller-product.model';
import { AdminTopbarComponent } from '../shared/admin-topbar.component';
import { SellerProductService } from '../../../core/services/seller-product.service';
import { ProductService } from '../../../core/services/product.service';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [AsyncPipe, NgFor, NgIf, NgClass, DatePipe, FormsModule, AdminTopbarComponent],
  templateUrl: './inventory.component.html',
  styleUrl: './inventory.component.scss',
})
export class InventoryComponent implements OnInit {
  private store          = inject(Store);
  private sellerService  = inject(SellerProductService);
  private productService = inject(ProductService);

  products$ = this.store.select(selectAllProducts);

  // ── Adjustment modal ────────────────────────────────────
  modalOpen        = signal(false);
  adjustingProduct = signal<Product | null>(null);
  modalVariants    = signal<DetailVariant[]>([]);
  modalLoading     = signal(false);
  selectedVarId    = signal<number | null>(null);
  adminQty         = signal<number | null>(null);
  adminReason      = signal<InventoryRequest['reason']>('RESTOCK');
  adminError       = signal('');
  adminSuccess     = signal('');

  // ── Movements modal ─────────────────────────────────────
  movOpen         = signal(false);
  movProduct      = signal<Product | null>(null);
  movVariants     = signal<DetailVariant[]>([]);
  movVarLoading   = signal(false);
  movSelectedId   = signal<number | null>(null);
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

  ngOnInit() { this.store.dispatch(loadProducts({})); }

  // ── Adjustment modal methods ─────────────────────────────

  openModal(p: Product) {
    this.adjustingProduct.set(p);
    this.modalVariants.set([]);
    this.selectedVarId.set(null);
    this.adminQty.set(null);
    this.adminReason.set('RESTOCK');
    this.adminError.set('');
    this.adminSuccess.set('');
    this.modalLoading.set(true);
    this.modalOpen.set(true);

    this.productService.getProduct(p.id).subscribe({
      next: full => {
        const variants = full?.variants ?? [];
        this.modalVariants.set(variants);
        if (variants.length) this.selectedVarId.set(variants[0].id);
        this.modalLoading.set(false);
      },
      error: () => {
        this.adminError.set('Error al cargar las variantes del producto.');
        this.modalLoading.set(false);
      },
    });
  }

  apply() {
    const qty     = this.adminQty();
    const varId   = this.selectedVarId();
    const product = this.adjustingProduct();

    if (!qty) { this.adminError.set('La cantidad no puede ser 0.'); return; }
    if (qty < 0 && this.adminReason() !== 'ADJUSTMENT') {
      this.adminError.set('Solo "Ajuste manual" permite cantidades negativas.');
      return;
    }
    if (!varId || !product) return;

    const req: InventoryRequest = { quantity: qty, reason: this.adminReason() };
    this.sellerService.adminAdjustInventory(product.id, varId, req).subscribe({
      next: () => {
        this.modalVariants.update(vs =>
          vs.map(v => v.id === varId ? { ...v, stock: v.stock + qty! } : v)
        );
        this.adminQty.set(null);
        this.adminError.set('');
        this.adminSuccess.set('Inventario actualizado.');
        this.store.dispatch(loadProducts({}));
      },
      error: err => {
        this.adminError.set(err.error?.message ?? 'Error al ajustar el inventario.');
        this.adminSuccess.set('');
      },
    });
  }

  currentVariantStock(): number {
    const id = this.selectedVarId();
    return this.modalVariants().find(v => v.id === id)?.stock ?? 0;
  }

  // ── Movements modal methods ──────────────────────────────

  openMovements(p: Product) {
    this.movProduct.set(p);
    this.movVariants.set([]);
    this.movSelectedId.set(null);
    this.movements.set([]);
    this.movPage.set(0);
    this.movReasonFilter.set(null);
    this.movError.set('');
    this.movVarLoading.set(true);
    this.movOpen.set(true);

    this.productService.getProduct(p.id).subscribe({
      next: full => {
        const variants = full?.variants ?? [];
        this.movVariants.set(variants);
        this.movVarLoading.set(false);
        if (variants.length) {
          this.movSelectedId.set(variants[0].id);
          this.fetchMovements();
        }
      },
      error: () => {
        this.movError.set('Error al cargar las variantes del producto.');
        this.movVarLoading.set(false);
      },
    });
  }

  onMovVariantChange(id: number) {
    this.movSelectedId.set(id);
    this.movPage.set(0);
    this.movReasonFilter.set(null);
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
    const productId = this.movProduct()?.id;
    const variantId = this.movSelectedId();
    if (!productId || !variantId) return;

    this.movLoading.set(true);
    this.movError.set('');
    const reason = this.movReasonFilter() ?? undefined;

    this.sellerService.getInventoryMovements(productId, variantId, {
      page: this.movPage(), size: this.movPageSize, reason,
    }).subscribe({
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

  selectedMovVariantSku(): string {
    return this.movVariants().find(v => v.id === this.movSelectedId())?.sku ?? '';
  }
}
