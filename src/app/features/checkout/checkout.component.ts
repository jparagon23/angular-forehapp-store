import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { AsyncPipe, NgFor, NgIf, UpperCasePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { combineLatest, Subscription } from 'rxjs';
import { filter, switchMap, take, withLatestFrom } from 'rxjs/operators';
import { selectCartItems, selectCartTotal, selectCartCount } from '../../store/cart/cart.selectors';
import { selectIsLoggedIn, selectAuthUser } from '../../store/auth/auth.selectors';
import { clearCart } from '../../store/cart/cart.actions';
import { loadAddresses, createAddress } from '../../store/addresses/addresses.actions';
import { selectAllAddresses, selectAddressesLoading, selectAddressesSaving } from '../../store/addresses/addresses.selectors';
import { Address, CreateAddressRequest } from '../../core/models/address.model';
import { CurrencyCopPipe } from '../../shared/pipes/currency-cop.pipe';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [AsyncPipe, NgFor, NgIf, RouterLink, CurrencyCopPipe, UpperCasePipe, ReactiveFormsModule],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss',
})
export class CheckoutComponent implements OnInit, OnDestroy {
  private store  = inject(Store);
  private router = inject(Router);
  private fb     = inject(FormBuilder);

  items$      = this.store.select(selectCartItems);
  total$      = this.store.select(selectCartTotal);
  count$      = this.store.select(selectCartCount);
  authUser$   = this.store.select(selectAuthUser);
  isLoggedIn$ = this.store.select(selectIsLoggedIn);

  addresses$        = this.store.select(selectAllAddresses);
  addressesLoading$ = this.store.select(selectAddressesLoading);
  addressesSaving$  = this.store.select(selectAddressesSaving);

  selectedAddressId: number | null = null;
  showAddressPicker = false;
  showAddressForm   = false;

  addressForm = this.fb.group({
    alias:   [''],
    street:  ['', [Validators.required, Validators.maxLength(255)]],
    city:    ['', [Validators.required, Validators.maxLength(100)]],
    state:   [''],
    country: ['', [Validators.required, Validators.maxLength(100)]],
    zipCode: [''],
  });

  private addrSub?: Subscription;

  ngOnInit() {
    this.isLoggedIn$.pipe(take(1)).subscribe(loggedIn => {
      if (!loggedIn) {
        this.router.navigate(['/login'], { queryParams: { redirect: '/checkout' } });
        return;
      }
      this.store.dispatch(loadAddresses());
      this.addrSub = this.addresses$.pipe(
        filter(addrs => addrs.length > 0),
        take(1),
      ).subscribe(addrs => {
        const def = addrs.find(a => a.isDefault) ?? addrs[0];
        if (!this.selectedAddressId) this.selectedAddressId = def.id;
      });
    });

    this.items$.pipe(take(1)).subscribe(items => {
      if (items.length === 0) this.router.navigate(['/']);
    });
  }

  ngOnDestroy() { this.addrSub?.unsubscribe(); }

  getSelected(addresses: Address[]): Address | null {
    return addresses.find(a => a.id === this.selectedAddressId) ?? null;
  }

  selectAddress(id: number) {
    this.selectedAddressId = id;
    this.showAddressPicker = false;
  }

  openAddressForm() {
    this.addressForm.reset();
    this.showAddressForm = true;
  }

  closeAddressForm() {
    this.showAddressForm = false;
    this.addressForm.reset();
  }

  submitAddress() {
    if (this.addressForm.invalid) { this.addressForm.markAllAsTouched(); return; }
    const v = this.addressForm.getRawValue();
    const req: CreateAddressRequest = {
      alias:     v.alias   || undefined,
      street:    v.street!,
      city:      v.city!,
      state:     v.state   || undefined,
      country:   v.country!,
      zipCode:   v.zipCode || undefined,
      isDefault: true,
    };

    this.store.dispatch(createAddress({ req }));

    this.addressesSaving$.pipe(
      filter(saving => saving),
      take(1),
      switchMap(() => this.addressesSaving$.pipe(filter(saving => !saving), take(1))),
      withLatestFrom(this.addresses$),
    ).subscribe(([, addresses]) => {
      const newAddr = addresses.find(a => a.isDefault) ?? addresses[addresses.length - 1];
      if (newAddr) this.selectedAddressId = newAddr.id;
      this.showAddressForm = false;
      this.showAddressPicker = false;
    });
  }

  hasFormError(field: string): boolean {
    const c = this.addressForm.get(field);
    return !!(c?.invalid && c.touched);
  }

  varInfo(size: string | null, color: string | null): string {
    return [size, color].filter(Boolean).join(' · ');
  }

  confirm() {
    this.store.dispatch(clearCart());
    this.router.navigate(['/gracias']);
  }
}
