import { Component, inject, OnInit, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { combineLatest, map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { loadProducts } from '../../store/products/products.actions';
import { selectAllProducts, selectProductsLoading } from '../../store/products/products.selectors';
import { addToCart, openCart } from '../../store/cart/cart.actions';
import { addToWishlist, removeFromWishlist } from '../../store/wishlist/wishlist.actions';
import { selectWishlistIds } from '../../store/wishlist/wishlist.selectors';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { CartDrawerComponent } from '../cart/cart-drawer.component';
import { ToastComponent } from '../../shared/components/toast/toast.component';
import { CurrencyCopPipe } from '../../shared/pipes/currency-cop.pipe';
import { CartItem } from '../../core/models/cart-item.model';
import { Product } from '../../core/models/product.model';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [AsyncPipe, NgFor, NgIf, RouterLink, NavbarComponent, CartDrawerComponent, ToastComponent, CurrencyCopPipe],
  templateUrl: './catalog.component.html',
  styleUrl: './catalog.component.scss',
})
export class CatalogComponent implements OnInit {
  private store = inject(Store);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loading$    = this.store.select(selectProductsLoading);
  toastMessage = signal('');

  wishlistIds = toSignal(this.store.select(selectWishlistIds), { initialValue: [] as number[] });

  filteredProducts$ = combineLatest([
    this.store.select(selectAllProducts),
    this.route.queryParams,
  ]).pipe(
    map(([products, params]) => {
      let result = products;
      if (params['cat']) result = result.filter(p => p.cat === params['cat']);
      if (params['q']) {
        const q = (params['q'] as string).toLowerCase();
        result = result.filter(p =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.desc.toLowerCase().includes(q)
        );
      }
      return result;
    })
  );

  activeFilter$ = this.route.queryParams.pipe(
    map(params => {
      if (params['q'])   return `Búsqueda: "${params['q']}"`;
      if (params['cat']) return `Categoría: ${params['cat']}`;
      return null;
    })
  );

  ngOnInit() { this.store.dispatch(loadProducts()); }

  clearFilter()       { this.router.navigate(['/']); }
  goToProduct(id: number) { this.router.navigate(['/product', id]); }
  isWishlisted(id: number) { return this.wishlistIds().includes(id); }

  addToCart(product: Product, event: Event) {
    event.stopPropagation();
    const item: CartItem = {
      key: String(product.id), id: product.id, name: product.name,
      emoji: product.emoji, price: product.price, qty: 1, size: null, color: null,
    };
    this.store.dispatch(addToCart({ item }));
    this.store.dispatch(openCart());
    this.toastMessage.set('Producto agregado 🎾 — ' + Date.now());
  }

  toggleWishlist(product: Product, event: Event) {
    event.stopPropagation();
    if (this.isWishlisted(product.id)) {
      this.store.dispatch(removeFromWishlist({ id: product.id }));
    } else {
      this.store.dispatch(addToWishlist({
        item: { id: product.id, name: product.name, brand: product.brand,
                emoji: product.emoji, price: product.price, cat: product.cat },
      }));
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
