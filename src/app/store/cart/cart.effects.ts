import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, filter, map, of, switchMap, withLatestFrom } from 'rxjs';
import { CartService } from '../../core/services/cart.service';
import { GuestCartService } from '../../core/services/guest-cart.service';
import { loginSuccess } from '../auth/auth.actions';
import { selectAuthUser } from '../auth/auth.selectors';
import * as CartActions from './cart.actions';

@Injectable()
export class CartEffects {
  private actions$ = inject(Actions);
  private store    = inject(Store);
  private cartSvc  = inject(CartService);
  private guestSvc = inject(GuestCartService);

  /* ── Carga inicial del carrito desde localStorage al arrancar ── */
  initCart$ = createEffect(() =>
    this.actions$.pipe(
      ofType('@ngrx/store/init' as any),
      map(() => CartActions.loadCart())
    )
  );

  /* ── Cargar carrito ──────────────────────────────────────────── */
  loadCart$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CartActions.loadCart),
      withLatestFrom(this.store.select(selectAuthUser)),
      switchMap(([, user]) => {
        if (user?.role === 'BUYER') {
          return this.cartSvc.getCart().pipe(
            map(cart => CartActions.loadCartSuccess({ cart })),
            catchError(err => of(CartActions.loadCartFailure({ error: err.error?.message ?? 'Error al cargar el carrito' })))
          );
        }
        return of(CartActions.loadCartSuccess({ cart: this.guestSvc.buildCartResponse() }));
      })
    )
  );

  /* ── Login: fusionar carrito guest → backend (una sola llamada) ─ */
  loadCartOnLogin$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loginSuccess),
      filter(({ user }) => user.role === 'BUYER'),
      switchMap(() => {
        const guestItems = this.guestSvc.getItems();
        this.guestSvc.clear();

        if (guestItems.length === 0) {
          return of(CartActions.loadCart());
        }

        return this.cartSvc.addItemsBatch(
          guestItems.map(i => ({ variantId: i.variantId, quantity: i.quantity }))
        ).pipe(
          map(cart  => CartActions.loadCartSuccess({ cart })),
          catchError(() => of(CartActions.loadCart()))
        );
      })
    )
  );

  /* ── Agregar ítem ────────────────────────────────────────────── */
  addCartItem$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CartActions.addCartItem),
      withLatestFrom(this.store.select(selectAuthUser)),
      switchMap(([action, user]) => {
        if (user?.role === 'BUYER') {
          return this.cartSvc.addItem(action.variantId, action.quantity).pipe(
            map(cart => CartActions.addCartItemSuccess({ cart })),
            catchError(err => {
              const error = err.error?.message ?? 'Error al agregar al carrito';
              if (err.status === 409) {
                return of(CartActions.addCartItemFailure({ error }), CartActions.loadCart());
              }
              return of(CartActions.addCartItemFailure({ error }));
            })
          );
        }
        this.guestSvc.addItem({
          variantId:    action.variantId,
          quantity:     action.quantity,
          productTitle: action.productTitle ?? 'Producto',
          sku:          action.sku ?? '',
          unitPrice:    action.unitPrice ?? 0,
        });
        return of(CartActions.addCartItemSuccess({ cart: this.guestSvc.buildCartResponse() }));
      })
    )
  );

  /* ── Actualizar cantidad ─────────────────────────────────────── */
  updateCartItem$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CartActions.updateCartItem),
      withLatestFrom(this.store.select(selectAuthUser)),
      switchMap(([action, user]) => {
        if (user?.role === 'BUYER') {
          return this.cartSvc.updateItem(action.itemId, action.quantity).pipe(
            map(cart => CartActions.updateCartItemSuccess({ cart })),
            catchError(err => of(CartActions.updateCartItemFailure({ error: err.error?.message ?? 'Error al actualizar cantidad' })))
          );
        }
        // Para ítems guest el itemId es negativo (-variantId)
        this.guestSvc.updateItem(Math.abs(action.itemId), action.quantity);
        return of(CartActions.updateCartItemSuccess({ cart: this.guestSvc.buildCartResponse() }));
      })
    )
  );

  /* ── Eliminar ítem ───────────────────────────────────────────── */
  removeCartItem$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CartActions.removeCartItem),
      withLatestFrom(this.store.select(selectAuthUser)),
      switchMap(([action, user]) => {
        if (user?.role === 'BUYER') {
          return this.cartSvc.removeItem(action.itemId).pipe(
            switchMap(() => this.cartSvc.getCart()),
            map(cart => CartActions.removeCartItemSuccess({ cart })),
            catchError(err => of(CartActions.removeCartItemFailure({ error: err.error?.message ?? 'Error al eliminar ítem' })))
          );
        }
        this.guestSvc.removeItem(Math.abs(action.itemId));
        return of(CartActions.removeCartItemSuccess({ cart: this.guestSvc.buildCartResponse() }));
      })
    )
  );

  /* ── Vaciar carrito ──────────────────────────────────────────── */
  clearCartItems$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CartActions.clearCartItems),
      withLatestFrom(this.store.select(selectAuthUser)),
      switchMap(([, user]) => {
        if (user?.role === 'BUYER') {
          return this.cartSvc.clearCart().pipe(
            switchMap(() => this.cartSvc.getCart()),
            map(cart => CartActions.clearCartItemsSuccess({ cart })),
            catchError(err => of(CartActions.clearCartItemsFailure({ error: err.error?.message ?? 'Error al vaciar el carrito' })))
          );
        }
        this.guestSvc.clear();
        return of(CartActions.clearCartItemsSuccess({ cart: this.guestSvc.buildCartResponse() }));
      })
    )
  );
}
