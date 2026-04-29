import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { routes } from './app.routes';
import { productsReducer } from './store/products/products.reducer';
import { cartReducer } from './store/cart/cart.reducer';
import { authReducer } from './store/auth/auth.reducer';
import { ordersReducer } from './store/orders/orders.reducer';
import { customersReducer } from './store/customers/customers.reducer';
import { discountsReducer } from './store/discounts/discounts.reducer';
import { ProductsEffects } from './store/products/products.effects';
import { OrdersEffects } from './store/orders/orders.effects';
import { CustomersEffects } from './store/customers/customers.effects';
import { DiscountsEffects } from './store/discounts/discounts.effects';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideStore({
      products: productsReducer,
      cart: cartReducer,
      auth: authReducer,
      orders: ordersReducer,
      customers: customersReducer,
      discounts: discountsReducer,
    }),
    provideEffects([ProductsEffects, OrdersEffects, CustomersEffects, DiscountsEffects]),
    provideStoreDevtools({ maxAge: 25, logOnly: false }),
  ]
};
