import { Component, inject } from '@angular/core';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { Store } from '@ngrx/store';
import { AsyncPipe, NgFor, NgIf, UpperCasePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith, take } from 'rxjs';
import { selectCartCount } from '../../../store/cart/cart.selectors';
import { openCart } from '../../../store/cart/cart.actions';
import { selectIsLoggedIn, selectAuthUser, selectUserRole } from '../../../store/auth/auth.selectors';
import { logout } from '../../../store/auth/auth.actions';
import { TokenStore } from '../../../core/services/token-store.service';

const CATEGORIES = ['Raquetas', 'Zapatillas', 'Ropa', 'Pelotas', 'Accesorios'];

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, AsyncPipe, NgFor, NgIf, UpperCasePipe],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent {
  private store      = inject(Store);
  private router     = inject(Router);
  private tokenStore = inject(TokenStore);

  accountOpen = false;

  cartCount$  = this.store.select(selectCartCount);
  isLoggedIn$ = this.store.select(selectIsLoggedIn);
  authUser$   = this.store.select(selectAuthUser);
  userRole$   = this.store.select(selectUserRole);
  readonly categories = CATEGORIES;

  activeCategory = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      startWith(null),
      map(() => new URLSearchParams(this.router.url.split('?')[1] ?? '').get('cat'))
    ),
    { initialValue: null }
  );

  openCart() { this.store.dispatch(openCart()); }
  logOut() {
    this.tokenStore.clearTokens();
    this.store.dispatch(logout());
    this.router.navigate(['/']);
  }

  goToOrders() {
    this.isLoggedIn$.pipe(take(1)).subscribe(loggedIn => {
      if (loggedIn) {
        this.router.navigate(['/orders']);
      } else {
        this.router.navigate(['/login'], { queryParams: { redirect: '/orders' } });
      }
    });
  }

  onSearch(query: string) {
    const q = query.trim();
    this.router.navigate(['/'], { queryParams: q ? { q } : {} });
  }

  goToCategory(cat: string | null) {
    this.router.navigate(['/'], { queryParams: cat ? { cat } : {} });
  }
}
