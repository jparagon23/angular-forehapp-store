import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe, NgFor, NgIf, UpperCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { AmbassadorService } from '../../../core/services/ambassador.service';
import { AmbassadorResponse, CommissionResponse } from '../../../core/models/ambassador.model';
import { StoreService } from '../../../core/services/store.service';
import { UserSearchResult } from '../../../core/models/store.model';
import { AdminTopbarComponent } from '../shared/admin-topbar.component';
import { CurrencyCopPipe } from '../../../shared/pipes/currency-cop.pipe';
import { apiCode } from '../../../core/models/api-error.model';

@Component({
  selector: 'app-ambassadors-admin',
  standalone: true,
  imports: [NgFor, NgIf, DatePipe, FormsModule, UpperCasePipe, AdminTopbarComponent, CurrencyCopPipe],
  templateUrl: './ambassadors-admin.component.html',
  styleUrl: './ambassadors-admin.component.scss',
})
export class AmbassadorsAdminComponent implements OnInit {
  private svc      = inject(AmbassadorService);
  private storeSvc = inject(StoreService);

  ambassadors = signal<AmbassadorResponse[]>([]);
  loading     = signal(true);
  error       = signal('');

  creating     = signal(false);
  createError  = signal('');
  createSaving = signal(false);
  newCode      = signal('');
  newPct       = signal('');

  searchEmail  = '';
  searching    = false;
  foundUser: UserSearchResult | null = null;
  searchError  = '';

  selected    = signal<AmbassadorResponse | null>(null);
  commissions = signal<CommissionResponse[]>([]);
  commLoading = signal(false);
  payingId    = signal<number | null>(null);

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.svc.listAmbassadors().subscribe({
      next: list => { this.ambassadors.set(list); this.loading.set(false); },
      error: ()   => { this.error.set('Error al cargar embajadores'); this.loading.set(false); },
    });
  }

  openCreate() { this.creating.set(true); this.createError.set(''); }
  closeCreate() {
    this.creating.set(false);
    this.newCode.set(''); this.newPct.set('');
    this.createError.set('');
    this.clearUser();
  }

  searchUser() {
    const email = this.searchEmail.trim();
    if (!email) return;
    this.searching   = true;
    this.foundUser   = null;
    this.searchError = '';
    this.storeSvc.searchUserByEmail(email).pipe(
      finalize(() => this.searching = false)
    ).subscribe({
      next:  user => this.foundUser = user,
      error: ()   => this.searchError = 'No se encontró ningún usuario con ese correo.',
    });
  }

  clearUser() {
    this.foundUser   = null;
    this.searchError = '';
    this.searchEmail = '';
  }

  submitCreate() {
    const code = this.newCode().trim().toUpperCase();
    const pct  = parseFloat(this.newPct());
    if (!this.foundUser || !code || isNaN(pct) || pct <= 0 || pct > 100) {
      this.createError.set('Busca un usuario y completa todos los campos.');
      return;
    }
    this.createSaving.set(true);
    this.createError.set('');
    this.svc.createAmbassador({ userId: this.foundUser.id, referralCode: code, commissionPercentage: pct }).subscribe({
      next: amb => {
        this.ambassadors.update(list => [amb, ...list]);
        this.closeCreate();
        this.createSaving.set(false);
      },
      error: err => {
        const messages: Partial<Record<string, string>> = {
          AMBASSADOR_ALREADY_EXISTS:          'Este usuario ya es embajador.',
          AMBASSADOR_REFERRAL_CODE_DUPLICATE: 'Ese código ya está en uso, elige otro.',
          USER_PROFILE_NOT_FOUND:             'Este usuario todavía no tiene perfil activo.',
        };
        const code = apiCode(err);
        this.createError.set((code && messages[code]) || 'Error al crear embajador.');
        this.createSaving.set(false);
      },
    });
  }

  toggleStatus(amb: AmbassadorResponse) {
    const next = amb.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    this.svc.updateAmbassador(amb.ambassadorId, { status: next }).subscribe({
      next: updated => this.ambassadors.update(list => list.map(a => a.ambassadorId === updated.ambassadorId ? updated : a)),
    });
  }

  viewCommissions(amb: AmbassadorResponse) {
    this.selected.set(amb);
    this.commLoading.set(true);
    this.commissions.set([]);
    this.svc.getAmbassadorCommissions(amb.ambassadorId).subscribe({
      next: list => { this.commissions.set(list); this.commLoading.set(false); },
      error: ()   => this.commLoading.set(false),
    });
  }

  closeCommissions() { this.selected.set(null); this.commissions.set([]); }

  pay(comm: CommissionResponse) {
    if (!confirm('¿Marcar esta comisión como pagada? Esta acción no se puede deshacer desde aquí.')) return;
    this.payingId.set(comm.commissionId);
    this.svc.payCommission(comm.commissionId).subscribe({
      next: () => {
        this.commissions.update(list =>
          list.map(c => c.commissionId === comm.commissionId ? { ...c, status: 'PAID' as const } : c)
        );
        const amb = this.selected();
        if (amb) {
          this.ambassadors.update(list => list.map(a => a.ambassadorId === amb.ambassadorId
            ? { ...a, stats: {
                ...a.stats,
                pendingAmount: a.stats.pendingAmount - comm.commissionAmount,
                paidAmount:    a.stats.paidAmount + comm.commissionAmount,
              } }
            : a
          ));
        }
        this.payingId.set(null);
      },
      error: () => this.payingId.set(null),
    });
  }
}
