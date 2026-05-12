import { createReducer, on } from '@ngrx/store';
import { WishlistItem } from '../../core/models/wishlist-item.model';
import { addToWishlist, removeFromWishlist } from './wishlist.actions';

export interface WishlistState { items: WishlistItem[]; }

const initialState: WishlistState = { items: [] };

export const wishlistReducer = createReducer(
  initialState,
  on(addToWishlist, (state, { item }) =>
    state.items.some(i => i.id === item.id) ? state : { items: [...state.items, item] }
  ),
  on(removeFromWishlist, (state, { id }) => ({
    items: state.items.filter(i => i.id !== id)
  })),
);
