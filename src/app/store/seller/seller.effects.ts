import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { SellerProductService } from '../../core/services/seller-product.service';
import {
  changeSellerProductStatus,
  changeSellerProductStatusSuccess,
  deleteSellerProduct,
  deleteSellerProductSuccess,
  loadSellerProducts,
  loadSellerProductsFailure,
  loadSellerProductsSuccess,
  sellerActionFailure,
} from './seller.actions';

@Injectable()
export class SellerEffects {
  private actions$  = inject(Actions);
  private service   = inject(SellerProductService);

  loadProducts$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadSellerProducts),
      switchMap(() => this.service.getSellerProducts().pipe(
        map(products => loadSellerProductsSuccess({ products })),
        catchError(err => of(loadSellerProductsFailure({ error: err.message ?? 'Error al cargar productos' })))
      ))
    )
  );

  deleteProduct$ = createEffect(() =>
    this.actions$.pipe(
      ofType(deleteSellerProduct),
      switchMap(({ id }) => this.service.deleteProduct(id).pipe(
        map(() => deleteSellerProductSuccess({ id })),
        catchError(err => of(sellerActionFailure({ error: err.message ?? 'Error al eliminar' })))
      ))
    )
  );

  changeStatus$ = createEffect(() =>
    this.actions$.pipe(
      ofType(changeSellerProductStatus),
      switchMap(({ id, action }) => {
        const call$ = action === 'publish'     ? this.service.publishProduct(id)
                    : action === 'deactivate'  ? this.service.deactivateProduct(id)
                    :                            this.service.activateProduct(id);
        return call$.pipe(
          map(product => changeSellerProductStatusSuccess({ product })),
          catchError(err => of(sellerActionFailure({ error: err.message ?? 'Error al cambiar estado' })))
        );
      })
    )
  );
}
