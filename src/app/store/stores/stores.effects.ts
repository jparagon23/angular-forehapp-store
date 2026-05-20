import { inject, Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { StoreService } from '../../core/services/store.service';
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

function extractApiError(err: HttpErrorResponse, fallback: string): string {
  return err.error?.error ?? err.error?.message ?? err.message ?? fallback;
}

@Injectable()
export class StoresEffects {
  private actions$ = inject(Actions);
  private service  = inject(StoreService);

  loadMyStores$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadMyStores),
      switchMap(() => this.service.getMyStores().pipe(
        map(stores => loadMyStoresSuccess({ stores })),
        catchError(err => of(loadMyStoresFailure({ error: extractApiError(err, 'Error al cargar tiendas') })))
      ))
    )
  );

  loadStore$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadStore),
      switchMap(({ storeId }) => this.service.getStore(storeId).pipe(
        map(store => loadStoreSuccess({ store })),
        catchError(err => of(loadStoreFailure({ error: extractApiError(err, 'Error al cargar tienda') })))
      ))
    )
  );

  updateStore$ = createEffect(() =>
    this.actions$.pipe(
      ofType(updateStore),
      switchMap(({ storeId, req }) => this.service.updateStore(storeId, req).pipe(
        map(store => updateStoreSuccess({ store })),
        catchError(err => of(storesActionFailure({ error: extractApiError(err, 'Error al actualizar tienda') })))
      ))
    )
  );

  createStore$ = createEffect(() =>
    this.actions$.pipe(
      ofType(createStore),
      switchMap(({ req }) => this.service.createStore(req).pipe(
        map(store => createStoreSuccess({ store })),
        catchError(err => of(storesActionFailure({ error: extractApiError(err, 'Error al crear tienda') })))
      ))
    )
  );

  loadMembers$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadMembers),
      switchMap(({ storeId }) => this.service.getMembers(storeId).pipe(
        map(members => loadMembersSuccess({ members })),
        catchError(err => of(loadMembersFailure({ error: extractApiError(err, 'Error al cargar miembros') })))
      ))
    )
  );

  inviteMember$ = createEffect(() =>
    this.actions$.pipe(
      ofType(inviteMember),
      switchMap(({ storeId, req }) => this.service.inviteMember(storeId, req).pipe(
        map(member => inviteMemberSuccess({ member })),
        catchError(err => of(storesActionFailure({ error: extractApiError(err, 'Error al invitar miembro') })))
      ))
    )
  );

  changeMemberRole$ = createEffect(() =>
    this.actions$.pipe(
      ofType(changeMemberRole),
      switchMap(({ storeId, membershipId, role }) => this.service.changeMemberRole(storeId, membershipId, role).pipe(
        map(member => changeMemberRoleSuccess({ member })),
        catchError(err => of(storesActionFailure({ error: extractApiError(err, 'Error al cambiar rol') })))
      ))
    )
  );

  removeMember$ = createEffect(() =>
    this.actions$.pipe(
      ofType(removeMember),
      switchMap(({ storeId, membershipId }) => this.service.removeMember(storeId, membershipId).pipe(
        map(() => removeMemberSuccess({ membershipId })),
        catchError(err => of(storesActionFailure({ error: extractApiError(err, 'Error al remover miembro') })))
      ))
    )
  );
}
