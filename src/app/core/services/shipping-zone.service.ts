import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateShippingZoneRequest, ShippingZone, UpdateShippingZoneRequest } from '../models/shipping-zone.model';

@Injectable({ providedIn: 'root' })
export class ShippingZoneService {
  private readonly BASE = environment.apiBaseUrl;
  private http = inject(HttpClient);

  getZones(): Observable<ShippingZone[]> {
    return this.http.get<ShippingZone[]>(`${this.BASE}/admin/shipping-zones`);
  }

  createZone(req: CreateShippingZoneRequest): Observable<ShippingZone> {
    return this.http.post<ShippingZone>(`${this.BASE}/admin/shipping-zones`, req);
  }

  updateZone(zoneId: number, req: UpdateShippingZoneRequest): Observable<ShippingZone> {
    return this.http.patch<ShippingZone>(`${this.BASE}/admin/shipping-zones/${zoneId}`, req);
  }

  deleteZone(zoneId: number): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/admin/shipping-zones/${zoneId}`);
  }
}
