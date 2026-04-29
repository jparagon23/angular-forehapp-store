import { Component, Input } from '@angular/core';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-admin-topbar',
  standalone: true,
  imports: [DatePipe],
  template: `
    <div class="topbar">
      <h1>{{ title }}</h1>
      <div class="topbar-right">
        <span class="date">{{ today | date:'EEEE, d MMMM y':'':'es' }}</span>
        <div class="admin-chip">👤 Administrador</div>
      </div>
    </div>
  `,
  styles: [`
    .topbar {
      background: #fff; border-bottom: 1px solid var(--border);
      padding: 16px 32px; display: flex; align-items: center;
      justify-content: space-between; position: sticky; top: 0; z-index: 40;
    }
    h1 { font-size: 1.2rem; font-weight: 800; color: var(--dark); }
    .topbar-right { display: flex; align-items: center; gap: 16px; }
    .date { font-size: .85rem; color: var(--muted); }
    .admin-chip {
      background: #edf7ea; color: var(--green-dark);
      border: 1px solid #c3e6b0; padding: 6px 14px;
      border-radius: 20px; font-size: .82rem; font-weight: 700;
    }
  `]
})
export class AdminTopbarComponent {
  @Input() title = '';
  today = new Date();
}
