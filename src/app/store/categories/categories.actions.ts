import { createAction, props } from '@ngrx/store';
import { Category } from '../../core/models/seller-product.model';

export const loadCategories = createAction('[Categories] Load');
export const loadCategoriesSuccess = createAction('[Categories] Load Success', props<{ categories: Category[] }>());
export const loadCategoriesFailure = createAction('[Categories] Load Failure', props<{ error: string }>());
