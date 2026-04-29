import { Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { Router } from '@angular/router';
import { selectCartIsOpen, selectCartItems, selectCartTotal, selectCartCount } from '../../store/cart/cart.selectors';
import { closeCart, incrementQty, decrementQty, removeFromCart } from '../../store/cart/cart.actions';
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

  isOpen$     = this.store.select(selectCartIsOpen);
  items$      = this.store.select(selectCartItems);
  total$      = this.store.select(selectCartTotal);
  count$      = this.store.select(selectCartCount);
  isLoggedIn$ = this.store.select(selectIsLoggedIn);
  authUser$   = this.store.select(selectAuthUser);

  close()                    { this.store.dispatch(closeCart()); }
  increment(key: string)     { this.store.dispatch(incrementQty({ key })); }
  decrement(key: string)     { this.store.dispatch(decrementQty({ key })); }
  remove(key: string)        { this.store.dispatch(removeFromCart({ key })); }

  varInfo(size: string | null, color: string | null): string {
    return [size, color].filter(Boolean).join(' · ');
  }

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
