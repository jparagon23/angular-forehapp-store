import { createReducer, on } from '@ngrx/store';
import { Category } from '../../core/models/seller-product.model';
import * as CategoriesActions from './categories.actions';

export interface CategoriesState {
  categories: Category[];
  loading: boolean;
  error: string | null;
}

const initialState: CategoriesState = {
  categories: [],
  loading: false,
  error: null,
};

export const categoriesReducer = createReducer(
  initialState,
  on(CategoriesActions.loadCategories, state => ({ ...state, loading: true, error: null })),
  on(CategoriesActions.loadCategoriesSuccess, (state, { categories }) => ({ ...state, categories, loading: false })),
  on(CategoriesActions.loadCategoriesFailure, (state, { error }) => ({ ...state, loading: false, error })),
);
