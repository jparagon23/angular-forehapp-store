import { Component, inject, OnDestroy, OnInit, signal, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Actions, ofType } from '@ngrx/effects';
import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { combineLatest, Subscription, take, catchError, of, filter } from 'rxjs';
import { map } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { addCartItem, openCart } from '../../store/cart/cart.actions';
import { addToWishlist, addToWishlistFailure, removeFromWishlist } from '../../store/wishlist/wishlist.actions';
import { selectWishlistProductIdToItemId } from '../../store/wishlist/wishlist.selectors';
import { selectIsLoggedIn, selectUserRole } from '../../store/auth/auth.selectors';
import { selectAllCategories } from '../../store/categories/categories.selectors';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { CartDrawerComponent } from '../cart/cart-drawer.component';
import { ToastComponent } from '../../shared/components/toast/toast.component';
import { CurrencyCopPipe } from '../../shared/pipes/currency-cop.pipe';
import { Product } from '../../core/models/product.model';
import { ProductService, ProductFilters, DiscoverySection, SortBy } from '../../core/services/product.service';
import { Category } from '../../core/models/seller-product.model';
import { SeoService } from '../../core/services/seo.service';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [AsyncPipe, NgFor, NgIf, RouterLink, NavbarComponent, CartDrawerComponent, ToastComponent, CurrencyCopPipe],
  templateUrl: './catalog.component.html',
  styleUrl: './catalog.component.scss',
})
export class CatalogComponent implements OnInit, AfterViewInit, OnDestroy {
  private store          = inject(Store);
  private actions$       = inject(Actions);
  private router         = inject(Router);
  private route          = inject(ActivatedRoute);
  private productService = inject(ProductService);
  private seo            = inject(SeoService);

  @ViewChild('sentinel') private sentinelRef!: ElementRef<HTMLElement>;
  private observer: IntersectionObserver | null = null;
  private loadSub  = new Subscription();
  private sub      = new Subscription();
  private categories: Category[] = [];
  private activeFilters: ProductFilters = {};
  private currentPage = 0;

  mode            = signal<'discovery' | 'listing'>('discovery');
  sections        = signal<DiscoverySection[]>([]);
  sectionsLoading = signal(true);

  products        = signal<Product[]>([]);
  initialLoading  = signal(true);
  loadingMore     = signal(false);
  hasNext         = signal(false);

  userRole$        = this.store.select(selectUserRole);
  toastMessage     = signal('');
  toastTrigger     = signal(0);
  addingProductId  = signal<number | null>(null);
  activeSortBy     = signal<SortBy>('NEWEST');
  freeShippingOnly = signal(false);

  wishlistItemMap = toSignal(this.store.select(selectWishlistProductIdToItemId), { initialValue: new Map<number, number>() });
  isLoggedIn      = toSignal(this.store.select(selectIsLoggedIn), { initialValue: false });

  activeFilter$ = this.route.queryParams.pipe(
    map(params => {
      if (params['q'])   return `Búsqueda: "${params['q']}"`;
      if (params['cat']) return `Categoría: ${params['cat']}`;
      return null;
    })
  );

  ngOnInit() {
    this.sub.add(
      this.actions$.pipe(ofType(addToWishlistFailure)).subscribe(({ error }) => {
        if (error) {
          this.toastMessage.set(error);
          this.toastTrigger.update(n => n + 1);
        }
      })
    );

    this.sub.add(
      combineLatest([
        this.store.select(selectAllCategories).pipe(filter(cats => cats.length > 0), take(1)),
        this.route.queryParams,
      ]).subscribe(([categories, params]) => {
        this.categories = categories;
        const search     = params['q']   || undefined;
        const catName    = params['cat'] || undefined;
        const categoryId = catName
          ? (categories as Category[]).find(c => c.name === catName)?.id
          : undefined;
        const sortBy      = (params['sort'] as SortBy) || 'NEWEST';
        const freeShip    = params['freeShipping'] === 'true';
        const isDiscovery = !search && !catName;

        this.activeSortBy.set(sortBy);
        this.freeShippingOnly.set(freeShip);
        this.mode.set(isDiscovery ? 'discovery' : 'listing');

        if (params['q']) {
          this.seo.set({ title: `Resultados para "${params['q']}"` });
        } else if (catName) {
          this.seo.set({ title: `${catName} de Tenis` });
        } else {
          this.seo.set({ title: 'Tienda de Tenis Online en Colombia' });
        }

        if (isDiscovery) {
          this.loadDiscovery();
        } else {
          this.activeFilters = { search, categoryId, sortBy, freeShipping: freeShip || undefined };
          this.loadPage(0);
        }
      })
    );
  }

