import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AuthUser } from '../../store/auth/auth.actions';

const KEY_ACCESS  = 'access_token';
const KEY_REFRESH = 'refresh_token';
const KEY_USER    = 'auth_user';

@Injectable({ providedIn: 'root' })
export class TokenStore {
  private platformId = inject(PLATFORM_ID);
  private get ok() { return isPlatformBrowser(this.platformId); }

  get accessToken(): string | null  { return this.ok ? localStorage.getItem(KEY_ACCESS)  : null; }
  get refreshToken(): string | null { return this.ok ? localStorage.getItem(KEY_REFRESH) : null; }

  get storedUser(): AuthUser | null {
    if (!this.ok) return null;
    const raw = localStorage.getItem(KEY_USER);
    try { return raw ? JSON.parse(raw) : null; } catch { return null; }
  }

  setTokens(accessToken: string, refreshToken: string, user?: AuthUser): void {
    if (!this.ok) return;
    localStorage.setItem(KEY_ACCESS,  accessToken);
    localStorage.setItem(KEY_REFRESH, refreshToken);
    if (user) localStorage.setItem(KEY_USER, JSON.stringify(user));
  }

  updateStoredUser(user: AuthUser): void {
    if (!this.ok) return;
    localStorage.setItem(KEY_USER, JSON.stringify(user));
  }

  clearTokens(): void {
    if (!this.ok) return;
    localStorage.removeItem(KEY_ACCESS);
    localStorage.removeItem(KEY_REFRESH);
    localStorage.removeItem(KEY_USER);
  }
}
