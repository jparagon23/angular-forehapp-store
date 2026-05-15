import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { WishlistService } from '../../core/services/wishlist.service';
import * as WishlistActions from './wishlist.actions';
import { loginSuccess } from '../auth/auth.actions';
import { logout } from '../auth/auth.actions';

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
          catchError(error => of(WishlistActions.loadWishlistFailure({ error: error.message })))
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
          catchError(error => of(WishlistActions.addToWishlistFailure({ error: error.message })))
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
          catchError(error => of(WishlistActions.removeFromWishlistFailure({ error: error.message })))
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
          catchError(error => of(WishlistActions.clearWishlistFailure({ error: error.message })))
        )
      )
    )
  );
}
