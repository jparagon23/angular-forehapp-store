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
  ProductImage, ProductVariant, SellerProduct, SellerProductDetail, UpdateVariantRequest,
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

  product   = signal<SellerProductDetail | null>(null);
  loading   = signal(true);
  loadError = signal<string | null>(null);

  // ── Información básica ───────────────────────────────────────
  infoForm = this.fb.group({
    title:        ['', [Validators.required, Validators.maxLength(255)]],
    description:  [''],
    freeShipping: [false],
  });
  saving       = signal(false);
  saveError    = signal<string | null>(null);
  saveOk       = signal(false);
  publishing   = signal(false);
  publishOk    = signal(false);
  publishError = signal<string | null>(null);

  // ── Variantes ────────────────────────────────────────────────
  variants      = signal<ProductVariant[]>([]);
  categoryAttrs = signal<CategoryAttribute[]>([]);
  selectedAttrValues: Record<number, number | null> = {};

  variantForm = this.fb.group({
    sku:            ['', Validators.maxLength(100)],
    price:          [null as number | null, [Validators.required, Validators.min(0.01)]],
    compareAtPrice: [null as number | null],
    stock:          [null as number | null, [Validators.required, Validators.min(0)]],
  });
  addingVariant      = signal(false);
  variantError       = signal<string | null>(null);
  togglingVariantId  = signal<number | null>(null);
  variantToggleError = signal<string | null>(null);
  deletingVariantId  = signal<number | null>(null);
  variantHasOrders   = signal<Set<number>>(new Set());
  variantDeleteError = signal<string | null>(null);

  editingVariantId   = signal<number | null>(null);
  updatingVariant    = signal(false);
  variantUpdateError = signal<string | null>(null);
  clearCompareAtPrice = false;

  editPriceForm = this.fb.group({
    editPrice:          [null as number | null, [Validators.required, Validators.min(0.01)]],
    editCompareAtPrice: [null as number | null],
  });

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

  // ── Etiquetas ────────────────────────────────────────────────
  tags       = signal<string[]>([]);
  tagInput   = signal('');
  savingTags = signal(false);
  tagsError  = signal<string | null>(null);
  tagsOk     = signal(false);

  addTag() {
    const val = this.tagInput().trim().toLowerCase();
    if (!val) return;
    if (val.length > 50) { this.tagsError.set('El tag no puede superar 50 caracteres.'); return; }
    if (this.tags().includes(val)) { this.tagInput.set(''); return; }
    if (this.tags().length >= 20) { this.tagsError.set('Máximo 20 tags por producto.'); return; }
    this.tags.update(t => [...t, val]);
    this.tagInput.set('');
    this.tagsError.set(null);
  }

  removeTag(tag: string) {
    this.tags.update(t => t.filter(x => x !== tag));
  }

  saveTags() {
    const storeId = this.storeId();
    if (!storeId) return;
    this.savingTags.set(true);
    this.tagsError.set(null);
    this.tagsOk.set(false);
    this.service.setProductTags(storeId, this.productId, this.tags()).subscribe({
      next: tags => {
        this.tags.set(tags);
        this.savingTags.set(false);
        this.tagsOk.set(true);
        setTimeout(() => this.tagsOk.set(false), 3000);
      },
      error: err => {
        this.tagsError.set(err.error?.error ?? err.error?.message ?? 'Error al guardar etiquetas.');
        this.savingTags.set(false);
      },
    });
  }

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
        this.tags.set(product.tags ?? []);
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
        const cur = this.product();
        if (cur) this.product.set({ ...cur, ...p });
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

  saveAndPublish() {
    this.infoForm.markAllAsTouched();
    if (this.infoForm.invalid) return;
    const storeId = this.storeId();
    if (!storeId) return;
    const { title, description, freeShipping } = this.infoForm.value;
    this.saving.set(true);
    this.saveError.set(null);
    this.saveOk.set(false);
    this.publishError.set(null);
    this.publishOk.set(false);
    this.service.updateProduct(storeId, this.productId, {
      title: title!,
      description: description || undefined,
      freeShipping: freeShipping ?? false,
    }).subscribe({
      next: p => {
        const cur = this.product();
        if (cur) this.product.set({ ...cur, ...p });
        this.saving.set(false);
        this.publishing.set(true);
        this.service.publishProduct(storeId, this.productId).subscribe({
          next: published => {
            const c = this.product();
            if (c) this.product.set({ ...c, ...published });
            this.publishing.set(false);
            this.publishOk.set(true);
            setTimeout(() => this.publishOk.set(false), 4000);
          },
          error: err => {
            this.publishError.set(err.error?.message ?? 'Error al publicar el producto');
            this.publishing.set(false);
          },
        });
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
      sku: sku || undefined, price: price!,
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

  toggleVariant(v: ProductVariant) {
    const storeId = this.storeId();
    if (!storeId || this.togglingVariantId() !== null) return;
    this.togglingVariantId.set(v.id);
    this.variantToggleError.set(null);
    const call = v.active
      ? this.service.deactivateVariant(storeId, this.productId, v.id)
      : this.service.activateVariant(storeId, this.productId, v.id);
    call.subscribe({
      next: updated => {
        this.variants.update(vs => vs.map(x => x.id === updated.id ? updated : x));
        this.togglingVariantId.set(null);
      },
      error: err => {
        const code: string = err.error?.errorCode ?? '';
        if (code === 'PRODUCT_VARIANT_LAST_ACTIVE') {
          this.variantToggleError.set('No puedes desactivar la última variante activa. Para ocultar el producto completo, usa "Desactivar producto" desde Mis Productos.');
        } else {
          this.variantToggleError.set(err.error?.message ?? 'No se pudo cambiar el estado de la variante.');
        }
        this.togglingVariantId.set(null);
      },
    });
  }

  removeVariant(v: ProductVariant) {
    const storeId = this.storeId();
    if (!storeId || this.deletingVariantId() !== null) return;
    if (!confirm('¿Seguro que quieres eliminar esta variante?')) return;
    this.deletingVariantId.set(v.id);
    this.variantDeleteError.set(null);
    this.service.deleteVariant(storeId, this.productId, v.id).subscribe({
      next: () => {
        this.variants.update(vs => vs.filter(x => x.id !== v.id));
        this.deletingVariantId.set(null);
      },
      error: err => {
        this.deletingVariantId.set(null);
        const code: string = err.error?.errorCode ?? '';
        if (err.status === 409 && code === 'PRODUCT_VARIANT_HAS_ORDERS') {
          this.variantHasOrders.update(s => new Set([...s, v.id]));
        } else if (err.status === 400 && code === 'PRODUCT_LAST_VARIANT') {
          this.variantDeleteError.set('No puedes eliminar la única variante. Elimina el producto completo.');
        } else if (err.status === 403) {
          this.variantDeleteError.set('No tienes permiso para gestionar este producto.');
        } else if (err.status === 404) {
          this.variantDeleteError.set('La variante no existe.');
        } else {
          this.variantDeleteError.set(err.error?.message ?? 'Error al eliminar la variante.');
        }
      },
    });
  }

  startEditPrice(v: ProductVariant) {
    this.editingVariantId.set(v.id);
    this.variantUpdateError.set(null);
    this.clearCompareAtPrice = false;
    this.editPriceForm.reset({ editPrice: v.price, editCompareAtPrice: v.compareAtPrice ?? null });
  }

  cancelEditPrice() {
    this.editingVariantId.set(null);
    this.variantUpdateError.set(null);
    this.editPriceForm.reset();
  }

  saveVariantPrice(v: ProductVariant) {
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
    this.service.updateVariant(storeId, this.productId, v.id, req).subscribe({
      next: updated => {
        this.variants.update(vs => vs.map(x => x.id === updated.id ? updated : x));
        this.updatingVariant.set(false);
        this.editingVariantId.set(null);
        this.editPriceForm.reset();
      },
      error: err => {
        this.variantUpdateError.set(err.error?.message ?? 'Error al actualizar el precio.');
        this.updatingVariant.set(false);
      },
    });
  }

  // ── Inventario modal ─────────────────────────────────────────
  openInvModal(v: ProductVariant) {
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
    this.movSku.set(v.sku ?? '—');
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
