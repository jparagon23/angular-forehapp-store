import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { AsyncPipe, DatePipe, NgFor, NgIf, TitleCasePipe } from '@angular/common';
import { Observable, combineLatest, map, take } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { clearSelectedProduct, loadProduct, loadProducts } from '../../store/products/products.actions';
import { selectSelectedProduct, selectSelectedProductLoading, selectAllProducts } from '../../store/products/products.selectors';
import { addCartItem, openCart } from '../../store/cart/cart.actions';
import { selectIsLoggedIn } from '../../store/auth/auth.selectors';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { apiCode } from '../../core/models/api-error.model';
import { CartDrawerComponent } from '../cart/cart-drawer.component';
import { ToastComponent } from '../../shared/components/toast/toast.component';
import { CurrencyCopPipe } from '../../shared/pipes/currency-cop.pipe';
import { DetailVariant, Product } from '../../core/models/product.model';
import { ReviewResponse, ProductRatingSummary } from '../../core/models/review.model';
import { ReviewService } from '../../core/services/review.service';

const COLOR_HEX: Record<string, string> = {
  'Blanco': '#f0f0f0', 'Negro': '#1a1a1a', 'Azul Royal': '#1565c0',
  'Rojo': '#e53935', 'Verde': '#2e7d32', 'Navy': '#1a237e',
  'Verde Lacoste': '#00843d', 'Rojo Oscuro': '#7b1a1a',
};

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [AsyncPipe, DatePipe, NgFor, NgIf, TitleCasePipe, RouterLink, NavbarComponent, CartDrawerComponent, ToastComponent, CurrencyCopPipe],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss',
})
export class ProductDetailComponent implements OnInit {
  private store         = inject(Store);
  private route         = inject(ActivatedRoute);
  private reviewService = inject(ReviewService);

  product$          = this.store.select(selectSelectedProduct);
  selectedLoading$  = this.store.select(selectSelectedProductLoading);
  relatedProducts$!: Observable<Product[]>;

  isLoggedIn        = toSignal(this.store.select(selectIsLoggedIn), { initialValue: false });

  selectedAttributes = signal<Record<string, string>>({});
  qty            = signal(1);
  toastMessage   = signal('');
  currentSlide   = signal(0);
  slideImgLoaded = signal(false);

  // Reviews state
  reviews         = signal<ReviewResponse[]>([]);
  reviewSummary   = signal<ProductRatingSummary | null>(null);
  reviewsLoading  = signal(false);
  reviewsPage     = signal(0);
  reviewsTotalPg  = signal(0);
  myReview        = signal<ReviewResponse | null>(null);
  formVisible     = signal(false);
  rvRating        = signal(0);
  rvTitle         = signal('');
  rvComment       = signal('');
  rvSubmitting    = signal(false);
  rvError         = signal('');

  private currentProductId = 0;

  readonly colorHex = COLOR_HEX;
  readonly fallbackBackgrounds = [
    'linear-gradient(135deg, #e8f7e2, #f5faf5)',
    'linear-gradient(135deg, #ddeaf7, #eef4fc)',
    'linear-gradient(135deg, #fdf5e2, #faf8f0)',
    'linear-gradient(135deg, #fde8f2, #faf0f6)',
  ];
  readonly starNums = [1, 2, 3, 4, 5];

  productImages = computed(() => {
    const p = this.productSignal();
    return p?.images?.length ? p.images : [];
  });

  slideCount = computed(() => Math.max(this.productImages().length, 1));

  private productSignal = toSignal(this.store.select(selectSelectedProduct));

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

  displayRating = computed(() =>
    Math.round((this.reviewSummary()?.averageRating ?? 0) * 10) / 10
  );

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.currentProductId = id;

    this.store.dispatch(clearSelectedProduct());
    this.store.dispatch(loadProducts({}));
    this.store.dispatch(loadProduct({ id }));
    this.currentSlide.set(0);
    this.qty.set(1);
    this.selectedAttributes.set({});

    this.loadReviews(id, 0);

    this.store.select(selectIsLoggedIn).pipe(take(1)).subscribe(loggedIn => {
      if (loggedIn) this.loadMyReview();
    });

