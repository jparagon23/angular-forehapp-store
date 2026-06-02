import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserStats } from '../models/user-stats.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UserStatsService {
  private http = inject(HttpClient);
  private base = environment.apiBaseUrl;

  getStats(): Observable<UserStats> {
    return this.http.get<UserStats>(`${this.base}/admin/users/stats`);
  }
}
