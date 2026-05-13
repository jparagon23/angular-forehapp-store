import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { AddressService } from '../../core/services/address.service';
import * as AddressesActions from './addresses.actions';

@Injectable()
export class AddressesEffects {
  private actions$ = inject(Actions);
  private addressService = inject(AddressService);

  loadAddresses$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AddressesActions.loadAddresses),
      switchMap(() =>
        this.addressService.getAddresses().pipe(
          map(addresses => AddressesActions.loadAddressesSuccess({ addresses })),
          catchError(error => of(AddressesActions.loadAddressesFailure({ error: error.message })))
        )
      )
    )
  );

  createAddress$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AddressesActions.createAddress),
      switchMap(({ req }) =>
        this.addressService.createAddress(req).pipe(
          map(address => AddressesActions.createAddressSuccess({ address })),
          catchError(error => of(AddressesActions.createAddressFailure({ error: error.message })))
        )
      )
    )
  );

  updateAddress$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AddressesActions.updateAddress),
      switchMap(({ id, req }) =>
        this.addressService.updateAddress(id, req).pipe(
          map(address => AddressesActions.updateAddressSuccess({ address })),
          catchError(error => of(AddressesActions.updateAddressFailure({ error: error.message })))
        )
      )
    )
  );

  deleteAddress$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AddressesActions.deleteAddress),
      switchMap(({ id }) =>
        this.addressService.deleteAddress(id).pipe(
          map(() => AddressesActions.deleteAddressSuccess({ id })),
          catchError(error => of(AddressesActions.deleteAddressFailure({ error: error.message })))
        )
      )
    )
  );

  setDefaultAddress$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AddressesActions.setDefaultAddress),
      switchMap(({ id }) =>
        this.addressService.setDefaultAddress(id).pipe(
          map(address => AddressesActions.setDefaultAddressSuccess({ address })),
          catchError(error => of(AddressesActions.setDefaultAddressFailure({ error: error.message })))
        )
      )
    )
  );
}
