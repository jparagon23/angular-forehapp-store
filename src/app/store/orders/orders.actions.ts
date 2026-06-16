import { createAction, props } from '@ngrx/store';
import { Order, OrderResponse, OrderStatus, PaymentMethod } from '../../core/models/order.model';

export const loadOrders = createAction('[Orders] Load Orders');
export const loadOrdersSuccess = createAction('[Orders] Load Orders Success', props<{ orders: Order[] }>());
export const loadOrdersFailure = createAction('[Orders] Load Orders Failure', props<{ error: string }>());

export const updateOrderStatus = createAction('[Orders] Update Status', props<{ id: string; status: OrderStatus }>());
export const updateOrderStatusSuccess = createAction('[Orders] Update Status Success', props<{ id: string; status: OrderStatus }>());

export const createOrder = createAction('[Orders] Create Order', props<{ addressId: number; paymentMethod: PaymentMethod; couponCode?: string; couponStoreId?: number | null; referralCode?: string }>());
export const createOrderSuccess = createAction('[Orders] Create Order Success', props<{ order: OrderResponse }>());
export const createOrderFailure = createAction('[Orders] Create Order Failure', props<{ error: string }>());
export const resetCreateOrder = createAction('[Orders] Reset Create Order');
