import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CatalogRequestResponse, CatalogRequestStatus,
  CatalogRequestType, CreateCatalogRequestDto,
} from '../models/catalog-request.model';

@Injectable({ providedIn: 'root' })
export class CatalogRequestService {
  private http = inject(HttpClient);
  private base = environment.apiBaseUrl;

  // ── Seller endpoints ─────────────────────────────────────────
  createRequest(storeId: number, dto: CreateCatalogRequestDto): Observable<CatalogRequestResponse> {
    return this.http.post<CatalogRequestResponse>(`${this.base}/stores/${storeId}/catalog-requests`, dto);
  }

  getMyRequests(storeId: number, status?: CatalogRequestStatus): Observable<CatalogRequestResponse[]> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    return this.http.get<CatalogRequestResponse[]>(`${this.base}/stores/${storeId}/catalog-requests`, { params });
  }

  cancelRequest(storeId: number, requestId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/stores/${storeId}/catalog-requests/${requestId}`);
  }

  // ── Admin endpoints ──────────────────────────────────────────
  adminGetRequests(status?: string, type?: CatalogRequestType): Observable<CatalogRequestResponse[]> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    if (type)   params = params.set('type', type);
    return this.http.get<CatalogRequestResponse[]>(`${this.base}/admin/catalog-requests`, { params });
  }

  adminApprove(requestId: number): Observable<CatalogRequestResponse> {
    return this.http.patch<CatalogRequestResponse>(`${this.base}/admin/catalog-requests/${requestId}/approve`, {});
  }

  adminReject(requestId: number, reason?: string): Observable<CatalogRequestResponse> {
    const body = reason?.trim() ? { reason: reason.trim() } : {};
    return this.http.patch<CatalogRequestResponse>(`${this.base}/admin/catalog-requests/${requestId}/reject`, body);
  }
}
