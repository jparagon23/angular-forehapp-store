import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { NgFor, NgIf } from '@angular/common';
import { take } from 'rxjs/operators';
import { selectIsLoggedIn } from '../../store/auth/auth.selectors';
import { GuestCartService } from '../../core/services/guest-cart.service';
import { CurrencyCopPipe } from '../../shared/pipes/currency-cop.pipe';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';

@Component({
  selector: 'app-checkout-entry',
  standalone: true,
  imports: [NgFor, NgIf, RouterLink, CurrencyCopPipe, NavbarComponent],
  templateUrl: './checkout-entry.component.html',
  styleUrl: './checkout-entry.component.scss',
})
export class CheckoutEntryComponent implements OnInit {
  private store     = inject(Store);
  private router    = inject(Router);
  private guestCart = inject(GuestCartService);

  items     = this.guestCart.getItems();
  itemCount = this.items.reduce((s, i) => s + i.quantity, 0);
  subtotal  = this.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);

  ngOnInit() {
    if (this.items.length === 0) {
      this.router.navigate(['/']);
      return;
    }
    this.store.select(selectIsLoggedIn).pipe(take(1)).subscribe(loggedIn => {
      if (loggedIn) this.router.navigate(['/checkout']);
    });
  }
}
