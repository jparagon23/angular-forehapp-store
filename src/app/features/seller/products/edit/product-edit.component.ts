import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe, DecimalPipe, NgClass, NgFor, NgIf } from '@angular/common';
import { forkJoin } from 'rxjs';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { SellerProductService } from '../../../../core/services/seller-product.service';
import {
  Category, CategoryAttribute,
  InventoryMovement, InventoryRequest, MovementReason, MovementsPage,
  ProductImage, ProductVariant, SellerProduct,
} from '../../../../core/models/seller-product.model';
import { selectActiveSellerStoreId } from '../../../../store/seller/seller.selectors';

@Component({
  selector: 'app-product-edit',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, NgFor, NgIf, NgClass, RouterLink, DecimalPipe, DatePipe],
  templateUrl: './product-edit.component.html',
  styleUrl: './product-edit.component.scss',
})
export class ProductEditComponent implements OnInit {
  private service = inject(SellerProductService);
  private route   = inject(ActivatedRoute);
  private fb      = inject(FormBuilder);
  private ngrx    = inject(Store);

  private storeId = toSignal(this.ngrx.select(selectActiveSellerStoreId), { initialValue: null });

  product   = signal<SellerProduct | null>(null);
  loading   = signal(true);
  loadError = signal<string | null>(null);

  // ── Información básica ───────────────────────────────────────
  infoForm = this.fb.group({
    title:        ['', [Validators.required, Validators.maxLength(255)]],
    description:  [''],
    freeShipping: [false],
  });
  saving    = signal(false);
  saveError = signal<string | null>(null);
  saveOk    = signal(false);

  // ── Variantes ────────────────────────────────────────────────
  variants      = signal<ProductVariant[]>([]);
  categoryAttrs = signal<CategoryAttribute[]>([]);
  selectedAttrValues: Record<number, number | null> = {};

  variantForm = this.fb.group({
    sku:            ['', Validators.required],
    price:          [null as number | null, [Validators.required, Validators.min(0.01)]],
    compareAtPrice: [null as number | null],
    stock:          [null as number | null, [Validators.required, Validators.min(0)]],
  });
  addingVariant = signal(false);
  variantError  = signal<string | null>(null);

  // ── Inventario modal ─────────────────────────────────────────
  invOpen      = signal(false);
  invVariantId = signal(0);
  invSku       = signal('');
  invStock     = signal(0);
  invQuantity  = signal<number | null>(null);
  invReason    = signal<InventoryRequest['reason']>('RESTOCK');
  invError     = signal('');
  invLoading   = signal(false);

  // ── Movimientos modal ────────────────────────────────────────
  movOpen         = signal(false);
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

  // ── Imágenes ─────────────────────────────────────────────────
  images         = signal<ProductImage[]>([]);
  loadingImages  = signal(true);
  uploadingImage = signal(false);
  imageError     = signal<string | null>(null);
  loadedImageIds = signal(new Set<number>());

  private productId!: number;

  ngOnInit() {
    this.productId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadAll();
    this.loadImages();
  }

  private loadAll() {
    const storeId = this.storeId();
    if (!storeId) { this.loadError.set('No hay tienda activa.'); this.loading.set(false); return; }
    forkJoin({
      product:    this.service.getProduct(storeId, this.productId),
      categories: this.service.getCategories(),
    }).subscribe({
      next: ({ product, categories }) => {
        this.product.set(product);
        this.variants.set(product.variants);
        this.infoForm.patchValue({ title: product.title, description: product.description ?? '', freeShipping: product.freeShipping });

        const match = categories.find((c: Category) => c.name === product.category);
        if (match) {
          this.service.getCategoryAttributes(match.id).subscribe({
            next: attrs => this.categoryAttrs.set(attrs),
          });
        }
        this.loading.set(false);
      },
      error: err => {
        this.loadError.set(err.error?.message ?? 'Error al cargar el producto');
        this.loading.set(false);
      },
    });
  }

  private loadImages() {
    const storeId = this.storeId();
    if (!storeId) return;
    this.service.getImages(storeId, this.productId).subscribe({
      next: imgs => { this.images.set(imgs); this.loadingImages.set(false); },
      error: ()   => this.loadingImages.set(false),
    });
  }

  // ── Información básica ───────────────────────────────────────
  saveInfo() {
    this.infoForm.markAllAsTouched();
    if (this.infoForm.invalid) return;
    const storeId = this.storeId();
    if (!storeId) return;
    const { title, description, freeShipping } = this.infoForm.value;
    this.saving.set(true);
    this.saveError.set(null);
    this.saveOk.set(false);
    this.service.updateProduct(storeId, this.productId, {
      title: title!,
      description: description || undefined,
      freeShipping: freeShipping ?? false,
    }).subscribe({
      next: p => {
        this.product.set(p);
        this.saving.set(false);
        this.saveOk.set(true);
        setTimeout(() => this.saveOk.set(false), 3000);
      },
      error: err => {
        this.saveError.set(err.error?.message ?? 'Error al guardar los cambios');
        this.saving.set(false);
      },
    });
  }

