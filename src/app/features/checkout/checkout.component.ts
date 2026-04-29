import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { AsyncPipe, NgFor, NgIf, UpperCasePipe } from '@angular/common';
import { take } from 'rxjs';
import { selectCartItems, selectCartTotal, selectCartCount } from '../../store/cart/cart.selectors';
import { selectIsLoggedIn, selectAuthUser } from '../../store/auth/auth.selectors';
import { clearCart } from '../../store/cart/cart.actions';
import { CurrencyCopPipe } from '../../shared/pipes/currency-cop.pipe';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [AsyncPipe, NgFor, NgIf, RouterLink, CurrencyCopPipe, UpperCasePipe],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss',
})
export class CheckoutComponent implements OnInit {
  private store  = inject(Store);
  private router = inject(Router);

  items$      = this.store.select(selectCartItems);
  total$      = this.store.select(selectCartTotal);
  count$      = this.store.select(selectCartCount);
  authUser$   = this.store.select(selectAuthUser);
  isLoggedIn$ = this.store.select(selectIsLoggedIn);

  ngOnInit() {
    this.isLoggedIn$.pipe(take(1)).subscribe(loggedIn => {
      if (!loggedIn) {
        this.router.navigate(['/login'], { queryParams: { redirect: '/checkout' } });
        return;
      }
    });

    this.items$.pipe(take(1)).subscribe(items => {
      if (items.length === 0) this.router.navigate(['/']);
    });
  }

  varInfo(size: string | null, color: string | null): string {
    return [size, color].filter(Boolean).join(' · ');
  }

  confirm() {
    this.store.dispatch(clearCart());
    this.router.navigate(['/gracias']);
  }
}
