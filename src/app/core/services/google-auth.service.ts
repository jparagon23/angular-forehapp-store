import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, catchError, throwError } from 'rxjs';
import { AuthApiService } from './auth-api.service';
import { TokenStore } from './token-store.service';
import { loginSuccess, AuthUser } from '../../store/auth/auth.actions';
import { resolveRole } from '../utils/jwt.utils';
import { AuthResponse } from '../models/auth.model';
import { apiCode } from '../models/api-error.model';

@Injectable({ providedIn: 'root' })
export class GoogleAuthService {
  private authApi    = inject(AuthApiService);
  private tokenStore = inject(TokenStore);
  private store      = inject(Store);

  handleCredential(idToken: string): Observable<AuthResponse> {
    return this.authApi.googleLogin(idToken).pipe(
      catchError(err => {
        if (apiCode(err) === 'AUTH_GOOGLE_ACCOUNT_NOT_FOUND') {
          return this.authApi.googleRegister(idToken);
        }
        return throwError(() => err);
      })
    );
  }

  applySession(res: AuthResponse): AuthUser {
    const role = resolveRole(res.storeRoles);
    const user: AuthUser = {
      userId:     res.userId,
      name:       res.name,
      email:      res.email,
      role,
      storeRoles: res.storeRoles,
    };
    this.tokenStore.setTokens(res.access_token, res.refresh_token, user);
    this.store.dispatch(loginSuccess({ user }));
    return user;
  }
}
