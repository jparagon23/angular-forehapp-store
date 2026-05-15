import { Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { Router } from '@angular/router';
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
  private store  = inject(Store);
  private router = inject(Router);

  isOpen$            = this.store.select(selectCartIsOpen);
  sellerGroups$      = this.store.select(selectSellerGroups);
  total$             = this.store.select(selectCartTotal);
  count$             = this.store.select(selectCartCount);
  loading$           = this.store.select(selectCartLoading);
  isLoggedIn$        = this.store.select(selectIsLoggedIn);
  authUser$          = this.store.select(selectAuthUser);
  priceChangedItems$ = this.store.select(selectPriceChangedItems);

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

  goToCheckout() {
    this.store.dispatch(closeCart());
    this.router.navigate(['/checkout']);
  }

  goToLogin() {
    this.store.dispatch(closeCart());
    this.router.navigate(['/login'], { queryParams: { redirect: '/checkout' } });
  }

  goToRegister() {
    this.store.dispatch(closeCart());
    this.router.navigate(['/register'], { queryParams: { redirect: '/checkout' } });
  }
}
