import { Component } from '@angular/core';
import { NgFor } from '@angular/common';
import { AdminTopbarComponent } from '../shared/admin-topbar.component';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [NgFor, AdminTopbarComponent],
  templateUrl: './analytics.component.html',
  styleUrl: './analytics.component.scss',
})
export class AnalyticsComponent {
  kpis = [
    { icon: '💰', val: '$47.2M', label: 'Ingresos año a la fecha', badge: '▲ 18%', up: true },
    { icon: '🛒', val: '$62,800', label: 'Ticket promedio',         badge: '▲ 11%', up: true },
    { icon: '🔁', val: '31%',    label: 'Clientes recurrentes',    badge: '▲ 4%',  up: true },
    { icon: '📉', val: '14%',    label: 'Tasa de abandono',        badge: '▲ 1%',  up: false },
  ];
}
