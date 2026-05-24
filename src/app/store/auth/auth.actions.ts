import { createAction, props } from '@ngrx/store';

export type UserRole = 'CUSTOMER' | 'SELLER' | 'STORE_ADMIN';

export interface AuthUser {
  userId: number;
  name: string;
  email: string;
  role: UserRole;
  storeRoles: string[];
}

export const loginSuccess = createAction('[Auth] Login Success', props<{ user: AuthUser }>());
export const logout        = createAction('[Auth] Logout');
