import { Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { Router } from '@angular/router';
import { catchError, map, startWith, switchMap, take } from 'rxjs/operators';
import { forkJoin, Observable, of } from 'rxjs';
import { CartSellerGroup } from '../../core/models/cart.model';
import { Product } from '../../core/models/product.model';
import { ProductService } from '../../core/services/product.service';
import {
  selectCartIsOpen, selectSellerGroups, selectCartTotal,
  selectCartCount, selectPriceChangedItems, selectCartLoading,
} from '../../store/cart/cart.selectors';
import { closeCart, removeCartItem, updateCartItem } from '../../store/cart/cart.actions';
import { selectIsLoggedIn, selectAuthUser } from '../../store/auth/auth.selectors';
import { CurrencyCopPipe } from '../../shared/pipes/currency-cop.pipe';

@Component({
  selector: 'app-cart-drawer',
  standalone: true,
  imports: [AsyncPipe, NgFor, NgIf, CurrencyCopPipe],
  templateUrl: './cart-drawer.component.html',
  styleUrl: './cart-drawer.component.scss',
})
export class CartDrawerComponent {
  private store      = inject(Store);
  private router     = inject(Router);
  private productSvc = inject(ProductService);

  isOpen$            = this.store.select(selectCartIsOpen);
  sellerGroups$      = this.store.select(selectSellerGroups);
  total$             = this.store.select(selectCartTotal);
  count$             = this.store.select(selectCartCount);
  loading$           = this.store.select(selectCartLoading);
  isLoggedIn$        = this.store.select(selectIsLoggedIn);
  authUser$          = this.store.select(selectAuthUser);
  priceChangedItems$ = this.store.select(selectPriceChangedItems);

  recommendations$: Observable<Record<number, Product[]>> = this.sellerGroups$.pipe(
    switchMap(groups => {
      const shortfallGroups = groups.filter(
        g => g.freeShippingMinAmount != null && g.subtotal < g.freeShippingMinAmount!
      );
      if (!shortfallGroups.length) return of({} as Record<number, Product[]>);

      const requests = shortfallGroups.map(group =>
        this.productSvc.getProducts({
          storeId:           group.storeId,
          maxPrice:          group.freeShippingMinAmount! - group.subtotal,
          excludeProductIds: group.items.map(i => i.productId),
          sortBy:            'PRICE_DESC',
          size:              4,
        }).pipe(
          map(products => ({ storeId: group.storeId, products })),
          catchError(() => of({ storeId: group.storeId, products: [] as Product[] }))
        )
      );

      return forkJoin(requests).pipe(
        map(results =>
          results.reduce((acc, r) => ({ ...acc, [r.storeId]: r.products }), {} as Record<number, Product[]>)
        )
      );
    }),
    startWith({} as Record<number, Product[]>)
  );

  close() { this.store.dispatch(closeCart()); }

  increment(itemId: number, currentQty: number) {
    if (currentQty >= 9999) return;
    this.store.dispatch(updateCartItem({ itemId, quantity: currentQty + 1 }));
  }

  decrement(itemId: number, currentQty: number) {
    if (currentQty <= 1) {
      this.store.dispatch(removeCartItem({ itemId }));
      return;
    }
    this.store.dispatch(updateCartItem({ itemId, quantity: currentQty - 1 }));
  }

  remove(itemId: number) { this.store.dispatch(removeCartItem({ itemId })); }

  goToProduct(id: number) {
    this.store.dispatch(closeCart());
    this.router.navigate(['/product', id]);
  }

  fspPct(group: CartSellerGroup): number {
    if (!group.freeShippingMinAmount) return 0;
    return Math.min(100, Math.round((group.subtotal / group.freeShippingMinAmount) * 100));
  }

  goToCheckout() {
    this.store.dispatch(closeCart());
    // Logged-in users go directly to checkout; guests go to the entry page
    this.store.select(selectIsLoggedIn).pipe(take(1)).subscribe(loggedIn => {
      this.router.navigate([loggedIn ? '/checkout' : '/checkout/start']);
    });
  }
}