  ngAfterViewInit() {
    this.observer = new IntersectionObserver(entries => {
      if (this.mode() === 'listing' && entries[0].isIntersecting && this.hasNext() && !this.loadingMore() && !this.initialLoading()) {
        this.loadPage(this.currentPage + 1);
      }
    }, { rootMargin: '300px' });
    this.observer.observe(this.sentinelRef.nativeElement);
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
    this.loadSub.unsubscribe();
    this.observer?.disconnect();
  }

  private loadPage(page: number) {
    if (page === 0) {
      this.loadSub.unsubscribe();
      this.loadSub = new Subscription();
      this.products.set([]);
      this.initialLoading.set(true);
      this.hasNext.set(false);
    } else {
      if (this.loadingMore()) return;
      this.loadingMore.set(true);
    }

    this.loadSub.add(
      this.productService.getProductsPage(this.activeFilters, page).subscribe({
        next: result => {
          this.initialLoading.set(false);
          this.loadingMore.set(false);
          if (result.page === 0) {
            this.products.set(result.items);
          } else {
            this.products.update(prev => [...prev, ...result.items]);
          }
          this.hasNext.set(result.hasNext);
          this.currentPage = result.page;
          // Re-evalúa el sentinel por si ya estaba en el viewport durante la carga
          if (result.hasNext && this.observer && this.sentinelRef) {
            this.observer.unobserve(this.sentinelRef.nativeElement);
            this.observer.observe(this.sentinelRef.nativeElement);
          }
        },
        error: () => {
          this.initialLoading.set(false);
          this.loadingMore.set(false);
        },
      })
    );
  }

  private loadDiscovery() {
    this.sectionsLoading.set(true);
    this.loadSub.unsubscribe();
    this.loadSub = new Subscription();
    this.loadSub.add(
      this.productService.getDiscoverySections().pipe(take(1)).subscribe({
        next: sections => { this.sections.set(sections); this.sectionsLoading.set(false); },
        error: ()       => this.sectionsLoading.set(false),
      })
    );
  }

  clearFilter()                              { this.router.navigate(['/']); }
  goToProduct(id: number)                    { this.router.navigate(['/product', id]); }
  goToCategoryListing(categoryName: string)  { this.router.navigate(['/'], { queryParams: { cat: categoryName } }); }

  setSortBy(sort: SortBy) {
    const qp = { ...this.route.snapshot.queryParams, sort: sort === 'NEWEST' ? null : sort };
    this.router.navigate(['/'], { queryParams: qp, queryParamsHandling: 'merge' });
  }

  toggleFreeShipping() {
    const qp = { ...this.route.snapshot.queryParams, freeShipping: this.freeShippingOnly() ? null : 'true' };
    this.router.navigate(['/'], { queryParams: qp, queryParamsHandling: 'merge' });
  }
  isWishlisted(id: number): boolean { return this.wishlistItemMap().has(id); }

  addToCart(product: Product, event: Event) {
    event.stopPropagation();
    this.addingProductId.set(product.id);
    this.productService.getProduct(product.id).pipe(take(1)).subscribe({
      next: detail => {
        this.addingProductId.set(null);
        const variant = detail?.variants?.[0];
        if (!variant) return;
        this.store.dispatch(addCartItem({
          variantId:    variant.id,
          quantity:     1,
          productTitle: product.name,
          sku:          variant.sku ?? undefined,
          unitPrice:    variant.price ?? product.price,
          imageUrl:     product.image || detail?.image,
        }));
        this.store.dispatch(openCart());
        this.toastMessage.set(`${product.name} agregado al carrito`);
        this.toastTrigger.update(n => n + 1);
      },
      error: () => this.addingProductId.set(null),
    });
  }

  toggleWishlist(product: Product, event: Event) {
    event.stopPropagation();
    if (this.isWishlisted(product.id)) {
      const itemId = this.wishlistItemMap().get(product.id);
      if (itemId) this.store.dispatch(removeFromWishlist({ itemId }));
    } else {
      this.store.dispatch(addToWishlist({ productId: product.id }));
      this.toastMessage.set('Guardado en lista de deseos ♥');
      this.toastTrigger.update(n => n + 1);
    }
  }

  hasVariations(p: Product): boolean {
    return !!(p.variations?.sizes?.length || p.variations?.colors?.length);
  }

  discountPct(compareAt: number, price: number): number {
    return Math.round((1 - price / compareAt) * 100);
  }

  onImgLoad(event: Event) {
    const img = event.target as HTMLImageElement;
    img.classList.add('loaded');
    const skeleton = img.parentElement?.querySelector('.img-skeleton') as HTMLElement | null;
    if (skeleton) skeleton.style.display = 'none';
  }

  onImgError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
    const skeleton = img.parentElement?.querySelector('.img-skeleton') as HTMLElement | null;
    if (skeleton) skeleton.style.display = 'none';
  }
}
