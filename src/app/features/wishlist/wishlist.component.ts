import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { AsyncPipe, DatePipe, NgFor, NgIf } from '@angular/common';
import { take } from 'rxjs';
import { selectWishlistItems, selectWishlistCount, selectWishlistLoading, selectWishlistActionLoading } from '../../store/wishlist/wishlist.selectors';
import { removeFromWishlist, clearWishlist } from '../../store/wishlist/wishlist.actions';
import { selectIsLoggedIn } from '../../store/auth/auth.selectors';
import { WishlistItemDto } from '../../core/models/wishlist-item.model';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { CartDrawerComponent } from '../cart/cart-drawer.component';
import { CurrencyCopPipe } from '../../shared/pipes/currency-cop.pipe';
import { SeoService } from '../../core/services/seo.service';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [AsyncPipe, DatePipe, NgFor, NgIf, RouterLink, NavbarComponent, CartDrawerComponent, CurrencyCopPipe],
  templateUrl: './wishlist.component.html',
  styleUrl: './wishlist.component.scss',
})
export class WishlistComponent implements OnInit {
  private store  = inject(Store);
  private router = inject(Router);
  private seo    = inject(SeoService);

  items$         = this.store.select(selectWishlistItems);
  count$         = this.store.select(selectWishlistCount);
  loading$       = this.store.select(selectWishlistLoading);
  actionLoading$ = this.store.select(selectWishlistActionLoading);
  isLoggedIn$    = this.store.select(selectIsLoggedIn);

  ngOnInit() {
    this.seo.set({ title: 'Lista de Deseos' });
    this.isLoggedIn$.pipe(take(1)).subscribe(loggedIn => {
      if (!loggedIn) this.router.navigate(['/login'], { queryParams: { redirect: '/wishlist' } });
    });
  }

  remove(item: WishlistItemDto) {
    this.store.dispatch(removeFromWishlist({ itemId: item.itemId }));
  }

  clearAll() {
    this.store.dispatch(clearWishlist());
  }

  goToProduct(productId: number) {
    this.router.navigate(['/product', productId]);
  }
}
