import { Injectable } from '@angular/core';
import { AuthUser } from '../../store/auth/auth.actions';

const KEY_ACCESS  = 'access_token';
const KEY_REFRESH = 'refresh_token';
const KEY_USER    = 'auth_user';

@Injectable({ providedIn: 'root' })
export class TokenStore {
  get accessToken(): string | null  { return localStorage.getItem(KEY_ACCESS); }
  get refreshToken(): string | null { return localStorage.getItem(KEY_REFRESH); }

  get storedUser(): AuthUser | null {
    const raw = localStorage.getItem(KEY_USER);
    try { return raw ? JSON.parse(raw) : null; } catch { return null; }
  }

  setTokens(accessToken: string, refreshToken: string, user?: AuthUser): void {
    localStorage.setItem(KEY_ACCESS,  accessToken);
    localStorage.setItem(KEY_REFRESH, refreshToken);
    if (user) localStorage.setItem(KEY_USER, JSON.stringify(user));
  }

  updateStoredUser(user: AuthUser): void {
    localStorage.setItem(KEY_USER, JSON.stringify(user));
  }

  clearTokens(): void {
    localStorage.removeItem(KEY_ACCESS);
    localStorage.removeItem(KEY_REFRESH);
    localStorage.removeItem(KEY_USER);
  }
}
