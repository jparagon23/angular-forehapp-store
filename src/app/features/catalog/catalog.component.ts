import { Component, inject, OnInit, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { combineLatest, map, take, catchError, of } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { loadProducts } from '../../store/products/products.actions';
import { selectAllProducts, selectProductsLoading } from '../../store/products/products.selectors';
import { addToWishlist, removeFromWishlist } from '../../store/wishlist/wishlist.actions';
import { selectWishlistProductIds, selectWishlistProductIdToItemId } from '../../store/wishlist/wishlist.selectors';
import { selectIsLoggedIn } from '../../store/auth/auth.selectors';
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
export class CatalogComponent implements OnInit {
  private store          = inject(Store);
  private router         = inject(Router);
  private route          = inject(ActivatedRoute);
  private productService = inject(ProductService);

  loading$     = this.store.select(selectProductsLoading);
  toastMessage = signal('');

  wishlistProductIds  = toSignal(this.store.select(selectWishlistProductIds),         { initialValue: [] as number[] });
  wishlistItemMap     = toSignal(this.store.select(selectWishlistProductIdToItemId),  { initialValue: new Map<number, number>() });
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

  clearFilter()       { this.router.navigate(['/']); }
  goToProduct(id: number) { this.router.navigate(['/product', id]); }
  isWishlisted(id: number): boolean { return this.wishlistProductIds().includes(id); }

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
      this.toastMessage.set('Guardado en lista de deseos ♥ — ' + Date.now());
    }
  }

  hasVariations(p: Product): boolean {
    return !!(p.variations?.sizes?.length || p.variations?.colors?.length);
  }

  onImgError(event: Event) {
    (event.target as HTMLImageElement).style.display = 'none';
  }
}
