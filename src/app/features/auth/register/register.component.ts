import { Component, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ValidationErrors, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';
import { AuthApiService } from '../../../core/services/auth-api.service';
import Swal from 'sweetalert2';
import { apiCode } from '../../../core/models/api-error.model';

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
export class RegisterComponent {
  private fb          = inject(FormBuilder);
  private router      = inject(Router);
  private authService = inject(AuthApiService);

  form = this.fb.group({
    name:     ['', [Validators.required, Validators.minLength(2)]],
    lastname: ['', [Validators.required, Validators.minLength(2)]],
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirm:  ['', Validators.required],
  }, { validators: passwordsMatch });

  submitted        = false;
  showPass         = false;
  showConfirmPass  = false;
  loading          = false;
  serverError = '';

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
            html: 'Este correo ya tiene una cuenta en <strong>Forehapp Store</strong>.<br>Puedes iniciar sesión con el mismo correo y contraseña.',
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
}
