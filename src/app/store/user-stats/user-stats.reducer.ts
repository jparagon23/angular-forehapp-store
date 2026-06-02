import { createReducer, on } from '@ngrx/store';
import { UserStats } from '../../core/models/user-stats.model';
import * as UserStatsActions from './user-stats.actions';

export interface UserStatsState {
  stats: UserStats | null;
  loading: boolean;
  error: string | null;
}

const initialState: UserStatsState = { stats: null, loading: false, error: null };

export const userStatsReducer = createReducer(
  initialState,
  on(UserStatsActions.loadUserStats, state => ({ ...state, loading: true, error: null })),
  on(UserStatsActions.loadUserStatsSuccess, (state, { stats }) => ({ ...state, stats, loading: false })),
  on(UserStatsActions.loadUserStatsFailure, (state, { error }) => ({ ...state, loading: false, error })),
);
