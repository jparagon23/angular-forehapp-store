import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { OrderService } from '../../core/services/order.service';
import { TrafficTrackerService } from '../../core/services/traffic-tracker.service';
import * as OrdersActions from './orders.actions';

@Injectable()
export class OrdersEffects {
  private actions$ = inject(Actions);
  private orderService = inject(OrderService);
  private tracker = inject(TrafficTrackerService);

  loadOrders$ = createEffect(() =>
    this.actions$.pipe(
      ofType(OrdersActions.loadOrders),
      switchMap(() =>
        this.orderService.getOrders().pipe(
          map(orders => OrdersActions.loadOrdersSuccess({ orders })),
          catchError(error => of(OrdersActions.loadOrdersFailure({ error: error.message })))
        )
      )
    )
  );

  updateOrderStatus$ = createEffect(() =>
    this.actions$.pipe(
      ofType(OrdersActions.updateOrderStatus),
      switchMap(({ id, status }) =>
        this.orderService.updateOrderStatus(id, status).pipe(
          map(res => OrdersActions.updateOrderStatusSuccess(res))
        )
      )
    )
  );

  createOrder$ = createEffect(() =>
    this.actions$.pipe(
      ofType(OrdersActions.createOrder),
      switchMap(({ addressId, paymentMethod, couponCode, couponStoreId, referralCode }) =>
        this.orderService.createOrder(addressId, paymentMethod, couponCode, couponStoreId, referralCode).pipe(
          map(order => OrdersActions.createOrderSuccess({ order })),
          catchError(error => {
            const msg = error?.error?.message ?? error?.message ?? 'Error al crear la orden';
            return of(OrdersActions.createOrderFailure({ error: msg }));
          })
        )
      )
    )
  );

  /** Medición: la sesión terminó en compra. */
  trackPurchase$ = createEffect(() =>
    this.actions$.pipe(
      ofType(OrdersActions.createOrderSuccess),
      tap(({ order }) => this.tracker.purchase(order.orderId)),
    ),
    { dispatch: false }
  );
}
