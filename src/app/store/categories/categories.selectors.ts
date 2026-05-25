import { createFeatureSelector, createSelector } from '@ngrx/store';
import { CategoriesState } from './categories.reducer';

const selectCategoriesState = createFeatureSelector<CategoriesState>('categories');

export const selectAllCategories = createSelector(selectCategoriesState, s => s.categories);
export const selectCategoriesLoading = createSelector(selectCategoriesState, s => s.loading);
