import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Foundation, CreateFoundationRequest, UpdateFoundationRequest,
  DonationRecord, DonationRecordPage,
} from '../models/donation.model';

@Injectable({ providedIn: 'root' })
export class DonationService {
  private http = inject(HttpClient);
  private base = environment.apiBaseUrl;

  createFoundation(req: CreateFoundationRequest): Observable<Foundation> {
    return this.http.post<Foundation>(`${this.base}/admin/donations/foundations`, req);
  }

  listFoundations(): Observable<Foundation[]> {
    return this.http.get<Foundation[]>(`${this.base}/admin/donations/foundations`);
  }

  getFoundation(id: number): Observable<Foundation> {
    return this.http.get<Foundation>(`${this.base}/admin/donations/foundations/${id}`);
  }

  updateFoundation(id: number, req: UpdateFoundationRequest): Observable<Foundation> {
    return this.http.patch<Foundation>(`${this.base}/admin/donations/foundations/${id}`, req);
  }

  getAllRecords(page = 0, size = 20): Observable<DonationRecordPage> {
    return this.http.get<DonationRecordPage>(`${this.base}/admin/donations/records`, {
      params: { page: page.toString(), size: size.toString() },
    });
  }

  getRecordsByFoundation(foundationId: number, page = 0, size = 20): Observable<DonationRecordPage> {
    return this.http.get<DonationRecordPage>(`${this.base}/admin/donations/records/foundations/${foundationId}`, {
      params: { page: page.toString(), size: size.toString() },
    });
  }

  payRecord(recordId: number): Observable<DonationRecord> {
    return this.http.patch<DonationRecord>(`${this.base}/admin/donations/records/${recordId}/pay`, {});
  }
}
