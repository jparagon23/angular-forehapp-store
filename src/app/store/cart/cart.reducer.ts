import { createReducer, on } from '@ngrx/store';
import { CartResponse } from '../../core/models/cart.model';
import * as CartActions from './cart.actions';

export interface CartState {
  cart: CartResponse | null;
  isOpen: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: CartState = {
  cart: null,
  isOpen: false,
  loading: false,
  error: null,
};

export const cartReducer = createReducer(
  initialState,
  on(CartActions.openCart,  state => ({ ...state, isOpen: true })),
  on(CartActions.closeCart, state => ({ ...state, isOpen: false })),

  on(CartActions.loadCart, state => ({ ...state, loading: true, error: null })),
  on(CartActions.loadCartSuccess, (state, { cart }) => ({ ...state, cart, loading: false })),
  on(CartActions.loadCartFailure, (state, { error }) => ({ ...state, error, loading: false })),

  on(CartActions.addCartItem, state => ({ ...state, loading: true, error: null })),
  on(CartActions.addCartItemSuccess, (state, { cart }) => ({ ...state, cart, loading: false })),
  on(CartActions.addCartItemFailure, (state, { error }) => ({ ...state, error, loading: false })),

  on(CartActions.updateCartItem, state => ({ ...state, loading: true, error: null })),
  on(CartActions.updateCartItemSuccess, (state, { cart }) => ({ ...state, cart, loading: false })),
  on(CartActions.updateCartItemFailure, (state, { error }) => ({ ...state, error, loading: false })),

  on(CartActions.removeCartItem, state => ({ ...state, loading: true, error: null })),
  on(CartActions.removeCartItemSuccess, (state, { cart }) => ({ ...state, cart, loading: false })),
  on(CartActions.removeCartItemFailure, (state, { error }) => ({ ...state, error, loading: false })),

  on(CartActions.clearCartItems, state => ({ ...state, loading: true, error: null })),
  on(CartActions.clearCartItemsSuccess, (state, { cart }) => ({ ...state, cart, loading: false })),
  on(CartActions.clearCartItemsFailure, (state, { error }) => ({ ...state, error, loading: false })),
);
