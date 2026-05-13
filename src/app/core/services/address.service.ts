import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Address, CreateAddressRequest, UpdateAddressRequest } from '../models/address.model';

@Injectable({ providedIn: 'root' })
export class AddressService {
  private readonly BASE = environment.apiBaseUrl;
  private http = inject(HttpClient);

  getAddresses(): Observable<Address[]> {
    return this.http.get<Address[]>(`${this.BASE}/users/me/addresses`);
  }

  createAddress(req: CreateAddressRequest): Observable<Address> {
    return this.http.post<Address>(`${this.BASE}/users/me/addresses`, req);
  }

  updateAddress(id: number, req: UpdateAddressRequest): Observable<Address> {
    return this.http.patch<Address>(`${this.BASE}/users/me/addresses/${id}`, req);
  }

  deleteAddress(id: number): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/users/me/addresses/${id}`);
  }

  setDefaultAddress(id: number): Observable<Address> {
    return this.http.patch<Address>(`${this.BASE}/users/me/addresses/${id}/default`, {});
  }
}
