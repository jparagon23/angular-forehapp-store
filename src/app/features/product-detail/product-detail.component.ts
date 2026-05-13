import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { AsyncPipe, DatePipe, NgFor, NgIf } from '@angular/common';
import { Observable, combineLatest, map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { loadProduct, loadProducts } from '../../store/products/products.actions';
import { selectSelectedProduct, selectProductsLoading, selectAllProducts } from '../../store/products/products.selectors';
import { addToCart, openCart } from '../../store/cart/cart.actions';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { CartDrawerComponent } from '../cart/cart-drawer.component';
import { ToastComponent } from '../../shared/components/toast/toast.component';
import { CurrencyCopPipe } from '../../shared/pipes/currency-cop.pipe';
import { CartItem } from '../../core/models/cart-item.model';
import { DetailVariant, Product } from '../../core/models/product.model';
import { Review } from '../../core/models/review.model';
import { ProductService } from '../../core/services/product.service';

const COLOR_HEX: Record<string, string> = {
  'Blanco': '#f0f0f0', 'Negro': '#1a1a1a', 'Azul Royal': '#1565c0',
  'Rojo': '#e53935', 'Verde': '#2e7d32', 'Navy': '#1a237e',
  'Verde Lacoste': '#00843d', 'Rojo Oscuro': '#7b1a1a',
};

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [AsyncPipe, DatePipe, NgFor, NgIf, RouterLink, NavbarComponent, CartDrawerComponent, ToastComponent, CurrencyCopPipe],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss',
})
export class ProductDetailComponent implements OnInit {
  private store = inject(Store);
  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);

  product$ = this.store.select(selectSelectedProduct);
  loading$ = this.store.select(selectProductsLoading);
  reviews$!: Observable<Review[]>;
  relatedProducts$!: Observable<Product[]>;

  selectedAttributes = signal<Record<string, string>>({});
  qty          = signal(1);
  toastMessage = signal('');
  currentSlide = signal(0);

  readonly colorHex = COLOR_HEX;
  readonly slideBackgrounds = [
    'linear-gradient(135deg, #e8f7e2, #f5faf5)',
    'linear-gradient(135deg, #ddeaf7, #eef4fc)',
    'linear-gradient(135deg, #fdf5e2, #faf8f0)',
    'linear-gradient(135deg, #fde8f2, #faf0f6)',
  ];

  private productSignal = toSignal(this.store.select(selectSelectedProduct));

  // Atributos dinámicos: computed síncrono, se recalcula cuando cambia el producto
  attributeGroups = computed(() => {
    const p = this.productSignal();
    if (!p?.variants?.length) return [];
    const map = new Map<string, Set<string>>();
    for (const v of p.variants) {
      for (const a of v.attributes) {
        if (!map.has(a.attribute)) map.set(a.attribute, new Set());
        map.get(a.attribute)!.add(a.value);
      }
    }
    return [...map.entries()].map(([name, vals]) => ({ name, values: [...vals] }));
  });

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.store.dispatch(loadProducts({}));
    this.store.dispatch(loadProduct({ id }));
    this.currentSlide.set(0);
    this.qty.set(1);
    this.selectedAttributes.set({});

    this.reviews$ = this.productService.getReviews(id);

    this.relatedProducts$ = combineLatest([
      this.store.select(selectAllProducts),
      this.product$,
    ]).pipe(
      map(([all, product]) =>
        product ? all.filter(p => p.cat === product.cat && p.id !== product.id).slice(0, 4) : []
      )
    );
  }

  setSlide(i: number) { this.currentSlide.set(i); }
  prevSlide() { this.currentSlide.update(i => (i - 1 + this.slideBackgrounds.length) % this.slideBackgrounds.length); }
  nextSlide() { this.currentSlide.update(i => (i + 1) % this.slideBackgrounds.length); }

  selectAttribute(name: string, value: string) {
    this.selectedAttributes.update(attrs => ({ ...attrs, [name]: value }));
  }

  selectedVariant(product: Product): DetailVariant | null {
    if (!product.variants?.length) return null;
    const sel = this.selectedAttributes();
    return product.variants.find(v =>
      v.attributes.every(a => sel[a.attribute] === a.value)
    ) ?? null;
  }

  // null = no hay variante completamente seleccionada aún
  availableStock(product: Product): number | null {
    const groups = this.attributeGroups();
    const sel = this.selectedAttributes();
    const allSelected = !groups.length || groups.every(g => !!sel[g.name]);
    if (!allSelected) return null;
    const variant = this.selectedVariant(product);
    return variant ? variant.stock : product.stock;
  }

  changeQty(delta: number, product: Product) {
    const stock = this.availableStock(product);
    const max = stock ?? 999;
    this.qty.set(Math.min(max, Math.max(1, this.qty() + delta)));
  }

  canAdd(product: Product): boolean {
    const stock = this.availableStock(product);
    return stock !== null && stock > 0;
  }

  hintText(product: Product): string {
    const groups = this.attributeGroups();
    const sel = this.selectedAttributes();
    const missing = groups.filter(g => !sel[g.name]).map(g => g.name);
    if (missing.length) return `* Selecciona: ${missing.join(', ')}`;
    if (this.availableStock(product) === 0) return 'Sin stock disponible';
    return '';
  }

  addToCart(product: Product) {
    const variant = this.selectedVariant(product);
    const attrKey = Object.entries(this.selectedAttributes())
      .map(([, v]) => v.replace(/\s+/g, ''))
      .join('_');
    const key = attrKey ? `${product.id}_${attrKey}` : String(product.id);
    const attrDesc = Object.entries(this.selectedAttributes())
      .map(([k, v]) => `${k}: ${v}`)
      .join(' · ') || null;

    const item: CartItem = {
      key, id: product.id, name: product.name,
      emoji: product.emoji,
      price: variant?.price ?? product.price,
      qty: this.qty(), size: attrDesc, color: null,
    };
    this.store.dispatch(addToCart({ item }));
    this.store.dispatch(openCart());
    this.toastMessage.set(`${product.name} agregado al carrito 🎾 — ${Date.now()}`);
  }

  avgRating(reviews: Review[]): number {
    if (!reviews.length) return 0;
    return Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10;
  }

  starsArray(rating: number): string[] {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5 ? 1 : 0;
    const empty = 5 - full - half;
    return [...Array(full).fill('★'), ...Array(half).fill('½'), ...Array(empty).fill('☆')];
  }

  onImgError(event: Event) {
    (event.target as HTMLImageElement).style.display = 'none';
  }
}
