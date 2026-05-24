import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DateRange, GroupBy, ReportSummary, RevenuePoint, SellerSales, TopProduct } from '../models/report.model';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly BASE = environment.apiBaseUrl;
  private http = inject(HttpClient);

  getAdminSummary(range: DateRange): Observable<ReportSummary> {
    return this.http.get<ReportSummary>(`${this.BASE}/admin/reports/summary`, {
      params: { from: range.from, to: range.to },
    });
  }

  getAdminRevenue(range: DateRange, groupBy: GroupBy): Observable<RevenuePoint[]> {
    return this.http.get<RevenuePoint[]>(`${this.BASE}/admin/reports/revenue`, {
      params: { from: range.from, to: range.to, groupBy },
    });
  }

  getAdminTopProducts(range: DateRange, limit = 10): Observable<TopProduct[]> {
    return this.http.get<TopProduct[]>(`${this.BASE}/admin/reports/top-products`, {
      params: { from: range.from, to: range.to, limit: String(limit) },
    });
  }

  getAdminSellers(range: DateRange): Observable<SellerSales[]> {
    return this.http.get<SellerSales[]>(`${this.BASE}/admin/reports/sellers`, {
      params: { from: range.from, to: range.to },
    });
  }

  getSellerSummary(storeId: number, range: DateRange): Observable<ReportSummary> {
    return this.http.get<ReportSummary>(`${this.BASE}/stores/${storeId}/reports/summary`, {
      params: { from: range.from, to: range.to },
    });
  }

  getSellerTopProducts(storeId: number, range: DateRange, limit = 10): Observable<TopProduct[]> {
    return this.http.get<TopProduct[]>(`${this.BASE}/stores/${storeId}/reports/top-products`, {
      params: { from: range.from, to: range.to, limit: String(limit) },
    });
  }
}
