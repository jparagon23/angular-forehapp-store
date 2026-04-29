import { createReducer, on } from '@ngrx/store';
import { CartItem } from '../../core/models/cart-item.model';
import * as CartActions from './cart.actions';

export interface CartState {
  items: CartItem[];
  isOpen: boolean;
}

const initialState: CartState = {
  items: [],
  isOpen: false,
};

export const cartReducer = createReducer(
  initialState,
  on(CartActions.addToCart, (state, { item }) => {
    const existing = state.items.find(i => i.key === item.key);
    const items = existing
      ? state.items.map(i => i.key === item.key ? { ...i, qty: i.qty + item.qty } : i)
      : [...state.items, item];
    return { ...state, items };
  }),
  on(CartActions.removeFromCart, (state, { key }) => ({
    ...state, items: state.items.filter(i => i.key !== key)
  })),
  on(CartActions.incrementQty, (state, { key }) => ({
    ...state, items: state.items.map(i => i.key === key ? { ...i, qty: i.qty + 1 } : i)
  })),
  on(CartActions.decrementQty, (state, { key }) => ({
    ...state,
    items: state.items
      .map(i => i.key === key ? { ...i, qty: i.qty - 1 } : i)
      .filter(i => i.qty > 0)
  })),
  on(CartActions.clearCart, state => ({ ...state, items: [] })),
  on(CartActions.openCart, state => ({ ...state, isOpen: true })),
  on(CartActions.closeCart, state => ({ ...state, isOpen: false })),
);
