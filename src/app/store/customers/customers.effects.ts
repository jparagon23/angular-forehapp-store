import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { CustomerService } from '../../core/services/customer.service';
import * as CustomersActions from './customers.actions';

@Injectable()
export class CustomersEffects {
  private actions$ = inject(Actions);
  private customerService = inject(CustomerService);

  loadCustomers$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CustomersActions.loadCustomers),
      switchMap(() =>
        this.customerService.getCustomers().pipe(
          map(customers => CustomersActions.loadCustomersSuccess({ customers })),
          catchError(error => of(CustomersActions.loadCustomersFailure({ error: error.message })))
        )
      )
    )
  );
}
