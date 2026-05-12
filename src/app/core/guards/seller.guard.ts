import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, take } from 'rxjs/operators';
import { selectAuthUser } from '../../store/auth/auth.selectors';

export const sellerGuard: CanActivateFn = (route) => {
  const store  = inject(Store);
  const router = inject(Router);
  const redirect = route.url.map(s => s.path).join('/');

  return store.select(selectAuthUser).pipe(
    take(1),
    map(user => {
      if (user?.role === 'SELLER') return true;
      return router.createUrlTree(['/login'], { queryParams: { redirect: `/seller/${redirect}` } });
    })
  );
};
