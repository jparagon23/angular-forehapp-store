import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AuthState } from './auth.reducer';

const selectAuthState = createFeatureSelector<AuthState>('auth');
export const selectIsLoggedIn  = createSelector(selectAuthState, s => s.isLoggedIn);
export const selectAuthUser    = createSelector(selectAuthState, s => s.user);
export const selectUserRole    = createSelector(selectAuthState, s => s.user?.role ?? null);
export const selectStoreRoles  = createSelector(selectAuthState, s => s.user?.storeRoles ?? []);
export const selectCanShop     = createSelector(selectStoreRoles, roles => roles.includes('CUSTOMER'));
export const selectHasSeller   = createSelector(selectStoreRoles, roles => roles.includes('SELLER'));
export const selectHasAdmin    = createSelector(selectStoreRoles, roles => roles.includes('STORE_ADMIN'));
