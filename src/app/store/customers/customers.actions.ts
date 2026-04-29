import { createAction, props } from '@ngrx/store';
import { Customer } from '../../core/models/customer.model';

export const loadCustomers = createAction('[Customers] Load Customers');
export const loadCustomersSuccess = createAction('[Customers] Load Customers Success', props<{ customers: Customer[] }>());
export const loadCustomersFailure = createAction('[Customers] Load Customers Failure', props<{ error: string }>());
