import { createFeatureSelector, createSelector } from '@ngrx/store';
import { WishlistState } from './wishlist.reducer';

const selectWishlistState = createFeatureSelector<WishlistState>('wishlist');

export const selectWishlistItems         = createSelector(selectWishlistState, s => s.items);
export const selectWishlistCount         = createSelector(selectWishlistItems, items => items.length);
export const selectWishlistLoading       = createSelector(selectWishlistState, s => s.loading);
export const selectWishlistActionLoading = createSelector(selectWishlistState, s => s.actionLoading);

export const selectWishlistProductIds = createSelector(
  selectWishlistItems, items => items.map(i => i.productId)
);

export const selectWishlistProductIdToItemId = createSelector(
  selectWishlistItems,
  items => new Map(items.map(i => [i.productId, i.itemId] as [number, number]))
);
