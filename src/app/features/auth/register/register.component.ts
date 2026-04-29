import { Component, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ValidationErrors, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';
import { Store } from '@ngrx/store';
import { loginSuccess } from '../../../store/auth/auth.actions';

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
  private fb     = inject(FormBuilder);
  private router = inject(Router);
  private route  = inject(ActivatedRoute);
  private store  = inject(Store);

  form = this.fb.group({
    name:     ['', [Validators.required, Validators.minLength(2)]],
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirm:  ['', Validators.required],
  }, { validators: passwordsMatch });

  submitted = false;
  showPass  = false;

  get name()     { return this.form.controls['name']; }
  get email()    { return this.form.controls['email']; }
  get password() { return this.form.controls['password']; }
  get confirm()  { return this.form.controls['confirm']; }

  submit() {
    this.submitted = true;
    if (this.form.invalid) return;
    this.store.dispatch(loginSuccess({ user: { name: this.name.value!, email: this.email.value! } }));
    const redirect = this.route.snapshot.queryParams['redirect'] ?? '/';
    this.router.navigateByUrl(redirect);
  }
}
