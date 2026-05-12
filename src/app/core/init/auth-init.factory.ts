import { Store } from '@ngrx/store';
import { AuthApiService } from '../services/auth-api.service';
import { TokenStore } from '../services/token-store.service';
import { loginSuccess } from '../../store/auth/auth.actions';

export function authInitFactory(
  tokenStore: TokenStore,
  authApi: AuthApiService,
  store: Store,
): () => Promise<void> {
  return () => new Promise(resolve => {
    const refreshToken = tokenStore.refreshToken;
    const storedUser   = tokenStore.storedUser;

    if (!refreshToken || !storedUser) { resolve(); return; }

    authApi.refreshToken(refreshToken).subscribe({
      next: tokens => {
        tokenStore.setTokens(tokens.access_token, tokens.refresh_token, storedUser);
        store.dispatch(loginSuccess({ user: storedUser }));
        resolve();
      },
      error: () => {
        tokenStore.clearTokens();
        resolve();
      },
    });
  });
}
