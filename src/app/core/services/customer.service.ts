import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Customer } from '../models/customer.model';

const MOCK_CUSTOMERS: Customer[] = [
  { name: 'Carlos M.',    email: 'carlos@email.com', orders: 7,  total: '$2.1M', last: '22/04/2026', vip: true },
  { name: 'Daniela R.',   email: 'dani@email.com',   orders: 3,  total: '$890K', last: '22/04/2026', vip: false },
  { name: 'Jorge P.',     email: 'jorge@email.com',  orders: 12, total: '$4.3M', last: '21/04/2026', vip: true },
  { name: 'Ana G.',       email: 'ana@email.com',    orders: 2,  total: '$465K', last: '21/04/2026', vip: false },
  { name: 'Luis T.',      email: 'luis@email.com',   orders: 5,  total: '$1.4M', last: '20/04/2026', vip: false },
  { name: 'Valentina C.', email: 'vale@email.com',   orders: 8,  total: '$2.7M', last: '20/04/2026', vip: true },
  { name: 'Felipe A.',    email: 'felipe@email.com', orders: 4,  total: '$1.1M', last: '19/04/2026', vip: false },
  { name: 'Marta S.',     email: 'marta@email.com',  orders: 6,  total: '$1.8M', last: '18/04/2026', vip: true },
];

@Injectable({ providedIn: 'root' })
export class CustomerService {
  getCustomers(): Observable<Customer[]> {
    return of(MOCK_CUSTOMERS);
  }
}
