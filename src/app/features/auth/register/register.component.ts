import { Component, ElementRef, inject, NgZone, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, ValidationErrors, Validators, ReactiveFormsModule } from '@angular/forms';
import { emailValidator } from '../../../core/utils/email.utils';
import { Router, RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';
import { Store } from '@ngrx/store';
import { AuthApiService } from '../../../core/services/auth-api.service';
import { TokenStore } from '../../../core/services/token-store.service';
import { GoogleAuthService } from '../../../core/services/google-auth.service';
import Swal from 'sweetalert2';
import { apiCode } from '../../../core/models/api-error.model';
import { SeoService } from '../../../core/services/seo.service';
import { environment } from '../../../../environments/environment';

declare const google: any;

function passwordsMatch(ctrl: AbstractControl): ValidationErrors | null {
  const pass    = ctrl.get('password')?.value;
  const confirm = ctrl.get('confirm')?.value;
  return pass && confirm && pass !== confirm ? { mismatch: true } : null;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, NgIf],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent implements OnInit, AfterViewInit {
  private fb          = inject(FormBuilder);
  private router      = inject(Router);
  private authService = inject(AuthApiService);
  private tokenStore  = inject(TokenStore);
  private store       = inject(Store);
  private googleAuth  = inject(GoogleAuthService);
  private ngZone      = inject(NgZone);
  private seo         = inject(SeoService);

  @ViewChild('googleBtn') private googleBtnRef!: ElementRef<HTMLDivElement>;

  ngOnInit() { this.seo.set({ title: 'Crear Cuenta' }); }

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
      text:   'signup_with',
      width:  336,
      locale: 'es',
    });
  }

  form = this.fb.group({
    name:     ['', [Validators.required, Validators.minLength(2)]],
    lastname: ['', [Validators.required, Validators.minLength(2)]],
    email:    ['', [Validators.required, emailValidator]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirm:  ['', Validators.required],
  }, { validators: passwordsMatch });

  submitted        = false;
  showPass         = false;
  showConfirmPass  = false;
  loading          = false;
  serverError      = '';
  googleLoading    = false;
  googleError      = '';

  get name()     { return this.form.controls['name']; }
  get lastname() { return this.form.controls['lastname']; }
  get email()    { return this.form.controls['email']; }
  get password() { return this.form.controls['password']; }
  get confirm()  { return this.form.controls['confirm']; }

  submit() {
    this.submitted   = true;
    this.serverError = '';
    if (this.form.invalid) return;

    this.loading = true;
    this.authService.register({
      name:     this.name.value!,
      lastname: this.lastname.value!,
      email:    this.email.value!,
      password: this.password.value!,
    }).subscribe({
      next: res => this.router.navigate(['/verify-code'], { queryParams: { userId: res.userId } }),
      error: err => {
        this.loading = false;
        if (apiCode(err) === 'AUTH_EMAIL_ALREADY_REGISTERED') {
          Swal.fire({
            icon: 'info',
            title: 'Correo ya registrado',
            html: 'Este correo ya tiene una cuenta en <strong>ForehApp Store</strong>.<br>Puedes iniciar sesión con el mismo correo y contraseña.',
            confirmButtonText: 'Ir al inicio de sesión',
            confirmButtonColor: '#2e7d32',
            showCancelButton: true,
            cancelButtonText: 'Cancelar',
            cancelButtonColor: '#aaa',
          }).then(result => {
            if (result.isConfirmed) this.router.navigate(['/login']);
          });
        } else {
          this.serverError = 'Error al registrarse. Inténtalo de nuevo.';
        }
      },
    });
  }

  private onGoogleCredential(idToken: string) {
    this.googleLoading = true;
    this.googleError   = '';
    this.googleAuth.handleCredential(idToken).subscribe({
      next: res => {
        this.googleAuth.applySession(res);
        this.router.navigate(['/']);
      },
      error: () => {
        this.googleLoading = false;
        this.googleError = 'No se pudo registrar con Google. Inténtalo de nuevo.';
      },
    });
  }
}
