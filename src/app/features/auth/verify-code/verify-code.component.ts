import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { Store } from '@ngrx/store';
import { AuthApiService } from '../../../core/services/auth-api.service';
import { TokenStore } from '../../../core/services/token-store.service';
import { resolveRole } from '../../../core/utils/jwt.utils';
import { loginSuccess } from '../../../store/auth/auth.actions';

@Component({
  selector: 'app-verify-code',
  standalone: true,
  imports: [FormsModule, RouterLink, NgIf],
  templateUrl: './verify-code.component.html',
  styleUrl: './verify-code.component.scss',
})
export class VerifyCodeComponent implements OnInit {
  private route       = inject(ActivatedRoute);
  private router      = inject(Router);
  private store       = inject(Store);
  private authService = inject(AuthApiService);
  private tokenStore  = inject(TokenStore);

  userId  = 0;
  code    = '';

  loading       = signal(false);
  resending     = signal(false);
  error         = signal('');
  resendMessage = signal('');

  ngOnInit() {
    this.userId = Number(this.route.snapshot.queryParams['userId']);
    if (!this.userId) this.router.navigate(['/register']);
  }

  submit() {
    this.error.set('');
    if (this.code.length !== 6) { this.error.set('El código debe tener 6 dígitos.'); return; }
    this.loading.set(true);
    this.authService.verifyCode({ userId: this.userId, code: this.code }).subscribe({
      next: res => {
        const role = resolveRole(res.storeRoles);
        const user = { userId: res.userId, name: res.name, email: res.email, role };
        this.tokenStore.setTokens(res.access_token, res.refresh_token, user);
        this.store.dispatch(loginSuccess({ user }));
        this.router.navigate(['/']);
      },
      error: err => {
        this.loading.set(false);
        this.error.set(err.error?.message ?? 'Código inválido o expirado.');
      },
    });
  }

  resend() {
    this.resendMessage.set('');
    this.error.set('');
    this.resending.set(true);
    this.authService.resendCode(this.userId).subscribe({
      next: res => {
        this.resending.set(false);
        this.resendMessage.set(res.message);
      },
      error: () => {
        this.resending.set(false);
        this.error.set('No se pudo reenviar el código. Inténtalo de nuevo.');
      },
    });
  }
}
