import { createAction, props } from '@ngrx/store';
import { UserStats } from '../../core/models/user-stats.model';

export const loadUserStats = createAction('[UserStats] Load');
export const loadUserStatsSuccess = createAction('[UserStats] Load Success', props<{ stats: UserStats }>());
export const loadUserStatsFailure = createAction('[UserStats] Load Failure', props<{ error: string }>());
