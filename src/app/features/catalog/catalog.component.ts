import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { Actions, ofType } from '@ngrx/effects';
import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { combineLatest, map, take, catchError, of, Subscription } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { loadProducts } from '../../store/products/products.actions';
import { selectAllProducts, selectProductsLoading } from '../../store/products/products.selectors';
import { addToWishlist, addToWishlistFailure, removeFromWishlist } from '../../store/wishlist/wishlist.actions';
import { selectWishlistProductIdToItemId } from '../../store/wishlist/wishlist.selectors';
import { selectIsLoggedIn, selectUserRole } from '../../store/auth/auth.selectors';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { CartDrawerComponent } from '../cart/cart-drawer.component';
import { ToastComponent } from '../../shared/components/toast/toast.component';
import { CurrencyCopPipe } from '../../shared/pipes/currency-cop.pipe';
import { Product } from '../../core/models/product.model';
import { ProductService } from '../../core/services/product.service';
import { Category } from '../../core/models/seller-product.model';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [AsyncPipe, NgFor, NgIf, RouterLink, NavbarComponent, CartDrawerComponent, ToastComponent, CurrencyCopPipe],
  templateUrl: './catalog.component.html',
  styleUrl: './catalog.component.scss',
})
export class CatalogComponent implements OnInit, OnDestroy {
  private store          = inject(Store);
  private actions$       = inject(Actions);
  private router         = inject(Router);
  private route          = inject(ActivatedRoute);
  private productService = inject(ProductService);
  private sub            = new Subscription();

  loading$     = this.store.select(selectProductsLoading);
  userRole$    = this.store.select(selectUserRole);
  toastMessage = signal('');
  toastTrigger = signal(0);

  wishlistItemMap = toSignal(this.store.select(selectWishlistProductIdToItemId), { initialValue: new Map<number, number>() });
  isLoggedIn          = toSignal(this.store.select(selectIsLoggedIn),                 { initialValue: false });

  filteredProducts$ = this.store.select(selectAllProducts);

  activeFilter$ = this.route.queryParams.pipe(
    map(params => {
      if (params['q'])   return `Búsqueda: "${params['q']}"`;
      if (params['cat']) return `Categoría: ${params['cat']}`;
      return null;
    })
  );

  private categories: Category[] = [];

  ngOnInit() {
    this.sub.add(
      this.actions$.pipe(ofType(addToWishlistFailure)).subscribe(({ error }) => {
        if (error) {
          this.toastMessage.set(error);
          this.toastTrigger.update(n => n + 1);
        }
      })
    );

    combineLatest([
      this.productService.getCategories().pipe(catchError(() => of([])), take(1)),
      this.route.queryParams,
    ]).subscribe(([categories, params]) => {
      this.categories = categories;
      const search     = params['q']   || undefined;
      const catName    = params['cat'] || undefined;
      const categoryId = catName
        ? categories.find((c: Category) => c.name === catName)?.id
        : undefined;
      this.store.dispatch(loadProducts({ search, categoryId }));
    });
  }

  ngOnDestroy() { this.sub.unsubscribe(); }

  clearFilter()       { this.router.navigate(['/']); }
  goToProduct(id: number) { this.router.navigate(['/product', id]); }
  isWishlisted(id: number): boolean { return this.wishlistItemMap().has(id); }

  addToCart(product: Product, event: Event) {
    event.stopPropagation();
    this.router.navigate(['/product', product.id]);
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
