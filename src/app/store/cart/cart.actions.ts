import { createAction, props } from '@ngrx/store';
import { CartItem } from '../../core/models/cart-item.model';

export const addToCart = createAction('[Cart] Add Item', props<{ item: CartItem }>());
export const removeFromCart = createAction('[Cart] Remove Item', props<{ key: string }>());
export const incrementQty = createAction('[Cart] Increment Qty', props<{ key: string }>());
export const decrementQty = createAction('[Cart] Decrement Qty', props<{ key: string }>());
export const clearCart = createAction('[Cart] Clear');
export const openCart = createAction('[Cart] Open');
export const closeCart = createAction('[Cart] Close');
