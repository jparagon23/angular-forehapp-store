import { createReducer, on } from '@ngrx/store';
import { Order, OrderResponse } from '../../core/models/order.model';
import * as OrdersActions from './orders.actions';

export interface OrdersState {
  orders: Order[];
  loading: boolean;
  error: string | null;
  creatingOrder: boolean;
  createdOrder: OrderResponse | null;
  createOrderError: string | null;
}

const initialState: OrdersState = {
  orders: [],
  loading: false,
  error: null,
  creatingOrder: false,
  createdOrder: null,
  createOrderError: null,
};

export const ordersReducer = createReducer(
  initialState,
  on(OrdersActions.loadOrders, state => ({ ...state, loading: true, error: null })),
  on(OrdersActions.loadOrdersSuccess, (state, { orders }) => ({ ...state, orders, loading: false })),
  on(OrdersActions.loadOrdersFailure, (state, { error }) => ({ ...state, loading: false, error })),
  on(OrdersActions.updateOrderStatusSuccess, (state, { id, status }) => ({
    ...state,
    orders: state.orders.map(o => o.id === id ? { ...o, status } : o),
  })),
  on(OrdersActions.createOrder, state => ({
    ...state, creatingOrder: true, createdOrder: null, createOrderError: null,
  })),
  on(OrdersActions.createOrderSuccess, (state, { order }) => ({
    ...state, creatingOrder: false, createdOrder: order,
  })),
  on(OrdersActions.createOrderFailure, (state, { error }) => ({
    ...state, creatingOrder: false, createOrderError: error,
  })),
  on(OrdersActions.resetCreateOrder, state => ({
    ...state, creatingOrder: false, createdOrder: null, createOrderError: null,
  })),
);
