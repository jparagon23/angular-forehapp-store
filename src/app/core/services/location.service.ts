import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { City, Country, State } from '../models/location.model';

@Injectable({ providedIn: 'root' })
export class LocationService {
  private readonly BASE = environment.apiBaseUrl;
  private http = inject(HttpClient);

  getCountries(): Observable<Country[]> {
    return this.http.get<Country[]>(`${this.BASE}/locations/countries`);
  }

  getStates(countryId: number): Observable<State[]> {
    return this.http.get<State[]>(`${this.BASE}/locations/countries/${countryId}/states`);
  }

  getCities(stateId: number): Observable<City[]> {
    return this.http.get<City[]>(`${this.BASE}/locations/states/${stateId}/cities`);
  }
}
