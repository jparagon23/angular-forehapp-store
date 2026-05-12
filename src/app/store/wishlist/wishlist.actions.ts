import { createAction, props } from '@ngrx/store';
import { WishlistItem } from '../../core/models/wishlist-item.model';

export const addToWishlist      = createAction('[Wishlist] Add',    props<{ item: WishlistItem }>());
export const removeFromWishlist = createAction('[Wishlist] Remove', props<{ id: number }>());
