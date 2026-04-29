import { Component, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';
import { Store } from '@ngrx/store';
import { loginSuccess } from '../../../store/auth/auth.actions';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, NgIf],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private fb     = inject(FormBuilder);
  private router = inject(Router);
  private route  = inject(ActivatedRoute);
  private store  = inject(Store);

  form = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  submitted  = false;
  showPass   = false;

  get email()    { return this.form.controls['email']; }
  get password() { return this.form.controls['password']; }

  submit() {
    this.submitted = true;
    if (this.form.invalid) return;
    const email = this.email.value!;
    this.store.dispatch(loginSuccess({ user: { name: email.split('@')[0], email } }));
    const redirect = this.route.snapshot.queryParams['redirect'] ?? '/';
    this.router.navigateByUrl(redirect);
  }
}
