import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { DiscountService } from '../../core/services/discount.service';
import * as DiscountsActions from './discounts.actions';

@Injectable()
export class DiscountsEffects {
  private actions$ = inject(Actions);
  private discountService = inject(DiscountService);

  loadDiscounts$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DiscountsActions.loadDiscounts),
      switchMap(() =>
        this.discountService.getDiscounts().pipe(
          map(discounts => DiscountsActions.loadDiscountsSuccess({ discounts })),
          catchError(error => of(DiscountsActions.loadDiscountsFailure({ error: error.message })))
        )
      )
    )
  );

  createDiscount$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DiscountsActions.createDiscount),
      switchMap(({ discount }) =>
        this.discountService.createDiscount(discount).pipe(
          map(d => DiscountsActions.createDiscountSuccess({ discount: d }))
        )
      )
    )
  );

  toggleDiscount$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DiscountsActions.toggleDiscount),
      switchMap(({ code }) =>
        this.discountService.toggleDiscount(code).pipe(
          map(code => DiscountsActions.toggleDiscountSuccess({ code }))
        )
      )
    )
  );

  deleteDiscount$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DiscountsActions.deleteDiscount),
      switchMap(({ code }) =>
        this.discountService.deleteDiscount(code).pipe(
          map(code => DiscountsActions.deleteDiscountSuccess({ code }))
        )
      )
    )
  );
}
