import { Component, inject } from '@angular/core';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { Store } from '@ngrx/store';
import { AsyncPipe, NgFor, NgIf, UpperCasePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { selectCartCount } from '../../../store/cart/cart.selectors';
import { openCart } from '../../../store/cart/cart.actions';
import { selectIsLoggedIn, selectAuthUser } from '../../../store/auth/auth.selectors';
import { logout } from '../../../store/auth/auth.actions';

const CATEGORIES = ['Raquetas', 'Zapatillas', 'Ropa', 'Pelotas', 'Accesorios'];

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, AsyncPipe, NgFor, NgIf, UpperCasePipe],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent {
  private store  = inject(Store);
  private router = inject(Router);

  accountOpen = false;

  cartCount$  = this.store.select(selectCartCount);
  isLoggedIn$ = this.store.select(selectIsLoggedIn);
  authUser$   = this.store.select(selectAuthUser);
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
  logOut()   { this.store.dispatch(logout()); this.router.navigate(['/']); }

  onSearch(query: string) {
    const q = query.trim();
    this.router.navigate(['/'], { queryParams: q ? { q } : {} });
  }

  goToCategory(cat: string | null) {
    this.router.navigate(['/'], { queryParams: cat ? { cat } : {} });
  }
}
