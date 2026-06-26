import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AmbassadorMeResponse,
  AmbassadorResponse,
  CommissionResponse,
  CreateAmbassadorRequest,
  ReferralValidationResponse,
  UpdateAmbassadorRequest,
} from '../models/ambassador.model';

@Injectable({ providedIn: 'root' })
export class AmbassadorService {
  private http = inject(HttpClient);
  private base = environment.apiBaseUrl;

  // ── Admin ────────────────────────────────────────────────────────────────

  createAmbassador(req: CreateAmbassadorRequest): Observable<AmbassadorResponse> {
    return this.http.post<AmbassadorResponse>(`${this.base}/admin/ambassadors`, req);
  }

  listAmbassadors(): Observable<AmbassadorResponse[]> {
    return this.http.get<AmbassadorResponse[]>(`${this.base}/admin/ambassadors`);
  }

  getAmbassador(id: number): Observable<AmbassadorResponse> {
    return this.http.get<AmbassadorResponse>(`${this.base}/admin/ambassadors/${id}`);
  }

  updateAmbassador(id: number, req: UpdateAmbassadorRequest): Observable<AmbassadorResponse> {
    return this.http.put<AmbassadorResponse>(`${this.base}/admin/ambassadors/${id}`, req);
  }

  getAmbassadorCommissions(id: number): Observable<CommissionResponse[]> {
    return this.http.get<CommissionResponse[]>(`${this.base}/admin/ambassadors/${id}/commissions`);
  }

  payCommission(commissionId: number): Observable<void> {
    return this.http.put<void>(`${this.base}/admin/ambassadors/commissions/${commissionId}/pay`, {});
  }

  // ── Ambassador self ───────────────────────────────────────────────────────

  getMe(): Observable<AmbassadorMeResponse> {
    return this.http.get<AmbassadorMeResponse>(`${this.base}/ambassadors/me`);
  }

  getMyCommissions(): Observable<CommissionResponse[]> {
    return this.http.get<CommissionResponse[]>(`${this.base}/ambassadors/me/commissions`);
  }

  validateReferralCode(code: string): Observable<ReferralValidationResponse> {
    return this.http.get<ReferralValidationResponse>(`${this.base}/ambassadors/validate`, { params: { code } });
  }
}
