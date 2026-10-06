import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  SupplierItem, SupplierLink, SupplierLinkFilter, SyncConfig, SyncEvent, SyncMode, SyncRun,
} from '../models/supplier-sync.model';

/** Sincronización de una tienda con un proveedor (hoy solo Profitness). */
@Injectable({ providedIn: 'root' })
export class SupplierSyncService {
  private http = inject(HttpClient);
  private supplier = 'profitness';

  private base(storeId: number): string {
    return `${environment.apiBaseUrl}/stores/${storeId}/supplier-sync/${this.supplier}`;
  }

  getConfig(storeId: number): Observable<SyncConfig> {
    return this.http.get<SyncConfig>(`${this.base(storeId)}/config`);
  }

  updateConfig(storeId: number, enabled: boolean, mode: SyncMode): Observable<SyncConfig> {
    return this.http.put<SyncConfig>(`${this.base(storeId)}/config`, { enabled, mode });
  }

  getLinks(storeId: number, status: SupplierLinkFilter): Observable<SupplierLink[]> {
    return this.http.get<SupplierLink[]>(`${this.base(storeId)}/links`, { params: { status } });
  }

  confirmLinks(storeId: number, linkIds: number[]): Observable<SupplierLink[]> {
    return this.http.post<SupplierLink[]>(`${this.base(storeId)}/links/confirm`, { linkIds });
  }

  rejectLink(storeId: number, linkId: number): Observable<void> {
    return this.http.post<void>(`${this.base(storeId)}/links/${linkId}/reject`, {});
  }

  linkManually(storeId: number, variantId: number, supplierItemId: number): Observable<SupplierLink> {
    return this.http.put<SupplierLink>(`${this.base(storeId)}/variants/${variantId}/link`, { supplierItemId });
  }

  markNotSupplied(storeId: number, variantId: number): Observable<void> {
    return this.http.put<void>(`${this.base(storeId)}/variants/${variantId}/not-supplied`, {});
  }

  unlink(storeId: number, variantId: number): Observable<void> {
    return this.http.delete<void>(`${this.base(storeId)}/variants/${variantId}/link`);
  }

  searchItems(storeId: number, q: string): Observable<SupplierItem[]> {
    return this.http.get<SupplierItem[]>(`${this.base(storeId)}/items`, { params: { q } });
  }

  getRuns(storeId: number, limit = 10): Observable<SyncRun[]> {
    return this.http.get<SyncRun[]>(`${this.base(storeId)}/runs`, { params: { limit } });
  }

  getRunEvents(storeId: number, runId: number): Observable<SyncEvent[]> {
    return this.http.get<SyncEvent[]>(`${this.base(storeId)}/runs/${runId}/events`);
  }
}
