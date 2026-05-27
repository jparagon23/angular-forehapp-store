import { createAction, props } from '@ngrx/store';

export type UserRole = 'CUSTOMER' | 'SELLER' | 'STORE_ADMIN';

export interface AuthUser {
  userId: number;
  name: string;
  email: string;
  lastname?: string;
  phone?: string | null;
  role: UserRole;
  storeRoles: string[];
}

export const loginSuccess = createAction('[Auth] Login Success', props<{ user: AuthUser }>());
export const updateUser   = createAction('[Auth] Update User',   props<{ changes: Partial<AuthUser> }>());
export const logout        = createAction('[Auth] Logout');
