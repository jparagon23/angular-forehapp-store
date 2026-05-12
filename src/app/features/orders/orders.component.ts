import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { take } from 'rxjs';
import { selectIsLoggedIn, selectAuthUser } from '../../store/auth/auth.selectors';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { CurrencyCopPipe } from '../../shared/pipes/currency-cop.pipe';

export interface MockOrderItem { emoji: string; name: string; qty: number; price: number; }
export interface MockOrder {
  id: string; date: string;
  status: 'Entregado' | 'En camino' | 'Procesando' | 'Cancelado';
  items: MockOrderItem[]; total: number; address: string;
}

const MOCK_ORDERS: MockOrder[] = [
  {
    id: 'FH-20260318-001', date: '18 de marzo, 2026', status: 'Entregado',
    address: 'Calle 93 #15-32, Bogotá',
    items: [
      { emoji: '🎾', name: 'Wilson Pro Staff 97 v14', qty: 1, price: 890000 },
      { emoji: '👟', name: 'Nike Air Zoom Vapor Pro 2', qty: 1, price: 620000 },
    ],
    total: 1510000,
  },
  {
    id: 'FH-20260405-002', date: '5 de abril, 2026', status: 'En camino',
    address: 'Calle 93 #15-32, Bogotá',
    items: [
      { emoji: '🏸', name: 'Babolat Pure Aero 2024', qty: 1, price: 980000 },
      { emoji: '🎽', name: 'Nike Court Dri-FIT Tee', qty: 2, price: 89000 },
    ],
    total: 1158000,
  },
  {
    id: 'FH-20260429-003', date: '29 de abril, 2026', status: 'Procesando',
    address: 'Calle 93 #15-32, Bogotá',
    items: [
      { emoji: '🎾', name: 'Wilson Tour Premier (x4)', qty: 4, price: 38000 },
      { emoji: '🧢', name: 'Head Performance Cap', qty: 1, price: 65000 },
    ],
    total: 217000,
  },
];

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [AsyncPipe, NgFor, NgIf, RouterLink, NavbarComponent, CurrencyCopPipe],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.scss',
})
export class OrdersComponent implements OnInit {
  private store  = inject(Store);
  private router = inject(Router);

  authUser$   = this.store.select(selectAuthUser);
  isLoggedIn$ = this.store.select(selectIsLoggedIn);
  orders      = MOCK_ORDERS;
  expanded    = new Set<string>();

  ngOnInit() {
    this.isLoggedIn$.pipe(take(1)).subscribe(loggedIn => {
      if (!loggedIn) this.router.navigate(['/login'], { queryParams: { redirect: '/orders' } });
    });
  }

  toggle(id: string) {
    this.expanded.has(id) ? this.expanded.delete(id) : this.expanded.add(id);
  }

  isExpanded(id: string) { return this.expanded.has(id); }

  statusClass(status: MockOrder['status']): string {
    return { 'Entregado': 'green', 'En camino': 'blue', 'Procesando': 'orange', 'Cancelado': 'red' }[status];
  }
}
