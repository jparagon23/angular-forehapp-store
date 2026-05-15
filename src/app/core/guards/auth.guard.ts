import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, take } from 'rxjs/operators';
import { selectIsLoggedIn } from '../../store/auth/auth.selectors';

export const authGuard: CanActivateFn = (route) => {
  const store  = inject(Store);
  const router = inject(Router);
  const path   = '/' + route.url.map(s => s.path).join('/');

  return store.select(selectIsLoggedIn).pipe(
    take(1),
    map(loggedIn => {
      if (loggedIn) return true;
      return router.createUrlTree(['/login'], { queryParams: { redirect: path } });
    })
  );
};
