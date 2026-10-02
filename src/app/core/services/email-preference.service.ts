import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface EmailPreferenceResponse {
  /** Correo enmascarado (ej: j***@gmail.com); el backend nunca devuelve el correo completo. */
  email: string;
  subscribed: boolean;
}

@Injectable({ providedIn: 'root' })
export class EmailPreferenceService {
  private http = inject(HttpClient);
  private base = `${environment.apiBaseUrl}/email-preferences`;

  unsubscribe(token: string): Observable<EmailPreferenceResponse> {
    return this.http.post<EmailPreferenceResponse>(`${this.base}/unsubscribe`, { token });
  }

  resubscribe(token: string): Observable<EmailPreferenceResponse> {
    return this.http.post<EmailPreferenceResponse>(`${this.base}/resubscribe`, { token });
  }
}