    this.relatedProducts$ = combineLatest([
      this.store.select(selectAllProducts),
      this.product$,
    ]).pipe(
      map(([all, product]) =>
        product ? all.filter(p => p.cat === product.cat && p.id !== product.id).slice(0, 4) : []
      )
    );
  }

  loadReviews(productId: number, page: number) {
    this.reviewsLoading.set(true);
    this.reviewService.getProductReviews(productId, page).subscribe({
      next: res => {
        this.reviews.update(prev => page === 0 ? res.reviews : [...prev, ...res.reviews]);
        if (res.summary) this.reviewSummary.set(res.summary);
        this.reviewsPage.set(res.currentPage);
        this.reviewsTotalPg.set(res.totalPages);
        this.reviewsLoading.set(false);
      },
      error: () => this.reviewsLoading.set(false),
    });
  }

  loadMoreReviews() {
    this.loadReviews(this.currentProductId, this.reviewsPage() + 1);
  }

  private loadMyReview() {
    this.reviewService.getMyReviews().subscribe({
      next: reviews => {
        const mine = reviews.find(r => r.productId === this.currentProductId) ?? null;
        this.myReview.set(mine);
      },
    });
  }

  setRating(n: number) { this.rvRating.set(n); }

  submitReview() {
    const rating = this.rvRating();
    if (!rating) return;
    this.rvSubmitting.set(true);
    this.rvError.set('');
    this.reviewService.createReview(this.currentProductId, {
      rating,
      title:   this.rvTitle().trim() || undefined,
      comment: this.rvComment().trim() || undefined,
    }).subscribe({
      next: review => {
        this.myReview.set(review);
        this.formVisible.set(false);
        this.rvSubmitting.set(false);
        this.toastMessage.set('Reseña enviada. Será visible en el plazo de 24 horas. — ' + Date.now());
      },
      error: err => {
        this.rvSubmitting.set(false);
        if (apiCode(err) === 'REVIEW_DUPLICATE') this.rvError.set('Ya tienes una reseña para este producto.');
        else this.rvError.set('No se pudo enviar la reseña. Intenta de nuevo.');
      },
    });
  }

  statusLabel(s: string): string {
    if (s === 'APROBADO') return '✅ Aprobada';
    if (s === 'RECHAZADO') return '❌ Rechazada';
    return '⏳ En revisión';
  }

  setSlide(i: number) { this.slideImgLoaded.set(false); this.currentSlide.set(i); }
  prevSlide() { this.slideImgLoaded.set(false); this.currentSlide.update(i => (i - 1 + this.slideCount()) % this.slideCount()); }
  nextSlide() { this.slideImgLoaded.set(false); this.currentSlide.update(i => (i + 1) % this.slideCount()); }
  onSlideImgLoad() { this.slideImgLoaded.set(true); }
  onImgLoad(event: Event) {
    const img = event.target as HTMLImageElement;
    img.classList.add('loaded');
    const skeleton = img.parentElement?.querySelector('.img-skeleton') as HTMLElement | null;
    if (skeleton) skeleton.style.display = 'none';
  }

  isValueOutOfStock(groupName: string, value: string, product: Product): boolean {
    if (!product.variants?.length) return false;
    const sel = this.selectedAttributes();
    const matching = product.variants.filter(v =>
      v.attributes.some(a => a.attribute === groupName && a.value === value) &&
      v.attributes.every(a => a.attribute === groupName || !sel[a.attribute] || sel[a.attribute] === a.value)
    );
    return matching.length === 0 || matching.every(v => v.stock === 0);
  }

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

  variantDiscountPct(compareAt: number, price: number): number {
    return Math.round((1 - price / compareAt) * 100);
  }

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
    const variant   = this.selectedVariant(product);
    const target    = variant ?? product.variants?.[0];
    const variantId = target?.id;
    if (!variantId) return;
    this.store.dispatch(addCartItem({
      variantId,
      quantity:     this.qty(),
      productTitle: product.name,
      sku:          target.sku,
      unitPrice:    target.price ?? product.price,
    }));
    this.store.dispatch(openCart());
    this.toastMessage.set(`${product.name} agregado al carrito 🎾 — ${Date.now()}`);
  }

  starsArray(rating: number): string[] {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5 ? 1 : 0;
    const empty = 5 - full - half;
    return [...Array(full).fill('★'), ...Array(half).fill('½'), ...Array(empty).fill('☆')];
  }

  onImgError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
    const skeleton = img.parentElement?.querySelector('.img-skeleton') as HTMLElement | null;
    if (skeleton) skeleton.style.display = 'none';
  }
}
