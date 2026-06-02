import { Component, inject, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { AsyncPipe, DatePipe, NgFor, NgIf } from '@angular/common';
import { loadUserStats } from '../../../store/user-stats/user-stats.actions';
import { selectUserStats, selectUserStatsLoading, selectUserStatsError } from '../../../store/user-stats/user-stats.selectors';
import { AdminTopbarComponent } from '../shared/admin-topbar.component';
import { RegistrationTrend } from '../../../core/models/user-stats.model';

@Component({
  selector: 'app-users-admin',
  standalone: true,
  imports: [AsyncPipe, DatePipe, NgFor, NgIf, AdminTopbarComponent],
  templateUrl: './users-admin.component.html',
  styleUrl: './users-admin.component.scss',
})
export class UsersAdminComponent implements OnInit {
  private store = inject(Store);
  stats$ = this.store.select(selectUserStats);
  loading$ = this.store.select(selectUserStatsLoading);
  error$ = this.store.select(selectUserStatsError);

  ngOnInit() { this.store.dispatch(loadUserStats()); }

  trendMax(trend: RegistrationTrend[]): number {
    return Math.max(...trend.map(t => t.count), 1);
  }

  barWidth(count: number, max: number): number {
    return Math.round((count / max) * 100);
  }
}
