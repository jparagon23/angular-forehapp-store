import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { UserStatsService } from '../../core/services/user-stats.service';
import * as UserStatsActions from './user-stats.actions';

@Injectable()
export class UserStatsEffects {
  private actions$ = inject(Actions);
  private userStatsService = inject(UserStatsService);

  loadUserStats$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserStatsActions.loadUserStats),
      switchMap(() =>
        this.userStatsService.getStats().pipe(
          map(stats => UserStatsActions.loadUserStatsSuccess({ stats })),
          catchError(error => of(UserStatsActions.loadUserStatsFailure({ error: error.message })))
        )
      )
    )
  );
}
