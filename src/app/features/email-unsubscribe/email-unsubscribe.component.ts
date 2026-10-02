import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';
import { EmailPreferenceService } from '../../core/services/email-preference.service';
import { apiCode } from '../../core/models/api-error.model';

type ViewState = 'confirm' | 'unsubscribed' | 'resubscribed' | 'invalid';

@Component({
  selector: 'app-email-unsubscribe',
  standalone: true,
  imports: [RouterLink, NgIf],
  templateUrl: './email-unsubscribe.component.html',
  styleUrl: './email-unsubscribe.component.scss',
})
export class EmailUnsubscribeComponent implements OnInit {
  private route   = inject(ActivatedRoute);
  private service = inject(EmailPreferenceService);

  private token = '';

  state   = signal<ViewState>('confirm');
  loading = signal(false);
  email   = signal('');
  error   = signal<string | null>(null);

  ngOnInit() {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
    if (!this.token) this.state.set('invalid');
  }

  // La baja solo ocurre con el clic: los antivirus de correo abren los links solos
  // y darían de baja al comprador sin que lo pidiera.
  unsubscribe() {
    this.send('unsubscribed');
  }

  resubscribe() {
    this.send('resubscribed');
  }

  private send(target: 'unsubscribed' | 'resubscribed') {
    if (this.loading()) return;
    this.loading.set(true);
    this.error.set(null);
    const call = target === 'unsubscribed'
      ? this.service.unsubscribe(this.token)
      : this.service.resubscribe(this.token);
    call.subscribe({
      next: res => {
        this.email.set(res.email);
        this.state.set(target);
        this.loading.set(false);
      },
      error: err => {
        const code = apiCode(err);
        if (code === 'EMAIL_PREFERENCE_TOKEN_INVALID' || code === 'VALIDATION_ERROR') {
          this.state.set('invalid');
        } else {
          this.error.set('No pudimos procesar tu solicitud. Intenta de nuevo en unos minutos.');
        }
        this.loading.set(false);
      },
    });
  }
}
