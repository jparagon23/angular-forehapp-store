import { createFeatureSelector, createSelector } from '@ngrx/store';
import { OrdersState } from './orders.reducer';

const selectOrdersState = createFeatureSelector<OrdersState>('orders');

export const selectAllOrders = createSelector(selectOrdersState, s => s.orders);
export const selectOrdersLoading = createSelector(selectOrdersState, s => s.loading);
export const selectRecentOrders = createSelector(selectAllOrders, orders => orders.slice(0, 5));
