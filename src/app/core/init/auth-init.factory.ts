import { Store } from '@ngrx/store';
import { AuthApiService } from '../services/auth-api.service';
import { TokenStore } from '../services/token-store.service';
import { AuthUser, loginSuccess } from '../../store/auth/auth.actions';

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

        authApi.getMe().subscribe({
          next: me => {
            const user: AuthUser = {
              ...storedUser,
              name:     me.name,
              email:    me.email,
              lastname: me.lastname,
              phone:    me.phone,
            };
            tokenStore.setTokens(tokens.access_token, tokens.refresh_token, user);
            store.dispatch(loginSuccess({ user }));
            resolve();
          },
          error: () => {
            // /me falló (red, etc.) — usar datos cacheados del localStorage
            store.dispatch(loginSuccess({ user: storedUser }));
            resolve();
          },
        });
      },
      error: () => {
        tokenStore.clearTokens();
        resolve();
      },
    });
  });
}
