import { inject, Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, filter, map, switchMap, withLatestFrom } from 'rxjs/operators';
import { of } from 'rxjs';
import { SellerProductService } from '../../core/services/seller-product.service';
import {
  adjustSellerInventory,
  adjustSellerInventorySuccess,
  changeSellerProductStatus,
  changeSellerProductStatusSuccess,
  deleteSellerProduct,
  deleteSellerProductSuccess,
  loadSellerProducts,
  loadSellerProductsFailure,
  loadSellerProductsSuccess,
  sellerActionFailure,
  setActiveSellerStore,
} from './seller.actions';
import { selectActiveSellerStoreId } from './seller.selectors';

function extractApiError(err: HttpErrorResponse, fallback: string): string {
  return err.error?.error ?? err.error?.message ?? err.message ?? fallback;
}

@Injectable()
export class SellerEffects {
  private actions$  = inject(Actions);
  private service   = inject(SellerProductService);
  private store     = inject(Store);

  storeSelected$ = createEffect(() =>
    this.actions$.pipe(
      ofType(setActiveSellerStore),
      map(() => loadSellerProducts())
    )
  );

  loadProducts$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadSellerProducts),
      withLatestFrom(this.store.select(selectActiveSellerStoreId)),
      filter(([, storeId]) => storeId !== null),
      switchMap(([, storeId]) => this.service.getSellerProducts(storeId!).pipe(
        map(products => loadSellerProductsSuccess({ products })),
        catchError(err => of(loadSellerProductsFailure({ error: extractApiError(err, 'Error al cargar productos') })))
      ))
    )
  );

  deleteProduct$ = createEffect(() =>
    this.actions$.pipe(
      ofType(deleteSellerProduct),
      withLatestFrom(this.store.select(selectActiveSellerStoreId)),
      filter(([, storeId]) => storeId !== null),
      switchMap(([{ id }, storeId]) => this.service.deleteProduct(storeId!, id).pipe(
        map(() => deleteSellerProductSuccess({ id })),
        catchError(err => of(sellerActionFailure({ error: extractApiError(err, 'Error al eliminar') })))
      ))
    )
  );

  changeStatus$ = createEffect(() =>
    this.actions$.pipe(
      ofType(changeSellerProductStatus),
      withLatestFrom(this.store.select(selectActiveSellerStoreId)),
      filter(([, storeId]) => storeId !== null),
      switchMap(([{ id, action }, storeId]) => {
        const call$ = action === 'publish'    ? this.service.publishProduct(storeId!, id)
                    : action === 'deactivate' ? this.service.deactivateProduct(storeId!, id)
                    :                           this.service.activateProduct(storeId!, id);
        return call$.pipe(
          map(product => changeSellerProductStatusSuccess({ product })),
          catchError(err => of(sellerActionFailure({ error: extractApiError(err, 'Error al cambiar estado') })))
        );
      })
    )
  );

  adjustInventory$ = createEffect(() =>
    this.actions$.pipe(
      ofType(adjustSellerInventory),
      switchMap(({ productId, variantId, quantity, reason }) =>
        this.service.updateInventory(productId, variantId, { quantity, reason }).pipe(
          map(() => adjustSellerInventorySuccess({ productId, variantId, quantity })),
          catchError(err => of(sellerActionFailure({
            error: extractApiError(err, 'Error al ajustar inventario'),
          })))
        )
      )
    )
  );
}
