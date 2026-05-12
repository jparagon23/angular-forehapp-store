import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { take } from 'rxjs';
import { selectWishlistItems, selectWishlistCount } from '../../store/wishlist/wishlist.selectors';
import { removeFromWishlist } from '../../store/wishlist/wishlist.actions';
import { selectIsLoggedIn } from '../../store/auth/auth.selectors';
import { addToCart, openCart } from '../../store/cart/cart.actions';
import { WishlistItem } from '../../core/models/wishlist-item.model';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { CartDrawerComponent } from '../cart/cart-drawer.component';
import { CurrencyCopPipe } from '../../shared/pipes/currency-cop.pipe';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [AsyncPipe, NgFor, NgIf, RouterLink, NavbarComponent, CartDrawerComponent, CurrencyCopPipe],
  templateUrl: './wishlist.component.html',
  styleUrl: './wishlist.component.scss',
})
export class WishlistComponent implements OnInit {
  private store  = inject(Store);
  private router = inject(Router);

  items$      = this.store.select(selectWishlistItems);
  count$      = this.store.select(selectWishlistCount);
  isLoggedIn$ = this.store.select(selectIsLoggedIn);

  ngOnInit() {
    this.isLoggedIn$.pipe(take(1)).subscribe(loggedIn => {
      if (!loggedIn) this.router.navigate(['/login'], { queryParams: { redirect: '/wishlist' } });
    });
  }

  remove(id: number) {
    this.store.dispatch(removeFromWishlist({ id }));
  }

  addToCart(item: WishlistItem) {
    this.store.dispatch(addToCart({
      item: { key: String(item.id), id: item.id, name: item.name,
              emoji: item.emoji, price: item.price, qty: 1, size: null, color: null },
    }));
    this.store.dispatch(openCart());
  }
}
