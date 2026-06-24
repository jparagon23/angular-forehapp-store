import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminTopbarComponent } from '../shared/admin-topbar.component';
import { ToastComponent } from '../../../shared/components/toast/toast.component';
import { CatalogRequestService } from '../../../core/services/catalog-request.service';
import { CatalogRequestResponse, CatalogRequestType } from '../../../core/models/catalog-request.model';

type StatusTab = 'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL';

@Component({
  selector: 'app-catalog-requests-admin',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, DatePipe, FormsModule, AdminTopbarComponent, ToastComponent],
  templateUrl: './catalog-requests-admin.component.html',
  styleUrl:    './catalog-requests-admin.component.scss',
})
export class CatalogRequestsAdminComponent implements OnInit {
  private svc = inject(CatalogRequestService);

  loading    = signal(true);
  error      = signal('');
  requests   = signal<CatalogRequestResponse[]>([]);
  activeTab  = signal<StatusTab>('PENDING');
  typeFilter = signal<CatalogRequestType | ''>('');

  approving   = signal<number | null>(null);
  rejectModal = signal<CatalogRequestResponse | null>(null);
  rejectReason = signal('');
  rejecting   = signal(false);
  rejectError = signal('');

  toastMsg  = signal('');
  toastType = signal<'success' | 'error'>('success');

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    const status = this.activeTab() !== 'ALL' ? this.activeTab() : undefined;
    const type   = this.typeFilter() || undefined;
    this.svc.adminGetRequests(status, type as CatalogRequestType | undefined).subscribe({
      next: list => { this.requests.set(list); this.loading.set(false); },
      error: ()   => { this.error.set('Error al cargar las solicitudes.'); this.loading.set(false); },
    });
  }

  setTab(tab: StatusTab) { this.activeTab.set(tab); this.load(); }
  applyTypeFilter()       { this.load(); }

  typeLabel(type: CatalogRequestType): string {
    return type === 'BRAND' ? 'Marca' : 'Categoría';
  }

  approve(r: CatalogRequestResponse) {
    if (!confirm(`¿Aprobar la solicitud de ${this.typeLabel(r.type)} "${r.suggestedName}"? Se creará en el catálogo.`)) return;
    this.approving.set(r.id);
    this.svc.adminApprove(r.id).subscribe({
      next: updated => {
        this.requests.update(list => list.map(x => x.id === updated.id ? updated : x));
        this.approving.set(null);
        this.toastMsg.set(`${this.typeLabel(r.type)} "${r.suggestedName}" creada y disponible.`);
        this.toastType.set('success');
        if (this.activeTab() === 'PENDING') {
          this.requests.update(list => list.filter(x => x.id !== updated.id));
        }
      },
      error: err => {
        const code: string = err.error?.errorCode ?? '';
        const msg = code === 'CATALOG_REQUEST_NOT_PENDING'
          ? 'Esta solicitud ya fue resuelta.'
          : (err.error?.message ?? 'Error al aprobar.');
        this.toastMsg.set(msg);
        this.toastType.set('error');
        this.approving.set(null);
      },
    });
  }

  openRejectModal(r: CatalogRequestResponse) {
    this.rejectModal.set(r);
    this.rejectReason.set('');
    this.rejectError.set('');
  }

  closeRejectModal() { this.rejectModal.set(null); }

  submitReject() {
    const r = this.rejectModal();
    if (!r) return;
    this.rejecting.set(true);
    this.rejectError.set('');
    this.svc.adminReject(r.id, this.rejectReason() || undefined).subscribe({
      next: updated => {
        this.requests.update(list => list.map(x => x.id === updated.id ? updated : x));
        if (this.activeTab() === 'PENDING') {
          this.requests.update(list => list.filter(x => x.id !== updated.id));
        }
        this.rejecting.set(false);
        this.closeRejectModal();
        this.toastMsg.set(`Solicitud de "${r.suggestedName}" rechazada.`);
        this.toastType.set('success');
      },
      error: err => {
        const code: string = err.error?.errorCode ?? '';
        this.rejectError.set(
          code === 'CATALOG_REQUEST_NOT_PENDING'
            ? 'Esta solicitud ya fue resuelta.'
            : (err.error?.message ?? 'Error al rechazar.')
        );
        this.rejecting.set(false);
      },
    });
  }
}
