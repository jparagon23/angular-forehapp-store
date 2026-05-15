import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { Store } from '@ngrx/store';
import { take } from 'rxjs';
import { selectIsLoggedIn } from '../../store/auth/auth.selectors';
import { ReturnResponse, ReturnStatus, ReturnType } from '../../core/models/return.model';
import { ReturnService } from '../../core/services/return.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { CartDrawerComponent } from '../cart/cart-drawer.component';
import { CurrencyCopPipe } from '../../shared/pipes/currency-cop.pipe';

@Component({
  selector: 'app-my-returns',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, DatePipe, RouterLink, NavbarComponent, CartDrawerComponent, CurrencyCopPipe],
  templateUrl: './my-returns.component.html',
  styleUrl: './my-returns.component.scss',
})
export class MyReturnsComponent implements OnInit {
  private store         = inject(Store);
  private router        = inject(Router);
  private returnService = inject(ReturnService);

  returns = signal<ReturnResponse[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.store.select(selectIsLoggedIn).pipe(take(1)).subscribe(loggedIn => {
      if (!loggedIn) {
        this.router.navigate(['/login'], { queryParams: { redirect: '/my-returns' } });
        return;
      }
      this.returnService.getMyReturns().subscribe({
        next:  returns => { this.returns.set(returns); this.loading.set(false); },
        error: ()      => this.loading.set(false),
      });
    });
  }

  returnTypeLabel(type: ReturnType): string {
    const labels: Record<ReturnType, string> = {
      DEVOLUCION:        'Devolución física',
      REEMBOLSO_PARCIAL: 'Reembolso parcial',
      REEMBOLSO_COMPLETO: 'Reembolso completo',
    };
    return labels[type];
  }

  statusLabel(status: ReturnStatus): string {
    const labels: Record<ReturnStatus, string> = {
      PENDIENTE:   'En revisión',
      APROBADA:    'Aprobada',
      RECHAZADA:   'Rechazada',
      REEMBOLSADA: 'Reembolso procesado',
    };
    return labels[status];
  }

  statusIcon(status: ReturnStatus): string {
    const icons: Record<ReturnStatus, string> = {
      PENDIENTE: '⏳', APROBADA: '✅', RECHAZADA: '❌', REEMBOLSADA: '💰',
    };
    return icons[status];
  }
}
