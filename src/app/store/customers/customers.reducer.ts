import { createReducer, on } from '@ngrx/store';
import { Customer } from '../../core/models/customer.model';
import * as CustomersActions from './customers.actions';

export interface CustomersState {
  customers: Customer[];
  loading: boolean;
  error: string | null;
}

const initialState: CustomersState = { customers: [], loading: false, error: null };

export const customersReducer = createReducer(
  initialState,
  on(CustomersActions.loadCustomers, state => ({ ...state, loading: true, error: null })),
  on(CustomersActions.loadCustomersSuccess, (state, { customers }) => ({ ...state, customers, loading: false })),
  on(CustomersActions.loadCustomersFailure, (state, { error }) => ({ ...state, loading: false, error })),
);
