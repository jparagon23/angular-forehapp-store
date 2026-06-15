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
    this.svc.createAmbassador({ profileId: this.foundUser.id, referralCode: code, commissionPercentage: pct }).subscribe({
      next: amb => {
        this.ambassadors.update(list => [amb, ...list]);
        this.closeCreate();
        this.createSaving.set(false);
      },
      error: err => {
        const msg = err.error?.message ?? '';
        this.createError.set(err.status === 409
          ? (msg || 'Ya existe un embajador con ese código o perfil.')
          : 'Error al crear embajador.');
        this.createSaving.set(false);
      },
    });
  }

  toggleStatus(amb: AmbassadorResponse) {
    const next = amb.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    this.svc.updateAmbassador(amb.id, { status: next }).subscribe({
      next: updated => this.ambassadors.update(list => list.map(a => a.id === updated.id ? updated : a)),
    });
  }

  viewCommissions(amb: AmbassadorResponse) {
    this.selected.set(amb);
    this.commLoading.set(true);
    this.commissions.set([]);
    this.svc.getAmbassadorCommissions(amb.id).subscribe({
      next: list => { this.commissions.set(list); this.commLoading.set(false); },
      error: ()   => this.commLoading.set(false),
    });
  }

  closeCommissions() { this.selected.set(null); this.commissions.set([]); }

  pay(comm: CommissionResponse) {
    this.payingId.set(comm.id);
    this.svc.payCommission(comm.id).subscribe({
      next: () => {
        this.commissions.update(list =>
          list.map(c => c.id === comm.id ? { ...c, status: 'PAID' as const } : c)
        );
        const amb = this.selected();
        if (amb) {
          this.ambassadors.update(list => list.map(a => a.id === amb.id
            ? { ...a, pendingAmount: a.pendingAmount - comm.commissionAmount, paidAmount: a.paidAmount + comm.commissionAmount }
            : a
          ));
        }
        this.payingId.set(null);
      },
      error: () => this.payingId.set(null),
    });
  }
}
