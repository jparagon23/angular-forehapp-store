import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, catchError, debounceTime, distinctUntilChanged, map, of, switchMap, tap } from 'rxjs';
import { Store } from '@ngrx/store';
import { AsyncPipe, DatePipe, NgFor, NgIf } from '@angular/common';
import { loadUserStats } from '../../../store/user-stats/user-stats.actions';
import { selectUserStats, selectUserStatsLoading, selectUserStatsError } from '../../../store/user-stats/user-stats.selectors';
import { AdminTopbarComponent } from '../shared/admin-topbar.component';
import { RegistrationTrend, UserSearchResult } from '../../../core/models/user-stats.model';
import { UserStatsService } from '../../../core/services/user-stats.service';

const SEARCH_MIN_LENGTH = 2;

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

  private userStatsService = inject(UserStatsService);
  private destroyRef = inject(DestroyRef);
  private searchTerms = new Subject<string>();

  searchQuery = signal('');
  searchResults = signal<UserSearchResult[] | null>(null);
  searching = signal(false);
  searchError = signal(false);
  copiedId = signal<number | null>(null);

  ngOnInit() {
    this.store.dispatch(loadUserStats());

    this.searchTerms.pipe(
      map(q => q.trim()),
      debounceTime(300),
      distinctUntilChanged(),
      tap(q => {
        this.searchError.set(false);
        this.searching.set(q.length >= SEARCH_MIN_LENGTH);
      }),
      switchMap(q => q.length < SEARCH_MIN_LENGTH
        ? of(null)
        : this.userStatsService.search(q).pipe(
            catchError(() => {
              this.searchError.set(true);
              return of([] as UserSearchResult[]);
            }),
          )),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(results => {
      this.searching.set(false);
      this.searchResults.set(results);
    });
  }

  onSearch(value: string) {
    this.searchQuery.set(value);
    this.searchTerms.next(value);
  }

  clearSearch() {
    this.onSearch('');
  }

  copyEmail(user: UserSearchResult) {
    navigator.clipboard?.writeText(user.email).then(() => {
      this.copiedId.set(user.id);
      setTimeout(() => {
        if (this.copiedId() === user.id) this.copiedId.set(null);
      }, 1500);
    });
  }

  trendMax(trend: RegistrationTrend[]): number {
    return Math.max(...trend.map(t => t.count), 1);
  }

  barWidth(count: number, max: number): number {
    return Math.round((count / max) * 100);
  }
}
