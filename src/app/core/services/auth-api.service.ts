import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AuthResponse,
  RegisterRequest,
  RegisterResponse,
  TokenResponse,
  VerifyCodeRequest,
} from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly BASE = environment.apiBaseUrl;
  private http = inject(HttpClient);

  register(req: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.BASE}/auth/register`, req);
  }

  verifyCode(req: VerifyCodeRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.BASE}/auth/verify-code`, req);
  }

  resendCode(userId: number): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.BASE}/auth/resend-code`, { userId });
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.BASE}/login`, { email, password });
  }

  refreshToken(refreshToken: string): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(`${this.BASE}/auth/refresh-token`, { refreshToken });
  }
}
