import { HttpBackend, HttpClient, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { catchError, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TokenResponse } from '../models/auth.model';
import { TokenStore } from '../services/token-store.service';
import { logout } from '../../store/auth/auth.actions';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenStore = inject(TokenStore);
  const router     = inject(Router);
  const store      = inject(Store);
  const backend    = inject(HttpBackend);

  const token    = tokenStore.accessToken;
  const authReq  = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      const isRefreshCall = req.url.includes('auth/refresh-token');
      if (err.status === 401 && !isRefreshCall) {
        const refreshToken = tokenStore.refreshToken;
        if (refreshToken) {
          const rawHttp = new HttpClient(backend);
          return rawHttp.post<TokenResponse>(
            `${environment.apiBaseUrl}/auth/refresh-token`,
            { refreshToken }
          ).pipe(
            switchMap(tokens => {
              tokenStore.setTokens(tokens.access_token, tokens.refresh_token);
              const retried = req.clone({ setHeaders: { Authorization: `Bearer ${tokens.access_token}` } });
              return next(retried);
            }),
            catchError(() => {
              tokenStore.clearTokens();
              store.dispatch(logout());
              router.navigate(['/login']);
              return throwError(() => err);
            })
          );
        }
        tokenStore.clearTokens();
        store.dispatch(logout());
        router.navigate(['/login']);
      }
      return throwError(() => err);
    })
  );
};
