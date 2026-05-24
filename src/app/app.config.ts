import { APP_INITIALIZER, ApplicationConfig, ErrorHandler } from '@angular/core';
import { ChunkErrorHandler } from './core/handlers/chunk-error.handler';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideStore } from '@ngrx/store';
import { Store } from '@ngrx/store';
import { authInitFactory } from './core/init/auth-init.factory';
import { AuthApiService } from './core/services/auth-api.service';
import { TokenStore } from './core/services/token-store.service';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { productsReducer } from './store/products/products.reducer';
import { cartReducer } from './store/cart/cart.reducer';
import { authReducer } from './store/auth/auth.reducer';
import { wishlistReducer } from './store/wishlist/wishlist.reducer';
import { ordersReducer } from './store/orders/orders.reducer';
import { customersReducer } from './store/customers/customers.reducer';
import { discountsReducer } from './store/discounts/discounts.reducer';
import { sellerReducer } from './store/seller/seller.reducer';
import { addressesReducer } from './store/addresses/addresses.reducer';
import { storesReducer } from './store/stores/stores.reducer';
import { ProductsEffects } from './store/products/products.effects';
import { OrdersEffects } from './store/orders/orders.effects';
import { CustomersEffects } from './store/customers/customers.effects';
import { DiscountsEffects } from './store/discounts/discounts.effects';
import { SellerEffects } from './store/seller/seller.effects';
import { AddressesEffects } from './store/addresses/addresses.effects';
import { CartEffects } from './store/cart/cart.effects';
import { WishlistEffects } from './store/wishlist/wishlist.effects';
import { StoresEffects } from './store/stores/stores.effects';
import { authInterceptor } from './core/interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'top' })),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideStore({
      products: productsReducer,
      cart: cartReducer,
      auth: authReducer,
      wishlist: wishlistReducer,
      orders: ordersReducer,
      customers: customersReducer,
      discounts: discountsReducer,
      seller: sellerReducer,
      addresses: addressesReducer,
      stores: storesReducer,
    }),
    provideEffects([ProductsEffects, OrdersEffects, CustomersEffects, DiscountsEffects, SellerEffects, AddressesEffects, CartEffects, WishlistEffects, StoresEffects]),
    provideStoreDevtools({ maxAge: 25, logOnly: false }),
    { provide: ErrorHandler, useClass: ChunkErrorHandler },
    {
      provide: APP_INITIALIZER,
      useFactory: authInitFactory,
      deps: [TokenStore, AuthApiService, Store],
      multi: true,
    },
  ]
};
