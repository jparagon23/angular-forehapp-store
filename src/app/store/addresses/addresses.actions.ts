import { createAction, props } from '@ngrx/store';
import { Address, CreateAddressRequest, UpdateAddressRequest } from '../../core/models/address.model';

export const loadAddresses = createAction('[Addresses] Load');
export const loadAddressesSuccess = createAction('[Addresses] Load Success', props<{ addresses: Address[] }>());
export const loadAddressesFailure = createAction('[Addresses] Load Failure', props<{ error: string }>());

export const createAddress = createAction('[Addresses] Create', props<{ req: CreateAddressRequest }>());
export const createAddressSuccess = createAction('[Addresses] Create Success', props<{ address: Address }>());
export const createAddressFailure = createAction('[Addresses] Create Failure', props<{ error: string }>());

export const updateAddress = createAction('[Addresses] Update', props<{ id: number; req: UpdateAddressRequest }>());
export const updateAddressSuccess = createAction('[Addresses] Update Success', props<{ address: Address }>());
export const updateAddressFailure = createAction('[Addresses] Update Failure', props<{ error: string }>());

export const deleteAddress = createAction('[Addresses] Delete', props<{ id: number }>());
export const deleteAddressSuccess = createAction('[Addresses] Delete Success', props<{ id: number }>());
export const deleteAddressFailure = createAction('[Addresses] Delete Failure', props<{ error: string }>());

export const setDefaultAddress = createAction('[Addresses] Set Default', props<{ id: number }>());
export const setDefaultAddressSuccess = createAction('[Addresses] Set Default Success', props<{ address: Address }>());
export const setDefaultAddressFailure = createAction('[Addresses] Set Default Failure', props<{ error: string }>());
