import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DecimalPipe, NgFor, NgIf } from '@angular/common';
import { forkJoin } from 'rxjs';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { SellerProductService } from '../../../../core/services/seller-product.service';
import {
  Brand,
  BrandLine,
  Category,
  CategoryAttribute,
  ProductImage,
  ProductVariant,
  SellerProduct,
} from '../../../../core/models/seller-product.model';
import { selectActiveSellerStoreId } from '../../../../store/seller/seller.selectors';

type WizardStep = 1 | 2 | 3 | 4;

@Component({
  selector: 'app-product-create',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, NgFor, NgIf, RouterLink, DecimalPipe],
  templateUrl: './product-create.component.html',
  styleUrl: './product-create.component.scss',
})
export class ProductCreateComponent implements OnInit {
  private service = inject(SellerProductService);
  private router  = inject(Router);
  private fb      = inject(FormBuilder);
  private ngrx    = inject(Store);

  private storeId = toSignal(this.ngrx.select(selectActiveSellerStoreId), { initialValue: null });

  // ── Wizard state ─────────────────────────────────────────────
  step = signal<WizardStep>(1);

  // ── Step 1 – reference data ──────────────────────────────────
  brands           = signal<Brand[]>([]);
  categories       = signal<Category[]>([]);
  brandLines       = signal<BrandLine[]>([]);
  categoryAttrs    = signal<CategoryAttribute[]>([]);
  loadingRef       = signal(false);
  loadingLines     = signal(false);
  loadingAttrs     = signal(false);

  basicForm = this.fb.group({
    title:        ['', [Validators.required, Validators.maxLength(255)]],
    description:  [''],
    brandId:      [null as number | null, Validators.required],
    lineId:       [null as number | null],
    categoryId:   [null as number | null, Validators.required],
    freeShipping: [false],
  });

  creatingDraft = signal(false);
  draftError    = signal<string | null>(null);
  draftProduct  = signal<SellerProduct | null>(null);

  // ── Step 2 – variants ────────────────────────────────────────
  variantForm = this.fb.group({
    sku:            ['', Validators.maxLength(100)],
    price:          [null as number | null, [Validators.required, Validators.min(0.01)]],
    compareAtPrice: [null as number | null],
    stock:          [null as number | null, [Validators.required, Validators.min(0)]],
  });
  selectedAttrValues: Record<number, number | null> = {};
  variants      = signal<ProductVariant[]>([]);
  addingVariant = signal(false);
  variantError  = signal<string | null>(null);

  // ── Step 3 – images ──────────────────────────────────────────
  images         = signal<ProductImage[]>([]);
  uploadingImage = signal(false);
  imageError     = signal<string | null>(null);
  loadedImageIds = signal(new Set<number>());

  onImageLoad(id: number) {
    this.loadedImageIds.update(s => new Set([...s, id]));
  }

  // ── Step 4 – publish ─────────────────────────────────────────
  publishing    = signal(false);
  publishError  = signal<string | null>(null);

  get hasStock(): boolean    { return this.variants().some(v => v.stock > 0); }
  get canPublish(): boolean {
    return this.variants().length > 0 && this.images().length > 0 && this.hasStock;
  }

  ngOnInit() {
    this.loadingRef.set(true);
    forkJoin({ brands: this.service.getBrands(), categories: this.service.getCategories() })
      .subscribe({
        next: ({ brands, categories }) => {
          this.brands.set(brands);
          this.categories.set(categories);
          this.loadingRef.set(false);
        },
        error: () => this.loadingRef.set(false),
      });
  }

  onBrandChange(event: Event) {
    const id = Number((event.target as HTMLSelectElement).value) || null;
    this.basicForm.patchValue({ brandId: id, lineId: null });
    this.brandLines.set([]);
    if (!id) return;
    const categoryId = this.basicForm.value.categoryId ?? undefined;
    this.loadingLines.set(true);
    this.service.getBrandLines(id, categoryId ?? undefined).subscribe({
      next: lines => { this.brandLines.set(lines); this.loadingLines.set(false); },
      error: ()    => this.loadingLines.set(false),
    });
  }

  onCategoryChange(event: Event) {
    const id = Number((event.target as HTMLSelectElement).value) || null;
    this.basicForm.patchValue({ categoryId: id, lineId: null });
    this.categoryAttrs.set([]);
    this.selectedAttrValues = {};
    if (id) {
      this.loadingAttrs.set(true);
      this.service.getCategoryAttributes(id).subscribe({
        next: attrs => { this.categoryAttrs.set(attrs); this.loadingAttrs.set(false); },
        error: ()    => this.loadingAttrs.set(false),
      });
    }
    const brandId = this.basicForm.value.brandId;
    if (brandId) {
      this.brandLines.set([]);
      this.loadingLines.set(true);
      this.service.getBrandLines(brandId, id ?? undefined).subscribe({
        next: lines => { this.brandLines.set(lines); this.loadingLines.set(false); },
        error: ()    => this.loadingLines.set(false),
      });
    }
  }

