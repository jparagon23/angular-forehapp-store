import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { ReturnResponse, ReturnType } from '../../../core/models/return.model';
import { ReturnService } from '../../../core/services/return.service';
import { AdminTopbarComponent } from '../shared/admin-topbar.component';
import { CurrencyCopPipe } from '../../../shared/pipes/currency-cop.pipe';

@Component({
  selector: 'app-returns-admin',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, DatePipe, AdminTopbarComponent, CurrencyCopPipe],
  templateUrl: './returns-admin.component.html',
  styleUrl: './returns-admin.component.scss',
})
export class ReturnsAdminComponent implements OnInit {
  private returnService = inject(ReturnService);

  pendingReturns  = signal<ReturnResponse[]>([]);
  approvedReturns = signal<ReturnResponse[]>([]);
  loading         = signal(true);
  total           = signal(0);
  page            = signal(0);
  totalPages      = signal(0);
  readonly size   = 20;

  activeAction     = signal<{ returnId: number; mode: 'approve' | 'reject' } | null>(null);
  formRefundAmount = signal('');
  formAdminNotes   = signal('');
  formError        = signal('');
  processingId     = signal<number | null>(null);
  refundingId      = signal<number | null>(null);

  ngOnInit() { this.load(0); }

  load(page: number) {
    this.loading.set(true);
    this.returnService.getPendingReturns(page, this.size).subscribe({
      next: res => {
        this.pendingReturns.set(res.content);
        this.total.set(res.totalElements);
        this.page.set(res.number);
        this.totalPages.set(res.totalPages);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  setAction(returnId: number, mode: 'approve' | 'reject') {
    if (this.activeAction()?.returnId === returnId && this.activeAction()?.mode === mode) {
      this.clearAction();
      return;
    }
    this.activeAction.set({ returnId, mode });
    this.formRefundAmount.set('');
    this.formAdminNotes.set('');
    this.formError.set('');
  }

  clearAction() {
    this.activeAction.set(null);
    this.formError.set('');
  }

  onAmountInput(ev: Event) {
    this.formRefundAmount.set((ev.target as HTMLInputElement).value);
  }

  onNotesInput(ev: Event) {
    this.formAdminNotes.set((ev.target as HTMLTextAreaElement).value);
  }

  confirmApprove(ret: ReturnResponse) {
    const amount = parseFloat(this.formRefundAmount().replace(/\./g, '').replace(',', '.'));
    if (!amount || amount <= 0) {
      this.formError.set('Ingresa un monto válido mayor a cero.');
      return;
    }
    this.processingId.set(ret.returnId);
    this.returnService.approveReturn(ret.returnId, {
      refundAmount: amount,
      adminNotes: this.formAdminNotes().trim() || undefined,
    }).subscribe({
      next: updated => {
        this.pendingReturns.update(list => list.filter(r => r.returnId !== ret.returnId));
        this.total.update(n => n - 1);
        this.approvedReturns.update(list => [updated, ...list]);
        this.processingId.set(null);
        this.clearAction();
      },
      error: err => {
        this.formError.set(err?.error?.message || 'Error al aprobar la devolución.');
        this.processingId.set(null);
      },
    });
  }

  confirmReject(ret: ReturnResponse) {
    if (!this.formAdminNotes().trim()) {
      this.formError.set('El motivo del rechazo es obligatorio para que el comprador lo vea.');
      return;
    }
    this.processingId.set(ret.returnId);
    this.returnService.rejectReturn(ret.returnId, { adminNotes: this.formAdminNotes().trim() }).subscribe({
      next: () => {
        this.pendingReturns.update(list => list.filter(r => r.returnId !== ret.returnId));
        this.total.update(n => n - 1);
        this.processingId.set(null);
        this.clearAction();
      },
      error: err => {
        this.formError.set(err?.error?.message || 'Error al rechazar la devolución.');
        this.processingId.set(null);
      },
    });
  }

  markRefunded(returnId: number) {
    this.refundingId.set(returnId);
    this.returnService.markRefunded(returnId).subscribe({
      next: () => {
        this.approvedReturns.update(list => list.filter(r => r.returnId !== returnId));
        this.refundingId.set(null);
      },
      error: () => this.refundingId.set(null),
    });
  }

  prevPage() { if (this.page() > 0) this.load(this.page() - 1); }
  nextPage() { if (this.page() < this.totalPages() - 1) this.load(this.page() + 1); }

  returnTypeLabel(type: ReturnType): string {
    const labels: Record<ReturnType, string> = {
      DEVOLUCION:         'Devolución física',
      REEMBOLSO_PARCIAL:  'Reembolso parcial',
      REEMBOLSO_COMPLETO: 'Reembolso completo',
    };
    return labels[type];
  }

  calcEstimatedTotal(ret: ReturnResponse): number {
    return ret.items.reduce((s, i) => s + i.subtotal, 0);
  }
}
