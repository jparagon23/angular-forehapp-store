import { createReducer, on } from '@ngrx/store';
import { MyStore, Store, StoreMember } from '../../core/models/store.model';
import {
  changeMemberRole, changeMemberRoleSuccess,
  createStore, createStoreSuccess,
  inviteMember, inviteMemberSuccess,
  loadMembers, loadMembersFailure, loadMembersSuccess,
  loadMyStores, loadMyStoresFailure, loadMyStoresSuccess,
  loadStore, loadStoreFailure, loadStoreSuccess,
  removeMember, removeMemberSuccess,
  storesActionFailure,
  updateStore, updateStoreSuccess,
} from './stores.actions';

export interface StoresState {
  myStores: MyStore[];
  selectedStore: Store | null;
  lastCreatedStore: Store | null;
  members: StoreMember[];
  loading: boolean;
  membersLoading: boolean;
  actionLoading: boolean;
  error: string | null;
}

const initialState: StoresState = {
  myStores: [],
  selectedStore: null,
  lastCreatedStore: null,
  members: [],
  loading: false,
  membersLoading: false,
  actionLoading: false,
  error: null,
};

export const storesReducer = createReducer(
  initialState,

  on(loadMyStores, state => ({ ...state, loading: true, error: null })),
  on(loadMyStoresSuccess, (state, { stores }) => ({ ...state, myStores: stores, loading: false })),
  on(loadMyStoresFailure, (state, { error }) => ({ ...state, error, loading: false })),

  on(loadStore, state => ({ ...state, loading: true, error: null })),
  on(loadStoreSuccess, (state, { store }) => ({ ...state, selectedStore: store, loading: false })),
  on(loadStoreFailure, (state, { error }) => ({ ...state, error, loading: false })),

  on(updateStore, state => ({ ...state, actionLoading: true, error: null })),
  on(updateStoreSuccess, (state, { store }) => ({ ...state, selectedStore: store, actionLoading: false })),

  on(createStore, state => ({ ...state, actionLoading: true, error: null })),
  on(createStoreSuccess, (state, { store }) => ({ ...state, lastCreatedStore: store, actionLoading: false })),

  on(loadMembers, state => ({ ...state, membersLoading: true, error: null })),
  on(loadMembersSuccess, (state, { members }) => ({ ...state, members, membersLoading: false })),
  on(loadMembersFailure, (state, { error }) => ({ ...state, error, membersLoading: false })),

  on(inviteMember, state => ({ ...state, actionLoading: true, error: null })),
  on(inviteMemberSuccess, (state, { member }) => ({ ...state, members: [...state.members, member], actionLoading: false })),

  on(changeMemberRole, state => ({ ...state, actionLoading: true, error: null })),
  on(changeMemberRoleSuccess, (state, { member }) => ({
    ...state,
    actionLoading: false,
    members: state.members.map(m => m.membershipId === member.membershipId ? member : m),
  })),

  on(removeMember, state => ({ ...state, actionLoading: true, error: null })),
  on(removeMemberSuccess, (state, { membershipId }) => ({
    ...state,
    actionLoading: false,
    members: state.members.filter(m => m.membershipId !== membershipId),
  })),

  on(storesActionFailure, (state, { error }) => ({
    ...state, error, loading: false, membersLoading: false, actionLoading: false,
  })),
);