  step1Submit() {
    this.basicForm.markAllAsTouched();
    if (this.basicForm.invalid) return;
    const storeId = this.storeId();
    if (!storeId) return;
    const { title, description, brandId, lineId, categoryId, freeShipping } = this.basicForm.value;
    const payload = {
      title: title!,
      description: description || undefined,
      brandId: brandId!,
      lineId: lineId ?? undefined,
      categoryId: categoryId!,
      freeShipping: freeShipping ?? false,
    };

    const existing = this.draftProduct();
    this.creatingDraft.set(true);
    this.draftError.set(null);

    const req$ = existing
      ? this.service.updateProduct(storeId, existing.id, payload)
      : this.service.createProduct(storeId, payload);

    req$.subscribe({
      next: product => {
        this.draftProduct.set(product);
        this.creatingDraft.set(false);
        this.step.set(2);
      },
      error: err => {
        this.draftError.set(err.error?.message ?? err.message ?? 'Error al guardar el producto');
        this.creatingDraft.set(false);
      },
    });
  }

  keepAsDraft() {
    this.router.navigate(['/seller/products']);
  }

  discarding = signal(false);

  cancelDraft() {
    const storeId = this.storeId();
    const product = this.draftProduct();
    if (!product || !storeId) { this.router.navigate(['/seller/products']); return; }
    this.discarding.set(true);
    this.service.deleteProduct(storeId, product.id).subscribe({
      next:  () => this.router.navigate(['/seller/products']),
      error: () => this.router.navigate(['/seller/products']),
    });
  }

  addVariant() {
    this.variantForm.markAllAsTouched();
    if (this.variantForm.invalid) return;
    const storeId = this.storeId();
    if (!storeId) return;
    const productId = this.draftProduct()!.id;
    const { sku, price, compareAtPrice, stock } = this.variantForm.value;
    const attributeValueIds = Object.values(this.selectedAttrValues)
      .filter((id): id is number => id !== null && id !== 0);

    this.addingVariant.set(true);
    this.variantError.set(null);
    this.service.addVariant(storeId, productId, {
      sku: sku || undefined,
      price: price!,
      compareAtPrice: compareAtPrice ?? undefined,
      stock: stock!,
      attributeValueIds,
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

  goToImages() {
    // Si el formulario tiene datos ingresados, guardar la variante antes de continuar
    if (this.variantForm.dirty) {
      this.variantForm.markAllAsTouched();
      if (this.variantForm.invalid) return;
      const storeId = this.storeId();
      if (!storeId) return;
      const productId = this.draftProduct()!.id;
      const { sku, price, compareAtPrice, stock } = this.variantForm.value;
      const attributeValueIds = Object.values(this.selectedAttrValues)
        .filter((id): id is number => id !== null && id !== 0);

      this.addingVariant.set(true);
      this.variantError.set(null);
      this.service.addVariant(storeId, productId, {
        sku: sku || undefined,
        price: price!,
        compareAtPrice: compareAtPrice ?? undefined,
        stock: stock!,
        attributeValueIds,
      }).subscribe({
        next: variant => {
          this.variants.update(v => [...v, variant]);
          this.variantForm.reset();
          this.selectedAttrValues = {};
          this.addingVariant.set(false);
          this.step.set(3);
        },
        error: err => {
          this.variantError.set(err.error?.message ?? 'SKU duplicado u otro error');
          this.addingVariant.set(false);
        },
      });
      return;
    }

    // Formulario vacío: si ya hay variantes continuar, si no mostrar errores de validación
    if (this.variants().length > 0) {
      this.step.set(3);
    } else {
      this.variantForm.markAllAsTouched();
    }
  }

  removeVariant(variantId: number) {
    const storeId = this.storeId();
    if (!storeId) return;
    const productId = this.draftProduct()!.id;
    this.variantError.set(null);
    this.service.deleteVariant(storeId, productId, variantId).subscribe({
      next: () => this.variants.update(v => v.filter(x => x.id !== variantId)),
      error: err => {
        const code: string = err.error?.errorCode ?? '';
        if (err.status === 400 && code === 'PRODUCT_LAST_VARIANT') {
          this.variantError.set('No puedes eliminar la única variante.');
        } else {
          this.variantError.set(err.error?.message ?? 'Error al eliminar la variante.');
        }
      },
    });
  }

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const storeId = this.storeId();
    if (!storeId) return;
    const productId = this.draftProduct()!.id;
    this.uploadingImage.set(true);
    this.imageError.set(null);
    this.service.uploadImage(storeId, productId, file).subscribe({
      next: img => {
        this.images.update(i => [...i, img]);
        this.uploadingImage.set(false);
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
    const productId = this.draftProduct()!.id;
    this.service.deleteImage(storeId, productId, imageId).subscribe({
      next: () => this.images.update(i => i.filter(x => x.id !== imageId)),
    });
  }

  publish() {
    if (!this.canPublish) return;
    const storeId = this.storeId();
    if (!storeId) return;
    const productId = this.draftProduct()!.id;
    this.publishing.set(true);
    this.publishError.set(null);
    this.service.publishProduct(storeId, productId).subscribe({
      next: () => this.router.navigate(['/seller/products']),
      error: err => {
        this.publishError.set(err.error?.message ?? 'Error al publicar. Verifica variantes e imágenes.');
        this.publishing.set(false);
      },
    });
  }
}
