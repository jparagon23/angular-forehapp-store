import { createReducer, on } from '@ngrx/store';
import { Address } from '../../core/models/address.model';
import * as AddressesActions from './addresses.actions';

export interface AddressesState {
  addresses: Address[];
  loading: boolean;
  saving: boolean;
  error: string | null;
}

const initialState: AddressesState = {
  addresses: [],
  loading: false,
  saving: false,
  error: null,
};

export const addressesReducer = createReducer(
  initialState,

  on(AddressesActions.loadAddresses, state => ({ ...state, loading: true, error: null })),
  on(AddressesActions.loadAddressesSuccess, (state, { addresses }) => ({ ...state, addresses, loading: false })),
  on(AddressesActions.loadAddressesFailure, (state, { error }) => ({ ...state, loading: false, error })),

  on(AddressesActions.createAddress, state => ({ ...state, saving: true, error: null })),
  on(AddressesActions.createAddressSuccess, (state, { address }) => ({
    ...state,
    saving: false,
    addresses: [...state.addresses, address],
  })),
  on(AddressesActions.createAddressFailure, (state, { error }) => ({ ...state, saving: false, error })),

  on(AddressesActions.updateAddress, state => ({ ...state, saving: true, error: null })),
  on(AddressesActions.updateAddressSuccess, (state, { address }) => ({
    ...state,
    saving: false,
    addresses: state.addresses.map(a => a.id === address.id ? address : a),
  })),
  on(AddressesActions.updateAddressFailure, (state, { error }) => ({ ...state, saving: false, error })),

  on(AddressesActions.deleteAddressSuccess, (state, { id }) => ({
    ...state,
    addresses: state.addresses.filter(a => a.id !== id),
  })),
  on(AddressesActions.deleteAddressFailure, (state, { error }) => ({ ...state, error })),

  on(AddressesActions.setDefaultAddressSuccess, (state, { address }) => ({
    ...state,
    addresses: state.addresses.map(a => ({ ...a, isDefault: a.id === address.id })),
  })),
  on(AddressesActions.setDefaultAddressFailure, (state, { error }) => ({ ...state, error })),
);
