import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateStoreRequest, InviteMemberRequest, MyStore,
  Store, StoreMember, StoreRole, UpdateStoreRequest, UserSearchResult,
} from '../models/store.model';

@Injectable({ providedIn: 'root' })
export class StoreService {
  private readonly BASE = environment.apiBaseUrl;
  private http = inject(HttpClient);

  createStore(req: CreateStoreRequest): Observable<Store> {
    return this.http.post<Store>(`${this.BASE}/stores`, req);
  }

  getMyStores(): Observable<MyStore[]> {
    return this.http.get<MyStore[]>(`${this.BASE}/stores/my`);
  }

  getStore(storeId: number): Observable<Store> {
    return this.http.get<Store>(`${this.BASE}/stores/${storeId}`);
  }

  updateStore(storeId: number, req: UpdateStoreRequest): Observable<Store> {
    return this.http.patch<Store>(`${this.BASE}/stores/${storeId}`, req);
  }

  getMembers(storeId: number): Observable<StoreMember[]> {
    return this.http.get<StoreMember[]>(`${this.BASE}/stores/${storeId}/members`);
  }

  inviteMember(storeId: number, req: InviteMemberRequest): Observable<StoreMember> {
    return this.http.post<StoreMember>(`${this.BASE}/stores/${storeId}/members`, req);
  }

  changeMemberRole(storeId: number, membershipId: number, role: StoreRole): Observable<StoreMember> {
    return this.http.patch<StoreMember>(`${this.BASE}/stores/${storeId}/members/${membershipId}/role`, { role });
  }

  removeMember(storeId: number, membershipId: number): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/stores/${storeId}/members/${membershipId}`);
  }

  searchUserByEmail(email: string): Observable<UserSearchResult> {
    return this.http.get<UserSearchResult>(`${this.BASE}/users/search`, { params: { email } });
  }
}
