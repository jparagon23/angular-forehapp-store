import { createAction, props } from '@ngrx/store';
import { SellerProduct } from '../../core/models/seller-product.model';

export const loadSellerProducts = createAction('[Seller] Load Products');
export const loadSellerProductsSuccess = createAction(
  '[Seller] Load Products Success', props<{ products: SellerProduct[] }>()
);
export const loadSellerProductsFailure = createAction(
  '[Seller] Load Products Failure', props<{ error: string }>()
);

export const deleteSellerProduct = createAction('[Seller] Delete Product', props<{ id: number }>());
export const deleteSellerProductSuccess = createAction(
  '[Seller] Delete Product Success', props<{ id: number }>()
);

export const changeSellerProductStatus = createAction(
  '[Seller] Change Product Status',
  props<{ id: number; action: 'publish' | 'deactivate' | 'activate' }>()
);
export const changeSellerProductStatusSuccess = createAction(
  '[Seller] Change Product Status Success', props<{ product: SellerProduct }>()
);
export const sellerActionFailure = createAction(
  '[Seller] Action Failure', props<{ error: string }>()
);
