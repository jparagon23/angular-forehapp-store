import { createAction, props } from '@ngrx/store';
import { WishlistResponse } from '../../core/models/wishlist-item.model';

export const loadWishlist         = createAction('[Wishlist] Load');
export const loadWishlistSuccess  = createAction('[Wishlist] Load Success',  props<{ response: WishlistResponse }>());
export const loadWishlistFailure  = createAction('[Wishlist] Load Failure',  props<{ error: string }>());

export const addToWishlist        = createAction('[Wishlist] Add',           props<{ productId: number }>());
export const addToWishlistSuccess = createAction('[Wishlist] Add Success',   props<{ response: WishlistResponse }>());
export const addToWishlistFailure = createAction('[Wishlist] Add Failure',   props<{ error: string }>());

export const removeFromWishlist        = createAction('[Wishlist] Remove',           props<{ itemId: number }>());
export const removeFromWishlistSuccess = createAction('[Wishlist] Remove Success',   props<{ response: WishlistResponse }>());
export const removeFromWishlistFailure = createAction('[Wishlist] Remove Failure',   props<{ error: string }>());

export const clearWishlist        = createAction('[Wishlist] Clear');
export const clearWishlistSuccess = createAction('[Wishlist] Clear Success');
export const clearWishlistFailure = createAction('[Wishlist] Clear Failure', props<{ error: string }>());

export const resetWishlistState   = createAction('[Wishlist] Reset State');
