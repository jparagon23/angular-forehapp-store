import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Product, ProductVariations } from '../models/product.model';
import { Category } from '../models/seller-product.model';
import { Review } from '../models/review.model';

// Formato del listado público (sin variantes detalladas)
interface ApiProductSummary {
  id: number;
  title: string;
  brand: string;
  line: string | null;
  category: string;
  minPrice: number;
  variantCount: number;
  createdAt: string;
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

const MOCK_REVIEWS: Review[] = [
  { id: 1,  productId: 1,  author: 'Carlos M.',   rating: 5, comment: 'Control y potencia increíbles. Definitivamente se nota por qué es la raqueta de Federer. Vale cada peso invertido.', date: '2026-02-10', verified: true },
  { id: 2,  productId: 1,  author: 'Laura T.',     rating: 4, comment: 'Muy buena raqueta, aunque requiere práctica para dominarla. El brazo no se cansa tanto como esperaba.', date: '2026-01-28', verified: true },
  { id: 4,  productId: 2,  author: 'Andrés P.',    rating: 5, comment: 'El topspin que genera es brutal. Perfecta para jugar desde el fondo de la cancha con agresividad.', date: '2026-03-01', verified: true },
  { id: 5,  productId: 2,  author: 'María G.',     rating: 4, comment: 'Muy ligera y potente. La recomiendo para jugadores intermedios en adelante. El mango es muy cómodo.', date: '2026-02-14', verified: true },
  { id: 8,  productId: 4,  author: 'Valentina C.', rating: 5, comment: 'Muy cómodas y el agarre es excelente. Las uso en cancha dura y arcilla sin problema.', date: '2026-03-12', verified: true },
  { id: 13, productId: 7,  author: 'Sebastián L.', rating: 4, comment: 'La tela Dri-FIT es genial, no se siente el calor en cancha. El tallaje está un poco pequeño.', date: '2026-03-08', verified: true },
];

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
        return {
          id:         raw.id,
          emoji:      EMOJI_MAP[raw.category] ?? '📦',
          image:      raw.images?.[0]?.url ?? '',
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

  getReviews(productId: number): Observable<Review[]> {
    return of(MOCK_REVIEWS.filter(r => r.productId === productId));
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
      raw.variantCount > 0 ? { sizes: [''] } : undefined;

    return {
      id:         raw.id,
      emoji:      EMOJI_MAP[raw.category] ?? '📦',
      image:      '',
      brand:      raw.brand,
      name:       raw.title,
      desc:       raw.line ?? '',
      cat:        raw.category,
      price:      raw.minPrice,
      stock:      raw.variantCount,
      status:     'Activo',
      variations,
    };
  }
}
