import { createFeatureSelector, createSelector } from '@ngrx/store';
import { CartState } from './cart.reducer';

const selectCartState = createFeatureSelector<CartState>('cart');

export const selectCartItems = createSelector(selectCartState, s => s.items);
export const selectCartIsOpen = createSelector(selectCartState, s => s.isOpen);
export const selectCartCount = createSelector(selectCartItems, items =>
  items.reduce((sum, i) => sum + i.qty, 0)
);
export const selectCartTotal = createSelector(selectCartItems, items =>
  items.reduce((sum, i) => sum + i.price * i.qty, 0)
);
