import { Component, inject, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { Store } from '@ngrx/store';
import { take } from 'rxjs/operators';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { CartDrawerComponent } from '../cart/cart-drawer.component';
import { selectHasAdmin } from '../../store/auth/auth.selectors';
import { selectActiveSellerStoreId, selectActiveSellerStoreName } from '../../store/seller/seller.selectors';
import { setActiveSellerStore } from '../../store/seller/seller.actions';
import { StoreService } from '../../core/services/store.service';
import { MyStore } from '../../core/models/store.model';
import { SeoService } from '../../core/services/seo.service';

@Component({
  selector: 'app-seller',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NavbarComponent, CartDrawerComponent, AsyncPipe, NgIf, NgFor],
  templateUrl: './seller.component.html',
  styleUrl: './seller.component.scss',
})
export class SellerComponent implements OnInit {
  private ngrx         = inject(Store);
  private storeService = inject(StoreService);
  private seo          = inject(SeoService);

  hasAdmin$         = this.ngrx.select(selectHasAdmin);
  activeStoreId$    = this.ngrx.select(selectActiveSellerStoreId);
  activeStoreName$  = this.ngrx.select(selectActiveSellerStoreName);

  myStores: MyStore[] = [];
  storesError = '';

  ngOnInit(): void {
    this.seo.set({ title: 'Panel de Vendedor' });

    this.ngrx.select(selectActiveSellerStoreId).pipe(take(1)).subscribe(currentId => {
      // If we already have a storeId in the store (navigating back without page refresh),
      // child components can start their API calls immediately without waiting for getMyStores().
      // getMyStores() still runs in the background to keep the store list fresh.
      this.storeService.getMyStores().subscribe({
        next: stores => {
          this.myStores = stores;
          if (stores.length === 0) return;
          const match = stores.find(s => s.storeId === currentId);
          const target = match ?? stores[0];
          // Only dispatch if storeId changed to avoid unnecessary re-triggers
          if (target.storeId !== currentId) {
            this.ngrx.dispatch(setActiveSellerStore({ storeId: target.storeId, storeName: target.name }));
          }
        },
        error: err => {
          this.storesError = err.error?.message ?? 'No se pudieron cargar las tiendas.';
        },
      });
    });
  }

  selectStore(store: MyStore): void {
    this.ngrx.dispatch(setActiveSellerStore({ storeId: store.storeId, storeName: store.name }));
  }
}
