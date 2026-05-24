import { createAction, props } from '@ngrx/store';
import {
  CreateStoreRequest, InviteMemberRequest, MyStore,
  Store, StoreMember, StoreRole, UpdateStoreRequest,
} from '../../core/models/store.model';

export const loadMyStores        = createAction('[Stores] Load My Stores');
export const loadMyStoresSuccess = createAction('[Stores] Load My Stores Success', props<{ stores: MyStore[] }>());
export const loadMyStoresFailure = createAction('[Stores] Load My Stores Failure', props<{ error: string }>());

export const loadStore        = createAction('[Stores] Load Store', props<{ storeId: number }>());
export const loadStoreSuccess = createAction('[Stores] Load Store Success', props<{ store: Store }>());
export const loadStoreFailure = createAction('[Stores] Load Store Failure', props<{ error: string }>());

export const updateStore        = createAction('[Stores] Update Store', props<{ storeId: number; req: UpdateStoreRequest }>());
export const updateStoreSuccess = createAction('[Stores] Update Store Success', props<{ store: Store }>());

export const createStore        = createAction('[Stores] Create Store', props<{ req: CreateStoreRequest }>());
export const createStoreSuccess = createAction('[Stores] Create Store Success', props<{ store: Store }>());

export const loadMembers        = createAction('[Stores] Load Members', props<{ storeId: number }>());
export const loadMembersSuccess = createAction('[Stores] Load Members Success', props<{ members: StoreMember[] }>());
export const loadMembersFailure = createAction('[Stores] Load Members Failure', props<{ error: string }>());

export const inviteMember        = createAction('[Stores] Invite Member', props<{ storeId: number; req: InviteMemberRequest }>());
export const inviteMemberSuccess = createAction('[Stores] Invite Member Success', props<{ member: StoreMember }>());

export const changeMemberRole        = createAction('[Stores] Change Member Role', props<{ storeId: number; membershipId: number; role: StoreRole }>());
export const changeMemberRoleSuccess = createAction('[Stores] Change Member Role Success', props<{ member: StoreMember }>());

export const removeMember        = createAction('[Stores] Remove Member', props<{ storeId: number; membershipId: number }>());
export const removeMemberSuccess = createAction('[Stores] Remove Member Success', props<{ membershipId: number }>());

export const storesActionFailure = createAction('[Stores] Action Failure', props<{ error: string }>());