  // ── Variantes ────────────────────────────────────────────────
  addVariant() {
    this.variantForm.markAllAsTouched();
    if (this.variantForm.invalid) return;
    const storeId = this.storeId();
    if (!storeId) return;
    const { sku, price, compareAtPrice, stock } = this.variantForm.value;
    const attributeValueIds = Object.values(this.selectedAttrValues)
      .filter((id): id is number => id !== null && id !== 0);

    this.addingVariant.set(true);
    this.variantError.set(null);
    this.service.addVariant(storeId, this.productId, {
      sku: sku!, price: price!,
      compareAtPrice: compareAtPrice ?? undefined,
      stock: stock!, attributeValueIds,
    }).subscribe({
      next: variant => {
        this.variants.update(v => [...v, variant]);
        this.variantForm.reset();
        this.selectedAttrValues = {};
        this.addingVariant.set(false);
      },
      error: err => {
        this.variantError.set(err.error?.message ?? 'SKU duplicado u otro error');
        this.addingVariant.set(false);
      },
    });
  }

  removeVariant(variantId: number) {
    const storeId = this.storeId();
    if (!storeId) return;
    this.service.deleteVariant(storeId, this.productId, variantId).subscribe({
      next: () => this.variants.update(v => v.filter(x => x.id !== variantId)),
    });
  }

  // ── Inventario modal ─────────────────────────────────────────
  openInvModal(v: ProductVariant) {
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
    if (!qty) { this.invError.set('La cantidad no puede ser 0.'); return; }
    if (qty < 0 && this.invReason() !== 'ADJUSTMENT') {
      this.invError.set('Solo "Ajuste manual" permite cantidades negativas.');
      return;
    }
    this.invLoading.set(true);
    this.service.updateInventory(this.productId, this.invVariantId(), {
      quantity: qty,
      reason: this.invReason(),
    }).subscribe({
      next: () => {
        this.variants.update(vs => vs.map(v =>
          v.id === this.invVariantId() ? { ...v, stock: v.stock + qty! } : v
        ));
        this.invLoading.set(false);
        this.invOpen.set(false);
      },
      error: err => {
        this.invError.set(err.error?.message ?? 'Error al ajustar el inventario.');
        this.invLoading.set(false);
      },
    });
  }

  // ── Movimientos modal ────────────────────────────────────────
  openMovements(v: ProductVariant) {
    this.movVariantId.set(v.id);
    this.movSku.set(v.sku);
    this.movPage.set(0);
    this.movReasonFilter.set(null);
    this.movOpen.set(true);
    this.fetchMovements();
  }

  closeMovements() { this.movOpen.set(false); }

  setMovFilter(reason: MovementReason | null) {
    this.movReasonFilter.set(reason);
    this.movPage.set(0);
    this.fetchMovements();
  }

  movPrev() { if (!this.movIsFirst()) { this.movPage.update(p => p - 1); this.fetchMovements(); } }
  movNext() { if (!this.movIsLast())  { this.movPage.update(p => p + 1); this.fetchMovements(); } }

  private fetchMovements() {
    this.movLoading.set(true);
    this.movError.set('');
    this.service.getInventoryMovements(
      this.productId, this.movVariantId(),
      { page: this.movPage(), size: this.movPageSize, reason: this.movReasonFilter() ?? undefined }
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

  // ── Imágenes ─────────────────────────────────────────────────
  onImageLoad(id: number) {
    this.loadedImageIds.update(s => new Set([...s, id]));
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const storeId = this.storeId();
    if (!storeId) return;
    this.uploadingImage.set(true);
    this.imageError.set(null);
    this.service.uploadImage(storeId, this.productId, file).subscribe({
      next: img => {
        this.images.update(i => [...i, img]);
        this.uploadingImage.set(false);
        input.value = '';
      },
      error: err => {
        this.imageError.set(err.error?.message ?? 'Error al subir imagen (máx 5MB, JPEG/PNG/WebP)');
        this.uploadingImage.set(false);
      },
    });
  }

  removeImage(imageId: number) {
    const storeId = this.storeId();
    if (!storeId) return;
    this.service.deleteImage(storeId, this.productId, imageId).subscribe({
      next: () => {
        this.images.update(i => i.filter(x => x.id !== imageId));
        this.loadedImageIds.update(s => { s.delete(imageId); return new Set(s); });
      },
    });
  }
}
