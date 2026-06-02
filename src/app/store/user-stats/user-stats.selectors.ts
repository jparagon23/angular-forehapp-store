import { createFeatureSelector, createSelector } from '@ngrx/store';
import { UserStatsState } from './user-stats.reducer';

const selectState = createFeatureSelector<UserStatsState>('userStats');

export const selectUserStats = createSelector(selectState, s => s.stats);
export const selectUserStatsLoading = createSelector(selectState, s => s.loading);
export const selectUserStatsError = createSelector(selectState, s => s.error);
