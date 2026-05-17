import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { DecimalPipe, NgFor, NgIf } from '@angular/common';
import { forkJoin } from 'rxjs';
import { SellerProductService } from '../../../../core/services/seller-product.service';
import {
  Category, CategoryAttribute,
  ProductImage, ProductVariant, SellerProduct,
} from '../../../../core/models/seller-product.model';

@Component({
  selector: 'app-product-edit',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, NgFor, NgIf, RouterLink, DecimalPipe],
  templateUrl: './product-edit.component.html',
  styleUrl: './product-edit.component.scss',
})
export class ProductEditComponent implements OnInit {
  private service = inject(SellerProductService);
  private route   = inject(ActivatedRoute);
  private fb      = inject(FormBuilder);

  product    = signal<SellerProduct | null>(null);
  loading    = signal(true);
  loadError  = signal<string | null>(null);

  // ── Información básica ───────────────────────────────────────
  infoForm = this.fb.group({
    title:       ['', [Validators.required, Validators.maxLength(255)]],
    description: [''],
  });
  saving    = signal(false);
  saveError = signal<string | null>(null);
  saveOk    = signal(false);

  // ── Variantes ────────────────────────────────────────────────
  variants       = signal<ProductVariant[]>([]);
  categoryAttrs  = signal<CategoryAttribute[]>([]);
  selectedAttrValues: Record<number, number | null> = {};

  variantForm = this.fb.group({
    sku:            ['', Validators.required],
    price:          [null as number | null, [Validators.required, Validators.min(0.01)]],
    compareAtPrice: [null as number | null],
    stock:          [null as number | null, [Validators.required, Validators.min(0)]],
  });
  addingVariant = signal(false);
  variantError  = signal<string | null>(null);

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
    forkJoin({
      product:    this.service.getProduct(this.productId),
      categories: this.service.getCategories(),
    }).subscribe({
      next: ({ product, categories }) => {
        this.product.set(product);
        this.variants.set(product.variants);
        this.infoForm.patchValue({ title: product.title, description: product.description ?? '' });

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
    this.service.getImages(this.productId).subscribe({
      next: imgs => {
        this.images.set(imgs);
        this.loadingImages.set(false);
      },
      error: () => this.loadingImages.set(false),
    });
  }

  // ── Información básica ───────────────────────────────────────
  saveInfo() {
    this.infoForm.markAllAsTouched();
    if (this.infoForm.invalid) return;
    const { title, description } = this.infoForm.value;
    this.saving.set(true);
    this.saveError.set(null);
    this.saveOk.set(false);
    this.service.updateProduct(this.productId, {
      title: title!,
      description: description || undefined,
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
    const { sku, price, compareAtPrice, stock } = this.variantForm.value;
    const attributeValueIds = Object.values(this.selectedAttrValues)
      .filter((id): id is number => id !== null && id !== 0);

    this.addingVariant.set(true);
    this.variantError.set(null);
    this.service.addVariant(this.productId, {
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
    this.service.deleteVariant(this.productId, variantId).subscribe({
      next: () => this.variants.update(v => v.filter(x => x.id !== variantId)),
    });
  }

  // ── Imágenes ─────────────────────────────────────────────────
  onImageLoad(id: number) {
    this.loadedImageIds.update(s => new Set([...s, id]));
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.uploadingImage.set(true);
    this.imageError.set(null);
    this.service.uploadImage(this.productId, file).subscribe({
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
    this.service.deleteImage(this.productId, imageId).subscribe({
      next: () => {
        this.images.update(i => i.filter(x => x.id !== imageId));
        this.loadedImageIds.update(s => { s.delete(imageId); return new Set(s); });
      },
    });
  }
}
