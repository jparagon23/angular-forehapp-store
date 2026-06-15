import { Component, inject, signal } from '@angular/core';
import { Router, RouterOutlet, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { NgIf } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { saveReferralCode } from './core/utils/referral.utils';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NgIf],
  template: `
    <div class="nav-progress-bar" *ngIf="navigating()"></div>
    <router-outlet></router-outlet>
  `,
  styles: [`
    .nav-progress-bar {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 3px;
      background: linear-gradient(90deg, #42AA14 0%, #5fcf2a 50%, #42AA14 100%);
      background-size: 200% 100%;
      animation: nav-progress 1s linear infinite;
      z-index: 9999;
    }
    @keyframes nav-progress {
      0%   { background-position: 200% 0; }
      100% { background-position: 0% 0; }
    }
  `],
})
export class AppComponent {
  private router = inject(Router);
  navigating = signal(false);

  constructor() {
    this.router.events.pipe(
      takeUntilDestroyed(),
    ).subscribe(event => {
      if (event instanceof NavigationStart) this.navigating.set(true);
      if (event instanceof NavigationCancel || event instanceof NavigationError) this.navigating.set(false);
      if (event instanceof NavigationEnd) {
        this.navigating.set(false);
        const qs  = event.urlAfterRedirects.split('?')[1] ?? '';
        const ref = new URLSearchParams(qs).get('ref');
        if (ref) saveReferralCode(ref);
      }
    });
  }
}
