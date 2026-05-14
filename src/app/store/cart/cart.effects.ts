import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, of, switchMap } from 'rxjs';
import { CartService } from '../../core/services/cart.service';
import { loginSuccess } from '../auth/auth.actions';
import * as CartActions from './cart.actions';

@Injectable()
export class CartEffects {
  private actions$ = inject(Actions);
  private cartService = inject(CartService);

  loadCartOnLogin$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loginSuccess),
      map(() => CartActions.loadCart())
    )
  );

  loadCart$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CartActions.loadCart),
      switchMap(() =>
        this.cartService.getCart().pipe(
          map(cart => CartActions.loadCartSuccess({ cart })),
          catchError(err => of(CartActions.loadCartFailure({ error: err.message ?? 'Error al cargar el carrito' })))
        )
      )
    )
  );

  addCartItem$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CartActions.addCartItem),
      switchMap(({ variantId, quantity }) =>
        this.cartService.addItem(variantId, quantity).pipe(
          map(cart => CartActions.addCartItemSuccess({ cart })),
          catchError(err => of(CartActions.addCartItemFailure({ error: err.message ?? 'Error al agregar al carrito' })))
        )
      )
    )
  );

  updateCartItem$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CartActions.updateCartItem),
      switchMap(({ itemId, quantity }) =>
        this.cartService.updateItem(itemId, quantity).pipe(
          map(cart => CartActions.updateCartItemSuccess({ cart })),
          catchError(err => of(CartActions.updateCartItemFailure({ error: err.message ?? 'Error al actualizar cantidad' })))
        )
      )
    )
  );

  removeCartItem$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CartActions.removeCartItem),
      switchMap(({ itemId }) =>
        this.cartService.removeItem(itemId).pipe(
          switchMap(() => this.cartService.getCart()),
          map(cart => CartActions.removeCartItemSuccess({ cart })),
          catchError(err => of(CartActions.removeCartItemFailure({ error: err.message ?? 'Error al eliminar ítem' })))
        )
      )
    )
  );

  clearCartItems$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CartActions.clearCartItems),
      switchMap(() =>
        this.cartService.clearCart().pipe(
          switchMap(() => this.cartService.getCart()),
          map(cart => CartActions.clearCartItemsSuccess({ cart })),
          catchError(err => of(CartActions.clearCartItemsFailure({ error: err.message ?? 'Error al vaciar el carrito' })))
        )
      )
    )
  );
}
