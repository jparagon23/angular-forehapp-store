import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { ProductService } from '../../core/services/product.service';
import * as ProductsActions from './products.actions';

@Injectable()
export class ProductsEffects {
  private actions$ = inject(Actions);
  private productService = inject(ProductService);

  loadProducts$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProductsActions.loadProducts),
      switchMap(({ search, categoryId }) =>
        this.productService.getProducts({ search, categoryId }).pipe(
          map(products => ProductsActions.loadProductsSuccess({ products })),
          catchError(error => of(ProductsActions.loadProductsFailure({ error: error.message })))
        )
      )
    )
  );

  loadProduct$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProductsActions.loadProduct),
      switchMap(({ id }) =>
        this.productService.getProduct(id).pipe(
          map(product => product
            ? ProductsActions.loadProductSuccess({ product })
            : ProductsActions.loadProductFailure({ error: 'Producto no encontrado' })
          ),
          catchError(error => of(ProductsActions.loadProductFailure({ error: error.message })))
        )
      )
    )
  );

  createProduct$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProductsActions.createProduct),
      switchMap(({ product }) =>
        this.productService.createProduct(product).pipe(
          map(p => ProductsActions.createProductSuccess({ product: p }))
        )
      )
    )
  );

  updateProduct$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProductsActions.updateProduct),
      switchMap(({ product }) =>
        this.productService.updateProduct(product).pipe(
          map(p => ProductsActions.updateProductSuccess({ product: p }))
        )
      )
    )
  );

  deleteProduct$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProductsActions.deleteProduct),
      switchMap(({ id }) =>
        this.productService.deleteProduct(id).pipe(
          map(id => ProductsActions.deleteProductSuccess({ id }))
        )
      )
    )
  );

  updateStock$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProductsActions.updateStock),
      switchMap(({ id, stock }) =>
        this.productService.updateStock(id, stock).pipe(
          map(res => ProductsActions.updateStockSuccess(res))
        )
      )
    )
  );
}
