import { Component, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';
import { Store } from '@ngrx/store';
import { loginSuccess } from '../../../store/auth/auth.actions';
import { AuthApiService } from '../../../core/services/auth-api.service';
import { TokenStore } from '../../../core/services/token-store.service';
import { resolveRole } from '../../../core/utils/jwt.utils';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, NgIf],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private fb          = inject(FormBuilder);
  private router      = inject(Router);
  private route       = inject(ActivatedRoute);
  private store       = inject(Store);
  private authService = inject(AuthApiService);
  private tokenStore  = inject(TokenStore);

  form = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  submitted   = false;
  showPass    = false;
  loading     = false;
  loginError  = '';

  get email()    { return this.form.controls['email']; }
  get password() { return this.form.controls['password']; }

  submit() {
    this.submitted  = true;
    this.loginError = '';
    if (this.form.invalid) return;

    this.loading = true;
    this.authService.login(this.email.value!, this.password.value!).subscribe({
      next: res => {
        const role = resolveRole(res.storeRoles);
        const user = { userId: res.userId, name: res.name, email: res.email, role };
        this.tokenStore.setTokens(res.access_token, res.refresh_token, user);
        this.store.dispatch(loginSuccess({ user }));
        const redirect = this.route.snapshot.queryParams['redirect'] ?? '/';
        this.router.navigateByUrl(redirect);
      },
      error: err => {
        this.loading = false;
        this.loginError = err.error?.message ?? 'Credenciales incorrectas o cuenta no verificada.';
      },
    });
  }
}
