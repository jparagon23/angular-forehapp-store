import { Component, effect, inject, signal } from '@angular/core';
import { DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { CatalogRequestService } from '../../../core/services/catalog-request.service';
import { CatalogRequestResponse, CatalogRequestStatus } from '../../../core/models/catalog-request.model';
import { selectActiveSellerStoreId } from '../../../store/seller/seller.selectors';
import { ToastComponent } from '../../../shared/components/toast/toast.component';

type FilterTab = 'ALL' | CatalogRequestStatus;

@Component({
  selector: 'app-seller-catalog-requests',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, DatePipe, ToastComponent],
  templateUrl: './seller-catalog-requests.component.html',
  styleUrl:    './seller-catalog-requests.component.scss',
})
export class SellerCatalogRequestsComponent {
  private svc     = inject(CatalogRequestService);
  private ngrx    = inject(Store);
  private storeId = toSignal(this.ngrx.select(selectActiveSellerStoreId), { initialValue: null });

  loading    = signal(true);
  error      = signal('');
  requests   = signal<CatalogRequestResponse[]>([]);
  activeTab  = signal<FilterTab>('ALL');
  canceling  = signal<number | null>(null);
  toastMsg   = signal('');
  toastType  = signal<'success' | 'error'>('success');

  constructor() {
    effect(() => { if (this.storeId()) this.load(); }, { allowSignalWrites: true });
  }

  load() {
    const storeId = this.storeId();
    if (!storeId) { this.loading.set(false); return; }
    this.loading.set(true);
    const status = this.activeTab() !== 'ALL' ? this.activeTab() as CatalogRequestStatus : undefined;
    this.svc.getMyRequests(storeId, status).subscribe({
      next: list => { this.requests.set(list); this.loading.set(false); },
      error: ()   => { this.error.set('Error al cargar las solicitudes.'); this.loading.set(false); },
    });
  }

  setTab(tab: FilterTab) {
    this.activeTab.set(tab);
    this.load();
  }

  typeLabel(r: CatalogRequestResponse): string {
    return r.type === 'BRAND' ? 'Marca' : 'Categoría';
  }

  cancel(r: CatalogRequestResponse) {
    if (!confirm(`¿Cancelar la solicitud de ${this.typeLabel(r)} "${r.suggestedName}"?`)) return;
    const storeId = this.storeId();
    if (!storeId) return;
    this.canceling.set(r.id);
    this.svc.cancelRequest(storeId, r.id).subscribe({
      next: () => {
        this.requests.update(list => list.filter(x => x.id !== r.id));
        this.canceling.set(null);
        this.toastMsg.set('Solicitud cancelada.');
        this.toastType.set('success');
      },
      error: err => {
        const code: string = err.error?.errorCode ?? '';
        const msg = code === 'CATALOG_REQUEST_NOT_PENDING'
          ? 'Esta solicitud ya fue resuelta y no puede cancelarse.'
          : (err.error?.message ?? 'Error al cancelar la solicitud.');
        this.toastMsg.set(msg);
        this.toastType.set('error');
        this.canceling.set(null);
      },
    });
  }
}
