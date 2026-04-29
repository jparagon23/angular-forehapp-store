import { createReducer, on } from '@ngrx/store';
import { AuthUser, loginSuccess, logout } from './auth.actions';

export interface AuthState {
  isLoggedIn: boolean;
  user: AuthUser | null;
}

const initialState: AuthState = { isLoggedIn: false, user: null };

export const authReducer = createReducer(
  initialState,
  on(loginSuccess, (_, { user }) => ({ isLoggedIn: true, user })),
  on(logout, () => ({ isLoggedIn: false, user: null })),
);
