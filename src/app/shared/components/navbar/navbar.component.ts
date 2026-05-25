import { Component, computed, DestroyRef, HostListener, inject, signal } from '@angular/core';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { Store } from '@ngrx/store';
import { AsyncPipe, NgFor, NgIf, TitleCasePipe, UpperCasePipe } from '@angular/common';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject } from 'rxjs';
import { filter, map, startWith, take, debounceTime, distinctUntilChanged, switchMap, catchError, of } from 'rxjs';
import { selectCartCount } from '../../../store/cart/cart.selectors';
import { selectWishlistCount } from '../../../store/wishlist/wishlist.selectors';
import { openCart } from '../../../store/cart/cart.actions';
import { selectIsLoggedIn, selectAuthUser, selectUserRole, selectCanShop, selectHasSeller, selectHasAdmin } from '../../../store/auth/auth.selectors';
import { logout } from '../../../store/auth/auth.actions';
import { loadAddresses, deleteAddress, setDefaultAddress } from '../../../store/addresses/addresses.actions';
import { selectAllAddresses, selectDefaultAddress, selectAddressesLoading } from '../../../store/addresses/addresses.selectors';
import { Address } from '../../../core/models/address.model';
import { TokenStore } from '../../../core/services/token-store.service';
import { ProductService } from '../../../core/services/product.service';
import { Product } from '../../../core/models/product.model';
import { CurrencyCopPipe } from '../../pipes/currency-cop.pipe';
import { loadCategories } from '../../../store/categories/categories.actions';
import { selectAllCategories } from '../../../store/categories/categories.selectors';
import { Category } from '../../../core/models/seller-product.model';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, AsyncPipe, NgFor, NgIf, TitleCasePipe, UpperCasePipe, CurrencyCopPipe],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent {
  private store          = inject(Store);
  private router         = inject(Router);
  private tokenStore     = inject(TokenStore);
  private productService = inject(ProductService);
  private destroyRef     = inject(DestroyRef);

  accountOpen  = false;
  locationOpen = false;
  private addrLoaded = false;

  cartCount$        = this.store.select(selectCartCount);
  wishlistCount$    = this.store.select(selectWishlistCount);
  isLoggedIn$       = this.store.select(selectIsLoggedIn);
  authUser$         = this.store.select(selectAuthUser);
  userRole$         = this.store.select(selectUserRole);
  canShop$          = this.store.select(selectCanShop);
  hasSeller$        = this.store.select(selectHasSeller);
  hasAdmin$         = this.store.select(selectHasAdmin);
  addresses$        = this.store.select(selectAllAddresses);
  defaultAddress$   = this.store.select(selectDefaultAddress);
  addressesLoading$ = this.store.select(selectAddressesLoading);

  private categoriesSig = toSignal(this.store.select(selectAllCategories), { initialValue: [] as Category[] });
  visibleCats = computed(() => this.categoriesSig().slice(0, 5));
  moreCats    = computed(() => this.categoriesSig().slice(5));

  moreOpen = false;

  activeCategory = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      startWith(null),
      map(() => new URLSearchParams(this.router.url.split('?')[1] ?? '').get('cat'))
    ),
    { initialValue: null }
  );

  private searchSubject = new Subject<string>();
  searchQuery  = signal('');
  suggestions  = signal<Product[]>([]);
  searching    = signal(false);
  dropOpen     = signal(false);
  highlightIdx = signal(-1);

  constructor() {
    this.store.dispatch(loadCategories());

    this.searchSubject.pipe(
      debounceTime(280),
      distinctUntilChanged(),
      switchMap(q => {
        this.searching.set(true);
        return this.productService.getProducts({ search: q }).pipe(
          map(products => products.slice(0, 7)),
          catchError(() => of([] as Product[]))
        );
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(products => {
      this.searching.set(false);
      this.suggestions.set(products);
      this.dropOpen.set(products.length > 0);
      this.highlightIdx.set(-1);
    });
  }

  onInput(val: string) {
    this.searchQuery.set(val);
    if (val.trim().length >= 2) {
      this.searching.set(true);
      this.dropOpen.set(true);
      this.searchSubject.next(val.trim());
    } else {
      this.searching.set(false);
      this.suggestions.set([]);
      this.dropOpen.set(false);
    }
  }

  onKeyDown(e: KeyboardEvent, input: HTMLInputElement) {
    const items = this.suggestions();
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.highlightIdx.update(i => Math.min(i + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.highlightIdx.update(i => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      const hi = this.highlightIdx();
      if (hi >= 0 && hi < items.length) this.selectSuggestion(items[hi]);
      else this.runSearch(input.value);
    } else if (e.key === 'Escape') {
      this.closeDrop();
      input.blur();
    }
  }

  onBlur() { setTimeout(() => this.closeDrop(), 160); }

  selectSuggestion(p: Product) {
    this.searchQuery.set('');
    this.closeDrop();
    this.router.navigate(['/product', p.id]);
  }

  runSearch(val: string) { this.closeDrop(); this.onSearch(val); }
  private closeDrop() { this.dropOpen.set(false); this.highlightIdx.set(-1); }

  onSearch(query: string) {
    const q = query.trim();
    this.router.navigate(['/'], { queryParams: q ? { q } : {} });
  }

  goToCategory(cat: Category | null) {
    this.router.navigate(['/'], { queryParams: cat ? { cat: cat.name } : {} });
  }

  toggleMore(e: Event) { e.stopPropagation(); this.moreOpen = !this.moreOpen; }

  @HostListener('document:click')
  onDocumentClick() {
    this.accountOpen = false;
    this.locationOpen = false;
    this.moreOpen = false;
  }

  toggleAccount(e: Event) {
    e.stopPropagation();
    this.accountOpen = !this.accountOpen;
  }

  openCart() { this.store.dispatch(openCart()); }

  logOut() {
    this.tokenStore.clearTokens();
    this.store.dispatch(logout());
    this.router.navigate(['/']);
  }

  goToOrders() {
    this.isLoggedIn$.pipe(take(1)).subscribe(loggedIn => {
      if (loggedIn) this.router.navigate(['/orders']);
      else this.router.navigate(['/login'], { queryParams: { redirect: '/orders' } });
    });
  }

  navTo(path: string) {
    this.accountOpen = false;
    this.router.navigate([path]);
  }

  openLocation() {
    this.locationOpen = true;
    if (!this.addrLoaded) {
      this.isLoggedIn$.pipe(take(1)).subscribe(loggedIn => {
        if (loggedIn) {
          this.store.dispatch(loadAddresses());
          this.addrLoaded = true;
        }
      });
    }
  }

  closeLocation() { this.locationOpen = false; }

  setAsDefault(id: number) { this.store.dispatch(setDefaultAddress({ id })); }

  removeAddress(addr: Address) {
    if (addr.isDefault) return;
    this.store.dispatch(deleteAddress({ id: addr.id }));
  }
}
