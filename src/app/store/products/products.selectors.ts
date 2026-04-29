import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ProductsState, selectAll, selectEntities } from './products.reducer';

const selectProductsState = createFeatureSelector<ProductsState>('products');

export const selectAllProducts = createSelector(selectProductsState, selectAll);
export const selectProductEntities = createSelector(selectProductsState, selectEntities);
export const selectProductsLoading = createSelector(selectProductsState, s => s.loading);
export const selectProductsError = createSelector(selectProductsState, s => s.error);
export const selectSelectedProductId = createSelector(selectProductsState, s => s.selectedId);
export const selectSelectedProduct = createSelector(
  selectProductEntities,
  selectSelectedProductId,
  (entities, id) => (id != null ? entities[id] : undefined)
);
export const selectLowStockProducts = createSelector(selectAllProducts, products =>
  products.filter(p => p.stock <= 5)
);
