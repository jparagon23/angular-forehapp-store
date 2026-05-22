import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Product, ProductImage, ProductVariations } from '../models/product.model';
import { Category } from '../models/seller-product.model';

// Formato del listado público (sin variantes detalladas)
interface ApiProductSummary {
  id: number;
  title: string;
  brand: string;
  line: string | null;
  category: string;
  minPrice: number;
  compareAtPrice: number | null;
  variantCount: number;
  createdAt: string;
  thumbnailUrl: string | null;
}

interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface ProductFilters {
  search?: string;
  categoryId?: number;
  brandId?: number;
}

const EMOJI_MAP: Record<string, string> = {
  'Raquetas': '🎾',
  'Zapatillas de Tenis': '👟',
  'Zapatillas': '👟',
  'Ropa': '👕',
  'Pelotas': '🎾',
  'Accesorios': '🎒',
  'Cuerdas': '🧵',
};


@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly BASE = environment.apiBaseUrl;
  private http = inject(HttpClient);

  getProducts(filters?: ProductFilters): Observable<Product[]> {
    const params: Record<string, string> = {};
    if (filters?.search)     params['search']     = filters.search;
    if (filters?.categoryId) params['categoryId'] = String(filters.categoryId);
    if (filters?.brandId)    params['brandId']    = String(filters.brandId);

    return this.http.get<PageResponse<ApiProductSummary>>(`${this.BASE}/products/public`, { params }).pipe(
      map(page => page.content.map(p => this.mapProduct(p)))
    );
  }

  getProduct(id: number): Observable<Product | undefined> {
    return this.http.get<any>(`${this.BASE}/products/public/${id}`).pipe(
      map(raw => {
        if (!raw) return undefined;
        const minPrice = raw.variants?.length
          ? Math.min(...raw.variants.map((v: any) => v.price))
          : raw.minPrice ?? 0;
        const sizes = new Set<string>();
        const colors = new Set<string>();
        for (const v of (raw.variants ?? [])) {
          for (const a of (v.attributes ?? [])) {
            if (a.attribute.toLowerCase().includes('color')) colors.add(a.value);
            else sizes.add(a.value);
          }
        }
        const variations: ProductVariations | undefined =
          sizes.size || colors.size
            ? { sizes: sizes.size ? [...sizes] : undefined, colors: colors.size ? [...colors] : undefined }
            : (raw.variantCount > 0 ? { sizes: [''] } : undefined);
        const images: ProductImage[] = (raw.images ?? []).map((img: any) => ({
          id: img.id, url: img.url, displayOrder: img.displayOrder ?? 0,
        }));
        return {
          id:         raw.id,
          emoji:      EMOJI_MAP[raw.category] ?? '📦',
          image:      images[0]?.url ?? '',
          images,
          brand:      raw.brand,
          name:       raw.title,
          desc:       raw.description ?? raw.line ?? '',
          cat:        raw.category,
          price:      minPrice,
          stock:      raw.variants?.reduce((s: number, v: any) => s + v.stock, 0) ?? 0,
          status:     raw.status === 'ACTIVE' ? 'Activo' : raw.status === 'DRAFT' ? 'Borrador' : 'Agotado',
          variations,
          variants:   raw.variants ?? [],
        } as Product;
      })
    );
  }

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.BASE}/categories`);
  }

  // Mantenidos para compatibilidad con el panel de admin (operan localmente)
  createProduct(product: Omit<Product, 'id'>): Observable<Product> {
    return of({ ...product, id: Date.now() });
  }

  updateProduct(product: Product): Observable<Product> {
    return of(product);
  }

  deleteProduct(id: number): Observable<number> {
    return of(id);
  }

  updateStock(id: number, stock: number): Observable<{ id: number; stock: number }> {
    return of({ id, stock });
  }

  private mapProduct(raw: ApiProductSummary): Product {
    // Si tiene variantes, el usuario debe ir al detalle a elegir opciones
    const variations: ProductVariations | undefined =
      raw.variantCount > 1 ? { sizes: [''] } : undefined;

    return {
      id:             raw.id,
      emoji:          EMOJI_MAP[raw.category] ?? '📦',
      image:          raw.thumbnailUrl ?? '',
      brand:          raw.brand,
      name:           raw.title,
      desc:           raw.line ?? '',
      cat:            raw.category,
      price:          raw.minPrice,
      compareAtPrice: raw.compareAtPrice ?? null,
      stock:          raw.variantCount,
      status:         'Activo',
      variations,
    };
  }
}
