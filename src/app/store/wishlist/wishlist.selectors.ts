import { createFeatureSelector, createSelector } from '@ngrx/store';
import { WishlistState } from './wishlist.reducer';

const selectWishlistState = createFeatureSelector<WishlistState>('wishlist');
export const selectWishlistItems = createSelector(selectWishlistState, s => s.items);
export const selectWishlistCount = createSelector(selectWishlistItems, items => items.length);
export const selectWishlistIds   = createSelector(selectWishlistItems, items => items.map(i => i.id));
