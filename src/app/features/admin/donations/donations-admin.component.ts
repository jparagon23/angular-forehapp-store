import { Component, inject, OnInit, signal } from '@angular/core';
import { NgFor, NgIf, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DonationService } from '../../../core/services/donation.service';
import {
  Foundation, CreateFoundationRequest, DonationRecord, DonationRecordPage,
} from '../../../core/models/donation.model';
import { AdminTopbarComponent } from '../shared/admin-topbar.component';
import { CurrencyCopPipe } from '../../../shared/pipes/currency-cop.pipe';

type AdminTab = 'foundations' | 'records';

@Component({
  selector: 'app-donations-admin',
  standalone: true,
  imports: [NgFor, NgIf, DatePipe, FormsModule, AdminTopbarComponent, CurrencyCopPipe],
  templateUrl: './donations-admin.component.html',
  styleUrl:    './donations-admin.component.scss',
})
export class DonationsAdminComponent implements OnInit {
  private svc = inject(DonationService);

  activeTab = signal<AdminTab>('foundations');

  // ── Foundations ──────────────────────────────────────────
  foundations    = signal<Foundation[]>([]);
  foundLoading   = signal(true);
  foundError     = signal('');

  creating       = signal(false);
  createError    = signal('');
  createSaving   = signal(false);
  newName        = signal('');
  newDescription = signal('');

  togglingId     = signal<number | null>(null);

  // ── Records ──────────────────────────────────────────────
  records         = signal<DonationRecord[]>([]);
  recLoading      = signal(true);
  recError        = signal('');
  recPage         = signal(0);
  recTotal        = signal(0);
  recTotalPages   = signal(0);
  filterFoundId   = signal<number | null>(null);
  payingId        = signal<number | null>(null);
  readonly recSize = 20;

  ngOnInit() {
    this.loadFoundations();
    this.loadRecords();
  }

  // ── Foundations ──────────────────────────────────────────
  loadFoundations() {
    this.foundLoading.set(true);
    this.svc.listFoundations().subscribe({
      next: list => { this.foundations.set(list); this.foundLoading.set(false); },
      error: ()   => { this.foundError.set('Error al cargar fundaciones'); this.foundLoading.set(false); },
    });
  }

  openCreate() { this.creating.set(true); this.createError.set(''); }

  closeCreate() {
    this.creating.set(false);
    this.newName.set('');
    this.newDescription.set('');
    this.createError.set('');
  }

  submitCreate() {
    const name = this.newName().trim();
    if (!name) { this.createError.set('El nombre es obligatorio.'); return; }
    const req: CreateFoundationRequest = { name, description: this.newDescription().trim() || undefined };
    this.createSaving.set(true);
    this.createError.set('');
    this.svc.createFoundation(req).subscribe({
      next: f => {
        this.foundations.update(list => [f, ...list]);
        this.closeCreate();
        this.createSaving.set(false);
      },
      error: err => {
        this.createError.set(err.error?.message ?? 'Error al crear la fundación.');
        this.createSaving.set(false);
      },
    });
  }

  toggleFoundationStatus(f: Foundation) {
    const next = f.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    this.togglingId.set(f.id);
    this.svc.updateFoundation(f.id, { status: next }).subscribe({
      next: updated => {
        this.foundations.update(list => list.map(x => x.id === updated.id ? updated : x));
        this.togglingId.set(null);
      },
      error: () => this.togglingId.set(null),
    });
  }

  // ── Records ──────────────────────────────────────────────
  loadRecords() {
    this.recLoading.set(true);
    this.recError.set('');
    const foundId = this.filterFoundId();
    const call = foundId
      ? this.svc.getRecordsByFoundation(foundId, this.recPage(), this.recSize)
      : this.svc.getAllRecords(this.recPage(), this.recSize);
    call.subscribe({
      next: (page: DonationRecordPage) => {
        this.records.set(page.content);
        this.recTotal.set(page.totalElements);
        this.recTotalPages.set(page.totalPages);
        this.recLoading.set(false);
      },
      error: () => { this.recError.set('Error al cargar registros'); this.recLoading.set(false); },
    });
  }

  onFilterChange(event: Event) {
    const val = (event.target as HTMLSelectElement).value;
    this.filterFoundId.set(val ? Number(val) : null);
    this.recPage.set(0);
    this.loadRecords();
  }

  recPrev() { if (this.recPage() > 0) { this.recPage.update(p => p - 1); this.loadRecords(); } }
  recNext() { if (this.recPage() + 1 < this.recTotalPages()) { this.recPage.update(p => p + 1); this.loadRecords(); } }

  payRecord(rec: DonationRecord) {
    this.payingId.set(rec.id);
    this.svc.payRecord(rec.id).subscribe({
      next: updated => {
        this.records.update(list => list.map(r => r.id === updated.id ? updated : r));
        this.payingId.set(null);
      },
      error: () => this.payingId.set(null),
    });
  }

  switchTab(tab: AdminTab) {
    this.activeTab.set(tab);
    if (tab === 'records') this.loadRecords();
  }
}
