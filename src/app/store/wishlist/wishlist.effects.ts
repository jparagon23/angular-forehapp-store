import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, switchMap } from 'rxjs/operators';
import { concat, of } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { WishlistService } from '../../core/services/wishlist.service';
import * as WishlistActions from './wishlist.actions';
import { loginSuccess } from '../auth/auth.actions';
import { logout } from '../auth/auth.actions';

function extractError(err: unknown): string {
  if (err instanceof HttpErrorResponse) return err.error?.message ?? err.message;
  if (err instanceof Error) return err.message;
  return 'Error desconocido';
}

@Injectable()
export class WishlistEffects {
  private actions$       = inject(Actions);
  private wishlistService = inject(WishlistService);

  loadOnLogin$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loginSuccess),
      map(() => WishlistActions.loadWishlist())
    )
  );

  clearOnLogout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(logout),
      map(() => WishlistActions.resetWishlistState())
    )
  );

  loadWishlist$ = createEffect(() =>
    this.actions$.pipe(
      ofType(WishlistActions.loadWishlist),
      switchMap(() =>
        this.wishlistService.getWishlist().pipe(
          map(response => WishlistActions.loadWishlistSuccess({ response })),
          catchError(error => of(WishlistActions.loadWishlistFailure({ error: extractError(error) })))
        )
      )
    )
  );

  addToWishlist$ = createEffect(() =>
    this.actions$.pipe(
      ofType(WishlistActions.addToWishlist),
      switchMap(({ productId }) =>
        this.wishlistService.addItem(productId).pipe(
          map(response => WishlistActions.addToWishlistSuccess({ response })),
          catchError((error: unknown) => {
            if (error instanceof HttpErrorResponse && error.status === 409) {
              // Producto ya en wishlist o race condition: resetear loading y resincronizar
              return concat(
                of(WishlistActions.addToWishlistFailure({ error: '' })),
                of(WishlistActions.loadWishlist())
              );
            }
            return of(WishlistActions.addToWishlistFailure({ error: extractError(error) }));
          })
        )
      )
    )
  );

  removeFromWishlist$ = createEffect(() =>
    this.actions$.pipe(
      ofType(WishlistActions.removeFromWishlist),
      switchMap(({ itemId }) =>
        this.wishlistService.removeItem(itemId).pipe(
          map(response => WishlistActions.removeFromWishlistSuccess({ response })),
          catchError(error => of(WishlistActions.removeFromWishlistFailure({ error: extractError(error) })))
        )
      )
    )
  );

  clearWishlist$ = createEffect(() =>
    this.actions$.pipe(
      ofType(WishlistActions.clearWishlist),
      switchMap(() =>
        this.wishlistService.clearWishlist().pipe(
          map(() => WishlistActions.clearWishlistSuccess()),
          catchError(error => of(WishlistActions.clearWishlistFailure({ error: extractError(error) })))
        )
      )
    )
  );
}
