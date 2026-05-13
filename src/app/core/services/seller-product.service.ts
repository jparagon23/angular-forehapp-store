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

  getBrands(): Observable<Brand[]> {
    return this.http.get<Brand[]>(`${this.BASE}/brands`);
  }

  getBrandLines(brandId: number, categoryId?: number): Observable<BrandLine[]> {
    const params: Record<string, string> = categoryId ? { categoryId: String(categoryId) } : {};
    return this.http.get<BrandLine[]>(`${this.BASE}/brands/${brandId}/lines`, { params });
  }

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.BASE}/categories`);
  }

  getCategoryAttributes(categoryId: number): Observable<CategoryAttribute[]> {
    return this.http.get<CategoryAttribute[]>(`${this.BASE}/categories/${categoryId}/attributes`);
  }

  getSellerProducts(): Observable<SellerProduct[]> {
    return this.http.get<SellerProduct[]>(`${this.BASE}/products/seller`);
  }

  getProduct(id: number): Observable<SellerProduct> {
    return this.http.get<SellerProduct>(`${this.BASE}/products/${id}`);
  }

  createProduct(req: CreateProductRequest): Observable<SellerProduct> {
    return this.http.post<SellerProduct>(`${this.BASE}/products`, req);
  }

  updateProduct(id: number, req: Partial<CreateProductRequest>): Observable<SellerProduct> {
    return this.http.patch<SellerProduct>(`${this.BASE}/products/${id}`, req);
  }

  publishProduct(id: number): Observable<SellerProduct> {
    return this.http.patch<SellerProduct>(`${this.BASE}/products/${id}/publish`, {});
  }

  deactivateProduct(id: number): Observable<SellerProduct> {
    return this.http.patch<SellerProduct>(`${this.BASE}/products/${id}/deactivate`, {});
  }

  activateProduct(id: number): Observable<SellerProduct> {
    return this.http.patch<SellerProduct>(`${this.BASE}/products/${id}/activate`, {});
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/products/${id}`);
  }

  addVariant(productId: number, req: CreateVariantRequest): Observable<ProductVariant> {
    return this.http.post<ProductVariant>(`${this.BASE}/products/${productId}/variants`, req);
  }

  deleteVariant(productId: number, variantId: number): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/products/${productId}/variants/${variantId}`);
  }

  getImages(productId: number): Observable<ProductImage[]> {
    return this.http.get<ProductImage[]>(`${this.BASE}/products/${productId}/images`);
  }

  uploadImage(productId: number, file: File): Observable<ProductImage> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<ProductImage>(`${this.BASE}/products/${productId}/images`, form);
  }

  deleteImage(productId: number, imageId: number): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/products/${productId}/images/${imageId}`);
  }

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
    if (opts.page  !== undefined) params['page']   = String(opts.page);
    if (opts.size  !== undefined) params['size']   = String(opts.size);
    if (opts.reason)              params['reason'] = opts.reason;
    return this.http.get<MovementsPage>(
      `${this.BASE}/inventory/products/${productId}/variants/${variantId}/movements`,
      { params }
    );
  }
}
