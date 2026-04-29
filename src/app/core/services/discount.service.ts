import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Discount } from '../models/discount.model';

const MOCK_DISCOUNTS: Discount[] = [
  { code: 'TENIS20',    type: '%',   val: 20,    scope: 'Toda la tienda', uses: 100, used: 34, from: '01/04/2026', to: '30/04/2026', active: true },
  { code: 'RAQUETA10',  type: '%',   val: 10,    scope: 'Raquetas',       uses: 50,  used: 12, from: '15/04/2026', to: '15/05/2026', active: true },
  { code: 'BIENVENIDA', type: 'COP', val: 30000, scope: 'Toda la tienda', uses: 200, used: 89, from: '01/01/2026', to: '31/12/2026', active: true },
  { code: 'VIP30',      type: '%',   val: 30,    scope: 'Toda la tienda', uses: 20,  used: 20, from: '01/03/2026', to: '31/03/2026', active: false },
];

@Injectable({ providedIn: 'root' })
export class DiscountService {
  getDiscounts(): Observable<Discount[]> {
    return of(MOCK_DISCOUNTS);
  }

  createDiscount(discount: Discount): Observable<Discount> {
    return of(discount);
  }

  toggleDiscount(code: string): Observable<string> {
    return of(code);
  }

  deleteDiscount(code: string): Observable<string> {
    return of(code);
  }
}
