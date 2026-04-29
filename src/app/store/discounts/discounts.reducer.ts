import { createReducer, on } from '@ngrx/store';
import { Discount } from '../../core/models/discount.model';
import * as DiscountsActions from './discounts.actions';

export interface DiscountsState {
  discounts: Discount[];
  loading: boolean;
  error: string | null;
}

const initialState: DiscountsState = { discounts: [], loading: false, error: null };

export const discountsReducer = createReducer(
  initialState,
  on(DiscountsActions.loadDiscounts, state => ({ ...state, loading: true, error: null })),
  on(DiscountsActions.loadDiscountsSuccess, (state, { discounts }) => ({ ...state, discounts, loading: false })),
  on(DiscountsActions.loadDiscountsFailure, (state, { error }) => ({ ...state, loading: false, error })),
  on(DiscountsActions.createDiscountSuccess, (state, { discount }) => ({
    ...state, discounts: [discount, ...state.discounts]
  })),
  on(DiscountsActions.toggleDiscountSuccess, (state, { code }) => ({
    ...state, discounts: state.discounts.map(d => d.code === code ? { ...d, active: !d.active } : d)
  })),
  on(DiscountsActions.deleteDiscountSuccess, (state, { code }) => ({
    ...state, discounts: state.discounts.filter(d => d.code !== code)
  })),
);
