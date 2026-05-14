import { createAction, props } from '@ngrx/store';
import { CartResponse } from '../../core/models/cart.model';

export const openCart  = createAction('[Cart] Open');
export const closeCart = createAction('[Cart] Close');

export const loadCart        = createAction('[Cart] Load');
export const loadCartSuccess = createAction('[Cart] Load Success', props<{ cart: CartResponse }>());
export const loadCartFailure = createAction('[Cart] Load Failure', props<{ error: string }>());

export const addCartItem        = createAction('[Cart] Add Item', props<{ variantId: number; quantity: number }>());
export const addCartItemSuccess = createAction('[Cart] Add Item Success', props<{ cart: CartResponse }>());
export const addCartItemFailure = createAction('[Cart] Add Item Failure', props<{ error: string }>());

export const updateCartItem        = createAction('[Cart] Update Item', props<{ itemId: number; quantity: number }>());
export const updateCartItemSuccess = createAction('[Cart] Update Item Success', props<{ cart: CartResponse }>());
export const updateCartItemFailure = createAction('[Cart] Update Item Failure', props<{ error: string }>());

export const removeCartItem        = createAction('[Cart] Remove Item', props<{ itemId: number }>());
export const removeCartItemSuccess = createAction('[Cart] Remove Item Success', props<{ cart: CartResponse }>());
export const removeCartItemFailure = createAction('[Cart] Remove Item Failure', props<{ error: string }>());

export const clearCartItems        = createAction('[Cart] Clear Items');
export const clearCartItemsSuccess = createAction('[Cart] Clear Items Success', props<{ cart: CartResponse }>());
export const clearCartItemsFailure = createAction('[Cart] Clear Items Failure', props<{ error: string }>());
