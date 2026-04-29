import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { AsyncPipe, DatePipe, NgFor, NgIf } from '@angular/common';
import { Observable, combineLatest, map } from 'rxjs';
import { loadProduct, loadProducts } from '../../store/products/products.actions';
import { selectSelectedProduct, selectProductsLoading, selectAllProducts } from '../../store/products/products.selectors';
import { addToCart, openCart } from '../../store/cart/cart.actions';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { CartDrawerComponent } from '../cart/cart-drawer.component';
import { ToastComponent } from '../../shared/components/toast/toast.component';
import { CurrencyCopPipe } from '../../shared/pipes/currency-cop.pipe';
import { CartItem } from '../../core/models/cart-item.model';
import { Product } from '../../core/models/product.model';
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

  selectedSize = signal<string | null>(null);
  selectedColor = signal<string | null>(null);
  qty = signal(1);
  toastMessage = signal('');
  currentSlide = signal(0);

  readonly colorHex = COLOR_HEX;
  readonly slideBackgrounds = [
    'linear-gradient(135deg, #e8f7e2, #f5faf5)',
    'linear-gradient(135deg, #ddeaf7, #eef4fc)',
    'linear-gradient(135deg, #fdf5e2, #faf8f0)',
    'linear-gradient(135deg, #fde8f2, #faf0f6)',
  ];

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.store.dispatch(loadProducts());
    this.store.dispatch(loadProduct({ id }));
    this.currentSlide.set(0);
    this.selectedSize.set(null);
    this.selectedColor.set(null);
    this.qty.set(1);

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

  selectSize(size: string) { this.selectedSize.set(size); }
  selectColor(color: string) { this.selectedColor.set(color); }

  changeQty(delta: number) {
    this.qty.set(Math.max(1, this.qty() + delta));
  }

  canAdd(product: any): boolean {
    const needSize = product.variations?.sizes?.length > 0;
    const needColor = product.variations?.colors?.length > 0;
    return (!needSize || !!this.selectedSize()) && (!needColor || !!this.selectedColor());
  }

  hintText(product: any): string {
    const parts: string[] = [];
    if (product.variations?.sizes?.length) parts.push('talla');
    if (product.variations?.colors?.length) parts.push('color');
    return parts.length ? `* Selecciona ${parts.join(' y ')} para continuar` : '';
  }

  addToCart(product: any) {
    const size = this.selectedSize();
    const color = this.selectedColor();
    let key = String(product.id);
    if (size) key += '_' + size.replace(/\s+/g, '');
    if (color) key += '_' + color.replace(/\s+/g, '');

    const item: CartItem = {
      key, id: product.id, name: product.name,
      emoji: product.emoji, price: product.price,
      qty: this.qty(), size, color,
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
}
