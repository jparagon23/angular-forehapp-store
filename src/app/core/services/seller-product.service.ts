import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Brand, BrandLine, Category, CategoryAttribute,
  CreateProductRequest, CreateVariantRequest,
  InventoryRequest, MovementReason, MovementsPage,
  ProductImage, ProductVariant, SellerProduct,
} from '../models/seller-product.model';

@Injectable({ providedIn: 'root' })
export class SellerProductService {
  private readonly BASE = environment.apiBaseUrl;
  private http = inject(HttpClient);

  // ── Reference data (no storeId needed) ───────────────────────────────────

  getBrands(): Observable<Brand[]> {
    return this.http.get<Brand[]>(`${this.BASE}/brands`);
  }

  getBrandLines(brandId: number, categoryId?: number): Observable<BrandLine[]> {
    const params: Record<string, string> = categoryId ? { categoryId: String(categoryId) } : {};
    return this.http.get<BrandLine[]>(`${this.BASE}/brands/${brandId}/lines`, { params });
  }

  createCategory(name: string): Observable<Category> {
    return this.http.post<Category>(`${this.BASE}/admin/categories`, { name });
  }

  createBrand(name: string): Observable<Brand> {
    return this.http.post<Brand>(`${this.BASE}/admin/brands`, { name });
  }

  createBrandLine(brandId: number, name: string, categoryId: number): Observable<BrandLine> {
    return this.http.post<BrandLine>(`${this.BASE}/admin/brands/${brandId}/lines`, { name, categoryId });
  }

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.BASE}/categories`);
  }

  getCategoryAttributes(categoryId: number): Observable<CategoryAttribute[]> {
    return this.http.get<CategoryAttribute[]>(`${this.BASE}/categories/${categoryId}/attributes`);
  }

  // ── Products (scoped to store) ────────────────────────────────────────────

  getSellerProducts(storeId: number): Observable<SellerProduct[]> {
    return this.http.get<SellerProduct[]>(`${this.BASE}/stores/${storeId}/products`);
  }

  getProduct(storeId: number, id: number): Observable<SellerProduct> {
    return this.http.get<SellerProduct>(`${this.BASE}/stores/${storeId}/products/${id}`);
  }

  createProduct(storeId: number, req: CreateProductRequest): Observable<SellerProduct> {
    return this.http.post<SellerProduct>(`${this.BASE}/stores/${storeId}/products`, req);
  }

  updateProduct(storeId: number, id: number, req: Partial<CreateProductRequest>): Observable<SellerProduct> {
    return this.http.patch<SellerProduct>(`${this.BASE}/stores/${storeId}/products/${id}`, req);
  }

  publishProduct(storeId: number, id: number): Observable<SellerProduct> {
    return this.http.patch<SellerProduct>(`${this.BASE}/stores/${storeId}/products/${id}/publish`, {});
  }

  deactivateProduct(storeId: number, id: number): Observable<SellerProduct> {
    return this.http.patch<SellerProduct>(`${this.BASE}/stores/${storeId}/products/${id}/deactivate`, {});
  }

  activateProduct(storeId: number, id: number): Observable<SellerProduct> {
    return this.http.patch<SellerProduct>(`${this.BASE}/stores/${storeId}/products/${id}/activate`, {});
  }

  deleteProduct(storeId: number, id: number): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/stores/${storeId}/products/${id}`);
  }

  // ── Variants ──────────────────────────────────────────────────────────────

  addVariant(storeId: number, productId: number, req: CreateVariantRequest): Observable<ProductVariant> {
    return this.http.post<ProductVariant>(`${this.BASE}/stores/${storeId}/products/${productId}/variants`, req);
  }

  deactivateVariant(storeId: number, productId: number, variantId: number): Observable<ProductVariant> {
    return this.http.patch<ProductVariant>(`${this.BASE}/stores/${storeId}/products/${productId}/variants/${variantId}/deactivate`, {});
  }

  activateVariant(storeId: number, productId: number, variantId: number): Observable<ProductVariant> {
    return this.http.patch<ProductVariant>(`${this.BASE}/stores/${storeId}/products/${productId}/variants/${variantId}/activate`, {});
  }

  deleteVariant(storeId: number, productId: number, variantId: number): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/stores/${storeId}/products/${productId}/variants/${variantId}`);
  }

  // ── Images ────────────────────────────────────────────────────────────────

  getImages(storeId: number, productId: number): Observable<ProductImage[]> {
    return this.http.get<ProductImage[]>(`${this.BASE}/stores/${storeId}/products/${productId}/images`);
  }

  uploadImage(storeId: number, productId: number, file: File): Observable<ProductImage> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<ProductImage>(`${this.BASE}/stores/${storeId}/products/${productId}/images`, form);
  }

  deleteImage(storeId: number, productId: number, imageId: number): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/stores/${storeId}/products/${productId}/images/${imageId}`);
  }

  // ── Inventory (unchanged endpoints) ──────────────────────────────────────

  updateInventory(productId: number, variantId: number, req: InventoryRequest): Observable<void> {
    return this.http.post<void>(
      `${this.BASE}/inventory/products/${productId}/variants/${variantId}`, req
    );
  }

  adminAdjustInventory(productId: number, variantId: number, req: InventoryRequest): Observable<void> {
    return this.http.post<void>(
      `${this.BASE}/admin/inventory/products/${productId}/variants/${variantId}`, req
    );
  }

  getInventoryMovements(
    productId: number,
    variantId: number,
    opts: { page?: number; size?: number; reason?: MovementReason } = {}
  ): Observable<MovementsPage> {
    const params: Record<string, string> = {};
    if (opts.page   !== undefined) params['page']   = String(opts.page);
    if (opts.size   !== undefined) params['size']   = String(opts.size);
    if (opts.reason)               params['reason'] = opts.reason;
    return this.http.get<MovementsPage>(
      `${this.BASE}/inventory/products/${productId}/variants/${variantId}/movements`,
      { params }
    );
  }
}
