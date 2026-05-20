import { createFeatureSelector, createSelector } from '@ngrx/store';
import { SellerState } from './seller.reducer';

const selectSellerState = createFeatureSelector<SellerState>('seller');

export const selectActiveSellerStoreId   = createSelector(selectSellerState, s => s.activeStoreId);
export const selectActiveSellerStoreName = createSelector(selectSellerState, s => s.activeStoreName);
export const selectSellerProducts        = createSelector(selectSellerState, s => s.products);
export const selectSellerLoading         = createSelector(selectSellerState, s => s.loading);
export const selectSellerError           = createSelector(selectSellerState, s => s.error);
export const selectSellerInventoryLoading = createSelector(selectSellerState, s => s.inventoryLoading);
