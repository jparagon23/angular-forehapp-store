import { createAction, props } from '@ngrx/store';

export interface AuthUser { name: string; email: string; }

export const loginSuccess = createAction('[Auth] Login Success', props<{ user: AuthUser }>());
export const logout        = createAction('[Auth] Logout');
