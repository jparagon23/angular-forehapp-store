import { createFeatureSelector, createSelector } from '@ngrx/store';
import { CustomersState } from './customers.reducer';

const selectCustomersState = createFeatureSelector<CustomersState>('customers');

export const selectAllCustomers = createSelector(selectCustomersState, s => s.customers);
export const selectCustomersLoading = createSelector(selectCustomersState, s => s.loading);
export const selectVipCustomers = createSelector(selectAllCustomers, c => c.filter(x => x.vip));
