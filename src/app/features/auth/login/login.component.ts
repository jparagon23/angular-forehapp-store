import { Component, ElementRef, inject, NgZone, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';
import { Store } from '@ngrx/store';
import { loginSuccess } from '../../../store/auth/auth.actions';
import { AuthApiService } from '../../../core/services/auth-api.service';
import { TokenStore } from '../../../core/services/token-store.service';
import { GoogleAuthService } from '../../../core/services/google-auth.service';
import { resolveRole } from '../../../core/utils/jwt.utils';
import { SeoService } from '../../../core/services/seo.service';
import { environment } from '../../../../environments/environment';

declare const google: any;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, NgIf],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit, AfterViewInit {
  private fb             = inject(FormBuilder);
  private router         = inject(Router);
  private route          = inject(ActivatedRoute);
  private store          = inject(Store);
  private authService    = inject(AuthApiService);
  private tokenStore     = inject(TokenStore);
  private googleAuth     = inject(GoogleAuthService);
  private ngZone         = inject(NgZone);
  private seo            = inject(SeoService);

  @ViewChild('googleBtn') private googleBtnRef!: ElementRef<HTMLDivElement>;

  ngOnInit() { this.seo.set({ title: 'Iniciar Sesión' }); }

  ngAfterViewInit() {
    if (typeof google === 'undefined' || !environment.googleClientId) return;
    google.accounts.id.initialize({
      client_id: environment.googleClientId,
      callback: (response: any) =>
        this.ngZone.run(() => this.onGoogleCredential(response.credential)),
    });
    google.accounts.id.renderButton(this.googleBtnRef.nativeElement, {
      type:   'standard',
      size:   'large',
      text:   'signin_with',
      width:  336,
      locale: 'es',
    });
  }

  form = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  submitted     = false;
  showPass      = false;
  loading       = false;
  loginError    = '';
  googleLoading = false;
  googleError   = '';

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
        const user = { userId: res.userId, name: res.name, email: res.email, role, storeRoles: res.storeRoles };
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

  private onGoogleCredential(idToken: string) {
    this.googleLoading = true;
    this.googleError   = '';
    this.googleAuth.handleCredential(idToken).subscribe({
      next: res => {
        this.googleAuth.applySession(res);
        const redirect = this.route.snapshot.queryParams['redirect'] ?? '/';
        this.router.navigateByUrl(redirect);
      },
      error: () => {
        this.googleLoading = false;
        this.googleError = 'No se pudo iniciar sesión con Google. Inténtalo de nuevo.';
      },
    });
  }
}
