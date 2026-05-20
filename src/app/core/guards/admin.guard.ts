import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, take } from 'rxjs/operators';
import { selectAuthUser } from '../../store/auth/auth.selectors';

export const adminGuard: CanActivateFn = () => {
  const store  = inject(Store);
  const router = inject(Router);

  return store.select(selectAuthUser).pipe(
    take(1),
    map(user => {
      if (user?.storeRoles?.includes('STORE_ADMIN')) return true;
      return router.createUrlTree(['/login']);
    })
  );
};
