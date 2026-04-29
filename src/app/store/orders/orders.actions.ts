import { createAction, props } from '@ngrx/store';
import { Order, OrderStatus } from '../../core/models/order.model';

export const loadOrders = createAction('[Orders] Load Orders');
export const loadOrdersSuccess = createAction('[Orders] Load Orders Success', props<{ orders: Order[] }>());
export const loadOrdersFailure = createAction('[Orders] Load Orders Failure', props<{ error: string }>());

export const updateOrderStatus = createAction('[Orders] Update Status', props<{ id: string; status: OrderStatus }>());
export const updateOrderStatusSuccess = createAction('[Orders] Update Status Success', props<{ id: string; status: OrderStatus }>());
