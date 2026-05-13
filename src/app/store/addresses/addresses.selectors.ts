import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AddressesState } from './addresses.reducer';

const selectAddressesState = createFeatureSelector<AddressesState>('addresses');

export const selectAllAddresses = createSelector(selectAddressesState, s => s.addresses);
export const selectAddressesLoading = createSelector(selectAddressesState, s => s.loading);
export const selectAddressesSaving = createSelector(selectAddressesState, s => s.saving);
export const selectAddressesError = createSelector(selectAddressesState, s => s.error);
export const selectDefaultAddress = createSelector(selectAllAddresses, addrs => addrs.find(a => a.isDefault) ?? null);
export const selectAddressCount = createSelector(selectAllAddresses, addrs => addrs.length);
