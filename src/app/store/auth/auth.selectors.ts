import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AuthState } from './auth.reducer';

const selectAuthState = createFeatureSelector<AuthState>('auth');
export const selectIsLoggedIn = createSelector(selectAuthState, s => s.isLoggedIn);
export const selectAuthUser   = createSelector(selectAuthState, s => s.user);
export const selectUserRole   = createSelector(selectAuthState, s => s.user?.role ?? null);
export const selectCanShop    = createSelector(selectAuthState, s => s.user?.storeRoles?.includes('CUSTOMER') ?? false);
