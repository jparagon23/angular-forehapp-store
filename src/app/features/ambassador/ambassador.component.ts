import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe, NgFor, NgIf } from '@angular/common';
import { forkJoin } from 'rxjs';
import { AmbassadorService } from '../../core/services/ambassador.service';
import { AmbassadorMeResponse, CommissionResponse } from '../../core/models/ambassador.model';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { CurrencyCopPipe } from '../../shared/pipes/currency-cop.pipe';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-ambassador',
  standalone: true,
  imports: [NgFor, NgIf, DatePipe, NavbarComponent, CurrencyCopPipe],
  templateUrl: './ambassador.component.html',
  styleUrl: './ambassador.component.scss',
})
export class AmbassadorComponent implements OnInit {
  private svc = inject(AmbassadorService);

  me          = signal<AmbassadorMeResponse | null>(null);
  commissions = signal<CommissionResponse[]>([]);
  loading     = signal(true);
  error       = signal('');
  copied      = signal(false);

  private readonly siteUrl = environment.siteUrl ?? 'https://forehapp.com';

  ngOnInit() {
    forkJoin({ me: this.svc.getMe(), list: this.svc.getMyCommissions() }).subscribe({
      next: ({ me, list }) => {
        this.me.set(me);
        this.commissions.set(list);
        this.loading.set(false);
      },
      error: () => { this.error.set('Error al cargar tu información de embajador.'); this.loading.set(false); },
    });
  }

  get myLink(): string {
    const me = this.me();
    return me ? `${this.siteUrl}?ref=${me.referralCode}` : '';
  }

  copyLink() {
    navigator.clipboard.writeText(this.myLink).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }
}
