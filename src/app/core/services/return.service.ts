import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApproveReturnRequest,
  CreateReturnRequest,
  RejectReturnRequest,
  ReturnPageResponse,
  ReturnResponse,
} from '../models/return.model';

@Injectable({ providedIn: 'root' })
export class ReturnService {
  private http = inject(HttpClient);
  private base = environment.apiBaseUrl;

  createReturn(req: CreateReturnRequest): Observable<ReturnResponse> {
    return this.http.post<ReturnResponse>(`${this.base}/returns`, req);
  }

  getMyReturns(): Observable<ReturnResponse[]> {
    return this.http.get<ReturnResponse[]>(`${this.base}/returns/my`);
  }

  getReturnById(returnId: number): Observable<ReturnResponse> {
    return this.http.get<ReturnResponse>(`${this.base}/returns/${returnId}`);
  }

  getPendingReturns(page = 0, size = 20): Observable<ReturnPageResponse> {
    return this.http.get<ReturnPageResponse>(
      `${this.base}/admin/returns/pending`, { params: { page, size } }
    );
  }

  approveReturn(returnId: number, req: ApproveReturnRequest): Observable<ReturnResponse> {
    return this.http.patch<ReturnResponse>(`${this.base}/admin/returns/${returnId}/approve`, req);
  }

  rejectReturn(returnId: number, req: RejectReturnRequest): Observable<ReturnResponse> {
    return this.http.patch<ReturnResponse>(`${this.base}/admin/returns/${returnId}/reject`, req);
  }

  markRefunded(returnId: number): Observable<ReturnResponse> {
    return this.http.patch<ReturnResponse>(`${this.base}/admin/returns/${returnId}/refunded`, {});
  }
}
