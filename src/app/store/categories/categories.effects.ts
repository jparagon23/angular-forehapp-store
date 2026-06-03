import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { ProductService } from '../../core/services/product.service';
import * as CategoriesActions from './categories.actions';

@Injectable()
export class CategoriesEffects {
  private actions$ = inject(Actions);
  private productService = inject(ProductService);

  loadCategories$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CategoriesActions.loadCategories),
      switchMap(() =>
        this.productService.getCategories(true).pipe(
          map(categories => CategoriesActions.loadCategoriesSuccess({ categories })),
          catchError(error => of(CategoriesActions.loadCategoriesFailure({ error: error.message })))
        )
      )
    )
  );
}
