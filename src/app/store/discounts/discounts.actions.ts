import { createAction, props } from '@ngrx/store';
import { Discount } from '../../core/models/discount.model';

export const loadDiscounts = createAction('[Discounts] Load Discounts');
export const loadDiscountsSuccess = createAction('[Discounts] Load Discounts Success', props<{ discounts: Discount[] }>());
export const loadDiscountsFailure = createAction('[Discounts] Load Discounts Failure', props<{ error: string }>());

export const createDiscount = createAction('[Discounts] Create Discount', props<{ discount: Discount }>());
export const createDiscountSuccess = createAction('[Discounts] Create Discount Success', props<{ discount: Discount }>());

export const toggleDiscount = createAction('[Discounts] Toggle Discount', props<{ code: string }>());
export const toggleDiscountSuccess = createAction('[Discounts] Toggle Discount Success', props<{ code: string }>());

export const deleteDiscount = createAction('[Discounts] Delete Discount', props<{ code: string }>());
export const deleteDiscountSuccess = createAction('[Discounts] Delete Discount Success', props<{ code: string }>());
