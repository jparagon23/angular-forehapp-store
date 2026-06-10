import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Attribute, AttributeValue, Brand, BrandLine, Category, CategoryAttribute,
  CreateProductRequest, CreateVariantRequest, UpdateVariantRequest,
  InventoryRequest, MovementReason, MovementsPage,
  ProductImage, ProductVariant, SellerProduct, SellerProductDetail,
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

  // ── Categories CRUD ──────────────────────────────────────────────────────
  createCategory(name: string): Observable<Category> {
    return this.http.post<Category>(`${this.BASE}/admin/categories`, { name });
  }
  updateCategory(id: number, name: string): Observable<Category> {
    return this.http.patch<Category>(`${this.BASE}/admin/categories/${id}`, { name });
  }
  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/admin/categories/${id}`);
  }

  // ── Brands CRUD ───────────────────────────────────────────────────────────
  createBrand(name: string): Observable<Brand> {
    return this.http.post<Brand>(`${this.BASE}/admin/brands`, { name });
  }
  updateBrand(id: number, name: string): Observable<Brand> {
    return this.http.patch<Brand>(`${this.BASE}/admin/brands/${id}`, { name });
  }
  deleteBrand(id: number): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/admin/brands/${id}`);
  }

  // ── Lines CRUD ────────────────────────────────────────────────────────────
  createBrandLine(brandId: number, name: string, categoryId: number): Observable<BrandLine> {
    return this.http.post<BrandLine>(`${this.BASE}/admin/brands/${brandId}/lines`, { name, categoryId });
  }
  updateLine(brandId: number, lineId: number, name: string): Observable<BrandLine> {
    return this.http.patch<BrandLine>(`${this.BASE}/admin/brands/${brandId}/lines/${lineId}`, { name });
  }
  deleteLine(brandId: number, lineId: number): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/admin/brands/${brandId}/lines/${lineId}`);
  }

  // ── Attributes CRUD ───────────────────────────────────────────────────────
  getAttributes(): Observable<Attribute[]> {
    return this.http.get<Attribute[]>(`${this.BASE}/attributes`);
  }
  getAttributeValues(attrId: number): Observable<AttributeValue[]> {
    return this.http.get<AttributeValue[]>(`${this.BASE}/attributes/${attrId}/values`);
  }
  createAttribute(name: string): Observable<Attribute> {
    return this.http.post<Attribute>(`${this.BASE}/admin/attributes`, { name });
  }
  updateAttribute(id: number, name: string): Observable<Attribute> {
    return this.http.patch<Attribute>(`${this.BASE}/admin/attributes/${id}`, { name });
  }
  deleteAttribute(id: number): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/admin/attributes/${id}`);
  }

  // ── Attribute Values CRUD ─────────────────────────────────────────────────
  createAttributeValue(attrId: number, description: string): Observable<AttributeValue> {
    return this.http.post<AttributeValue>(`${this.BASE}/admin/attributes/${attrId}/values`, { description });
  }
  updateAttributeValue(attrId: number, valueId: number, description: string): Observable<AttributeValue> {
    return this.http.patch<AttributeValue>(`${this.BASE}/admin/attributes/${attrId}/values/${valueId}`, { description });
  }
  deleteAttributeValue(attrId: number, valueId: number): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/admin/attributes/${attrId}/values/${valueId}`);
  }

  // ── Category-Attribute Links ───────────────────────────────────────────────
  linkAttribute(catId: number, attrId: number, required: boolean): Observable<CategoryAttribute> {
    return this.http.post<CategoryAttribute>(`${this.BASE}/admin/categories/${catId}/attributes`, { attributeId: attrId, required });
  }
  updateAttributeLink(catId: number, attrId: number, required: boolean): Observable<CategoryAttribute> {
    return this.http.patch<CategoryAttribute>(`${this.BASE}/admin/categories/${catId}/attributes/${attrId}`, { required });
  }
  unlinkAttribute(catId: number, attrId: number): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/admin/categories/${catId}/attributes/${attrId}`);
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

  getProduct(storeId: number, id: number): Observable<SellerProductDetail> {
    return this.http.get<SellerProductDetail>(`${this.BASE}/stores/${storeId}/products/${id}`);
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

  updateVariant(storeId: number, productId: number, variantId: number, req: UpdateVariantRequest): Observable<ProductVariant> {
    return this.http.patch<ProductVariant>(`${this.BASE}/stores/${storeId}/products/${productId}/variants/${variantId}`, req);
  }

  deleteVariant(storeId: number, productId: number, variantId: number): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/stores/${storeId}/products/${productId}/variants/${variantId}`);
  }

  // ── Tags ─────────────────────────────────────────────────────────────────

  setProductTags(storeId: number, productId: number, tags: string[]): Observable<string[]> {
    return this.http.put<string[]>(`${this.BASE}/stores/${storeId}/products/${productId}/tags`, { tags });
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
