import { createAction, props } from '@ngrx/store';
import { Product } from '../../core/models/product.model';

export const loadProducts = createAction('[Products] Load Products', props<{ search?: string; categoryId?: number }>());
export const loadProductsSuccess = createAction('[Products] Load Products Success', props<{ products: Product[] }>());
export const loadProductsFailure = createAction('[Products] Load Products Failure', props<{ error: string }>());

export const loadProduct = createAction('[Products] Load Product', props<{ id: number }>());
export const loadProductSuccess = createAction('[Products] Load Product Success', props<{ product: Product }>());
export const loadProductFailure = createAction('[Products] Load Product Failure', props<{ error: string }>());

export const createProduct = createAction('[Products] Create Product', props<{ product: Omit<Product, 'id'> }>());
export const createProductSuccess = createAction('[Products] Create Product Success', props<{ product: Product }>());

export const updateProduct = createAction('[Products] Update Product', props<{ product: Product }>());
export const updateProductSuccess = createAction('[Products] Update Product Success', props<{ product: Product }>());

export const deleteProduct = createAction('[Products] Delete Product', props<{ id: number }>());
export const deleteProductSuccess = createAction('[Products] Delete Product Success', props<{ id: number }>());

export const updateStock = createAction('[Products] Update Stock', props<{ id: number; stock: number }>());
export const updateStockSuccess = createAction('[Products] Update Stock Success', props<{ id: number; stock: number }>());
