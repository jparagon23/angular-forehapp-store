import { APP_INITIALIZER, ApplicationConfig, ErrorHandler, LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEsCO from '@angular/common/locales/es-CO';

registerLocaleData(localeEsCO);
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
import { categoriesReducer } from './store/categories/categories.reducer';
import { ProductsEffects } from './store/products/products.effects';
import { OrdersEffects } from './store/orders/orders.effects';
import { CustomersEffects } from './store/customers/customers.effects';
import { DiscountsEffects } from './store/discounts/discounts.effects';
import { SellerEffects } from './store/seller/seller.effects';
import { AddressesEffects } from './store/addresses/addresses.effects';
import { CartEffects } from './store/cart/cart.effects';
import { WishlistEffects } from './store/wishlist/wishlist.effects';
import { StoresEffects } from './store/stores/stores.effects';
import { CategoriesEffects } from './store/categories/categories.effects';
import { userStatsReducer } from './store/user-stats/user-stats.reducer';
import { UserStatsEffects } from './store/user-stats/user-stats.effects';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { provideClientHydration } from '@angular/platform-browser';

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
      categories: categoriesReducer,
      userStats: userStatsReducer,
    }),
    provideEffects([ProductsEffects, OrdersEffects, CustomersEffects, DiscountsEffects, SellerEffects, AddressesEffects, CartEffects, WishlistEffects, StoresEffects, CategoriesEffects, UserStatsEffects]),
    provideStoreDevtools({ maxAge: 25, logOnly: false }),
    { provide: ErrorHandler, useClass: ChunkErrorHandler },
    { provide: LOCALE_ID, useValue: 'es-CO' },
    {
      provide: APP_INITIALIZER,
      useFactory: authInitFactory,
      deps: [TokenStore, AuthApiService, Store],
      multi: true,
    }, provideClientHydration(),
  ]
};
