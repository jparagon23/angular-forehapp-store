import { createFeatureSelector, createSelector } from '@ngrx/store';
import { DiscountsState } from './discounts.reducer';

const selectDiscountsState = createFeatureSelector<DiscountsState>('discounts');

export const selectAllDiscounts = createSelector(selectDiscountsState, s => s.discounts);
export const selectActiveDiscounts = createSelector(selectAllDiscounts, d => d.filter(x => x.active));
