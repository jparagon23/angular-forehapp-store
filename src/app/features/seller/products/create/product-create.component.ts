import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DecimalPipe, NgFor, NgIf } from '@angular/common';
import { forkJoin } from 'rxjs';
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
    title:       ['', [Validators.required, Validators.maxLength(255)]],
    description: [''],
    brandId:     [null as number | null, Validators.required],
    lineId:      [null as number | null],
    categoryId:  [null as number | null, Validators.required],
  });

  creatingDraft = signal(false);
  draftError    = signal<string | null>(null);
  draftProduct  = signal<SellerProduct | null>(null);

  // ── Step 2 – variants ────────────────────────────────────────
  variantForm = this.fb.group({
    sku:            ['', Validators.required],
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

  createDraft() {
    this.basicForm.markAllAsTouched();
    if (this.basicForm.invalid) return;
    const { title, description, brandId, lineId, categoryId } = this.basicForm.value;
    this.creatingDraft.set(true);
    this.draftError.set(null);
    this.service.createProduct({
      title: title!,
      description: description || undefined,
      brandId: brandId!,
      lineId: lineId ?? undefined,
      categoryId: categoryId!,
    }).subscribe({
      next: product => {
        this.draftProduct.set(product);
        this.creatingDraft.set(false);
        this.step.set(2);
      },
      error: err => {
        this.draftError.set(err.error?.message ?? err.message ?? 'Error al crear el producto');
        this.creatingDraft.set(false);
      },
    });
  }

  addVariant() {
    this.variantForm.markAllAsTouched();
    if (this.variantForm.invalid) return;
    const productId = this.draftProduct()!.id;
    const { sku, price, compareAtPrice, stock } = this.variantForm.value;
    const attributeValueIds = Object.values(this.selectedAttrValues)
      .filter((id): id is number => id !== null && id !== 0);

    this.addingVariant.set(true);
    this.variantError.set(null);
    this.service.addVariant(productId, {
      sku: sku!,
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

  removeVariant(variantId: number) {
    const productId = this.draftProduct()!.id;
    this.service.deleteVariant(productId, variantId).subscribe({
      next: () => this.variants.update(v => v.filter(x => x.id !== variantId)),
    });
  }

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const productId = this.draftProduct()!.id;
    this.uploadingImage.set(true);
    this.imageError.set(null);
    this.service.uploadImage(productId, file).subscribe({
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
    const productId = this.draftProduct()!.id;
    this.service.deleteImage(productId, imageId).subscribe({
      next: () => this.images.update(i => i.filter(x => x.id !== imageId)),
    });
  }

  publish() {
    if (!this.canPublish) return;
    const productId = this.draftProduct()!.id;
    this.publishing.set(true);
    this.publishError.set(null);
    this.service.publishProduct(productId).subscribe({
      next: () => this.router.navigate(['/seller/products']),
      error: err => {
        this.publishError.set(err.error?.message ?? 'Error al publicar. Verifica variantes e imágenes.');
        this.publishing.set(false);
      },
    });
  }
}
