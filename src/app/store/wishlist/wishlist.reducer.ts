import { createReducer, on } from '@ngrx/store';
import { WishlistItemDto } from '../../core/models/wishlist-item.model';
import * as A from './wishlist.actions';

export interface WishlistState {
  wishlistId:    number | null;
  items:         WishlistItemDto[];
  loading:       boolean;
  actionLoading: boolean;
}

const initialState: WishlistState = {
  wishlistId:    null,
  items:         [],
  loading:       false,
  actionLoading: false,
};

export const wishlistReducer = createReducer(
  initialState,

  on(A.loadWishlist, state => ({ ...state, loading: true })),
  on(A.loadWishlistSuccess, (state, { response }) => ({
    ...state, loading: false,
    wishlistId: response.wishlistId,
    items: response.items,
  })),
  on(A.loadWishlistFailure, state => ({ ...state, loading: false })),

  on(A.addToWishlist,         state              => ({ ...state, actionLoading: true })),
  on(A.addToWishlistSuccess,  (state, { response }) => ({
    ...state, actionLoading: false,
    wishlistId: response.wishlistId,
    items: response.items,
  })),
  on(A.addToWishlistFailure,  state => ({ ...state, actionLoading: false })),

  on(A.removeFromWishlist,        state              => ({ ...state, actionLoading: true })),
  on(A.removeFromWishlistSuccess, (state, { response }) => ({
    ...state, actionLoading: false,
    items: response.items,
  })),
  on(A.removeFromWishlistFailure, state => ({ ...state, actionLoading: false })),

  on(A.clearWishlist,        state => ({ ...state, actionLoading: true })),
  on(A.clearWishlistSuccess, state => ({ ...state, actionLoading: false, items: [] })),
  on(A.clearWishlistFailure, state => ({ ...state, actionLoading: false })),

  on(A.resetWishlistState, () => initialState),
);
