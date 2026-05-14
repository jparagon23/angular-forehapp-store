import { createFeatureSelector, createSelector } from '@ngrx/store';
import { CartState } from './cart.reducer';

const selectCartState = createFeatureSelector<CartState>('cart');

export const selectCartResponse      = createSelector(selectCartState, s => s.cart);
export const selectCartIsOpen        = createSelector(selectCartState, s => s.isOpen);
export const selectCartLoading       = createSelector(selectCartState, s => s.loading);
export const selectSellerGroups      = createSelector(selectCartResponse, c => c?.sellerGroups ?? []);
export const selectCartTotal         = createSelector(selectCartResponse, c => c?.total ?? 0);
export const selectCartItems         = createSelector(selectSellerGroups, groups =>
  groups.flatMap(g => g.items)
);
export const selectCartCount         = createSelector(selectCartItems, items =>
  items.reduce((sum, i) => sum + i.quantity, 0)
);
export const selectPriceChangedItems = createSelector(selectCartItems, items =>
  items.filter(i => i.priceChanged)
);
