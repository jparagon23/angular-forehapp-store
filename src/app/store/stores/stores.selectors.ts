import { createFeatureSelector, createSelector } from '@ngrx/store';
import { StoresState } from './stores.reducer';
import { StoreRole } from '../../core/models/store.model';

const selectStoresState = createFeatureSelector<StoresState>('stores');

export const selectMyStores          = createSelector(selectStoresState, s => s.myStores);
export const selectSelectedStore     = createSelector(selectStoresState, s => s.selectedStore);
export const selectLastCreatedStore  = createSelector(selectStoresState, s => s.lastCreatedStore);
export const selectStoreMembers      = createSelector(selectStoresState, s => s.members);
export const selectStoresLoading     = createSelector(selectStoresState, s => s.loading);
export const selectMembersLoading    = createSelector(selectStoresState, s => s.membersLoading);
export const selectStoresActionLoading = createSelector(selectStoresState, s => s.actionLoading);
export const selectStoresError       = createSelector(selectStoresState, s => s.error);

export const selectMyRoleInStore = (storeId: number) =>
  createSelector(selectMyStores, stores => stores.find(s => s.storeId === storeId)?.myRole ?? null as StoreRole | null);
