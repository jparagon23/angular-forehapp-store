import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { AsyncPipe, NgFor, NgIf, UpperCasePipe } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { filter, skip, take } from 'rxjs/operators';
import { CartService } from '../../core/services/cart.service';
import { ShippingEstimateGroup, ShippingEstimateResponse } from '../../core/models/cart.model';
import { selectSellerGroups, selectCartTotal, selectCartCount } from '../../store/cart/cart.selectors';
import { removeCartItem } from '../../store/cart/cart.actions';
import { selectIsLoggedIn, selectAuthUser } from '../../store/auth/auth.selectors';
import { loadAddresses, createAddress } from '../../store/addresses/addresses.actions';
import { selectAllAddresses, selectAddressesLoading, selectAddressesSaving } from '../../store/addresses/addresses.selectors';
import { createOrder, resetCreateOrder } from '../../store/orders/orders.actions';
import { selectCreatingOrder, selectCreatedOrder, selectCreateOrderError } from '../../store/orders/orders.selectors';
import { Address, CreateAddressRequest } from '../../core/models/address.model';
import { City, Country, State } from '../../core/models/location.model';
import { LocationService } from '../../core/services/location.service';
import { PaymentMethod } from '../../core/models/order.model';
import { CurrencyCopPipe } from '../../shared/pipes/currency-cop.pipe';
import { CouponService } from '../../core/services/coupon.service';
import { AppliedCoupon, CouponValidationResponse } from '../../core/models/coupon.model';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { AuthApiService } from '../../core/services/auth-api.service';
import { TokenStore } from '../../core/services/token-store.service';
import { updateUser } from '../../store/auth/auth.actions';
import { apiCode } from '../../core/models/api-error.model';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [AsyncPipe, NgFor, NgIf, RouterLink, CurrencyCopPipe, UpperCasePipe, ReactiveFormsModule, FormsModule, NavbarComponent],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss',
})
export class CheckoutComponent implements OnInit, OnDestroy {
  private store           = inject(Store);
  private router          = inject(Router);
  private fb              = inject(FormBuilder);
  private couponService   = inject(CouponService);
  private locationService = inject(LocationService);
  private cartService     = inject(CartService);
  private authApi         = inject(AuthApiService);
  private tokenStore      = inject(TokenStore);

  sellerGroups$ = this.store.select(selectSellerGroups);
  total$        = this.store.select(selectCartTotal);
  count$        = this.store.select(selectCartCount);
  authUser$     = this.store.select(selectAuthUser);
  isLoggedIn$   = this.store.select(selectIsLoggedIn);
  authUser      = toSignal(this.store.select(selectAuthUser), { initialValue: null });

  // Phone modal
  phoneModal   = signal(false);
  phoneInput   = signal('');
  savingPhone  = signal(false);
  phoneError   = signal('');

  addresses$        = this.store.select(selectAllAddresses);
  addressesLoading$ = this.store.select(selectAddressesLoading);
  addressesSaving$  = this.store.select(selectAddressesSaving);

  creatingOrder$    = this.store.select(selectCreatingOrder);
  createOrderError$ = this.store.select(selectCreateOrderError);
  createdOrder$     = this.store.select(selectCreatedOrder);

  selectedAddressId: number | null = null;
  selectedPaymentMethod: PaymentMethod = 'TRANSFER';
  showAddressPicker = false;
  showAddressForm   = false;

  // Location cascade for address form
  addrCountries = signal<Country[]>([]);
  addrStates    = signal<State[]>([]);
  addrCities    = signal<City[]>([]);
  addrCountryId = signal<number | null>(null);
  addrStateId   = signal<number | null>(null);

  // Shipping estimate
  shippingEstimate  = signal<ShippingEstimateResponse | null>(null);
  shippingLoading   = signal(false);
  shippingError     = signal<string | null>(null);

  removingItem = signal<number | null>(null);

  // coupon state keyed by storeId
  couponInputs:   Record<number, string>        = {};
  couponLoading:  Record<number, boolean>       = {};
  couponErrors:   Record<number, string>        = {};
  appliedCoupons: Record<number, AppliedCoupon> = {};

  cartTotal = 0;

  addressForm = this.fb.group({
    alias:   [''],
    street:  ['', [Validators.required, Validators.maxLength(255)]],
    cityId:  [null as number | null, Validators.required],
    zipCode: [''],
  });

  private addrSub?:  Subscription;
  private orderSub?: Subscription;
  private totalSub?: Subscription;
  private sub = new Subscription();

  ngOnInit() {
    this.store.dispatch(resetCreateOrder());

    this.isLoggedIn$.pipe(take(1)).subscribe(loggedIn => {
      if (!loggedIn) {
        this.router.navigate(['/login'], { queryParams: { redirect: '/checkout' } });
        return;
      }
      this.store.dispatch(loadAddresses());
      this.locationService.getCountries().subscribe(cs => this.addrCountries.set(cs));
      this.addrSub = this.addresses$.pipe(
        filter(addrs => addrs.length > 0),
        take(1),
      ).subscribe(addrs => {
        const def = addrs.find(a => a.isDefault) ?? addrs[0];
        if (!this.selectedAddressId) {
          this.selectedAddressId = def.id;
          this.loadShippingEstimate(def.id);
        }
      });
    });

    this.sellerGroups$.pipe(take(1)).subscribe(groups => {
      if (groups.length === 0) this.router.navigate(['/']);
    });

    this.totalSub = this.total$.subscribe(t => (this.cartTotal = t));

    this.orderSub = this.store.select(selectCreatedOrder).pipe(
      filter(order => order !== null),
      take(1),
    ).subscribe(order => {
      this.redeemAll(order!.orderId).then(() => {
        if (order!.checkoutUrl) {
          window.location.href = order!.checkoutUrl;
        }
      });
    });

    // Fallback: si el back rechaza por ORDER_BUYER_PHONE_REQUIRED, mostrar modal
    this.sub.add(
      this.store.select(selectCreateOrderError).pipe(
        filter(err => !!err),
      ).subscribe(() => {
        if (!this.authUser()?.phone) {
          this.phoneModal.set(true);
        }
      })
    );
  }

  ngOnDestroy() {
    this.addrSub?.unsubscribe();
    this.orderSub?.unsubscribe();
    this.totalSub?.unsubscribe();
    this.sub.unsubscribe();
  }

  getSelected(addresses: Address[]): Address | null {
    return addresses.find(a => a.id === this.selectedAddressId) ?? null;
  }

  selectAddress(id: number) {
    this.selectedAddressId = id;
    this.showAddressPicker = false;
    this.loadShippingEstimate(id);
  }

  private loadShippingEstimate(addressId: number) {
    this.shippingLoading.set(true);
    this.shippingError.set(null);
    this.cartService.getShippingEstimate(addressId).subscribe({
      next: est => {
        this.shippingEstimate.set(est);
        this.shippingLoading.set(false);
      },
      error: () => {
        this.shippingEstimate.set(null);
        this.shippingError.set('No se pudo calcular el costo de envío');
        this.shippingLoading.set(false);
      },
    });
  }

  getGroupShipping(storeId: number): ShippingEstimateGroup | null {
    return this.shippingEstimate()?.sellerGroups.find(g => g.storeId === storeId) ?? null;
  }

  openAddressForm() {
    this.addrCountryId.set(null);
    this.addrStateId.set(null);
    this.addrStates.set([]);
    this.addrCities.set([]);
    this.addressForm.reset();
    this.showAddressForm = true;
  }

  closeAddressForm() {
    this.showAddressForm = false;
    this.addressForm.reset();
  }

  onAddrCountryChange(event: Event) {
    const id = Number((event.target as HTMLSelectElement).value) || null;
    this.addrCountryId.set(id);
    this.addrStateId.set(null);
    this.addrStates.set([]);
    this.addrCities.set([]);
    this.addressForm.patchValue({ cityId: null });
    if (id) this.locationService.getStates(id).subscribe(ss => this.addrStates.set(ss));
  }

  onAddrStateChange(event: Event) {
    const id = Number((event.target as HTMLSelectElement).value) || null;
    this.addrStateId.set(id);
    this.addrCities.set([]);
    this.addressForm.patchValue({ cityId: null });
    if (id) this.locationService.getCities(id).subscribe(cs => this.addrCities.set(cs));
  }

  onAddrCityChange(event: Event) {
    const id = Number((event.target as HTMLSelectElement).value) || null;
    this.addressForm.patchValue({ cityId: id });
  }

  submitAddress() {
    if (this.addressForm.invalid) { this.addressForm.markAllAsTouched(); return; }
    const v = this.addressForm.getRawValue();
    const req: CreateAddressRequest = {
      alias:     v.alias   || undefined,
      street:    v.street!,
      cityId:    v.cityId!,
      zipCode:   v.zipCode || undefined,
      isDefault: true,
    };
    this.store.dispatch(createAddress({ req }));
    this.addressesSaving$.pipe(filter(s => s), take(1)).subscribe(() => {
      this.addressesSaving$.pipe(filter(s => !s), take(1)).subscribe(() => {
        this.addresses$.pipe(take(1)).subscribe(addresses => {
          const newAddr = addresses.find(a => a.isDefault) ?? addresses[addresses.length - 1];
          if (newAddr) {
            this.selectedAddressId = newAddr.id;
            this.loadShippingEstimate(newAddr.id);
          }
          this.showAddressForm = false;
          this.showAddressPicker = false;
        });
      });
    });
  }

  hasFormError(field: string): boolean {
    const c = this.addressForm.get(field);
    return !!(c?.invalid && c.touched);
  }

  applyCoupon(storeId: number, subtotal: number) {
    const code = (this.couponInputs[storeId] ?? '').trim().toUpperCase();
    if (!code) return;
    this.couponLoading[storeId] = true;
    this.couponErrors[storeId]  = '';
    this.couponService.validate({ code, storeId, orderAmount: subtotal }).subscribe({
      next: (res: CouponValidationResponse) => {
        this.appliedCoupons[storeId] = {
          storeId,
          code:           res.code,
          discountAmount: res.discountAmount,
          finalAmount:    res.finalAmount,
          discountType:   res.discountType,
          discountValue:  res.discountValue,
        };
        this.couponLoading[storeId] = false;
      },
      error: (err) => {
        const msg = err?.error?.message ?? 'Cupón no válido';
        this.couponErrors[storeId]  = msg;
        this.couponLoading[storeId] = false;
        delete this.appliedCoupons[storeId];
      },
    });
  }

  removeCoupon(storeId: number) {
    delete this.appliedCoupons[storeId];
    this.couponInputs[storeId] = '';
    this.couponErrors[storeId] = '';
  }

  removeItem(itemId: number) {
    this.removingItem.set(itemId);
    this.store.dispatch(removeCartItem({ itemId }));
    this.sellerGroups$.pipe(skip(1), take(1)).subscribe(groups => {
      this.removingItem.set(null);
      const activeStoreIds = new Set(groups.map(g => g.storeId));
      Object.keys(this.appliedCoupons).forEach(key => {
        if (!activeStoreIds.has(Number(key))) {
          delete this.appliedCoupons[Number(key)];
        }
      });
      if (groups.length === 0) {
        this.router.navigate(['/']);
        return;
      }
      if (this.selectedAddressId) {
        this.loadShippingEstimate(this.selectedAddressId);
      }
    });
  }

  get totalWithDiscounts(): number {
    const shipping  = this.shippingEstimate()?.shippingTotal ?? 0;
    const discount  = Object.values(this.appliedCoupons).reduce((sum, c) => sum + c.discountAmount, 0);
    return this.cartTotal + shipping - discount;
  }

  get totalDiscount(): number {
    return Object.values(this.appliedCoupons).reduce((sum, c) => sum + c.discountAmount, 0);
  }

  getGroupTotal(storeId: number, subtotal: number): number {
    return this.appliedCoupons[storeId]?.finalAmount ?? subtotal;
  }

  private async redeemAll(orderId: number): Promise<void> {
    const groups = Object.values(this.appliedCoupons);
    await Promise.all(
      groups.map(c =>
        this.couponService.redeem({
          code:        c.code,
          storeId:     c.storeId,
          orderAmount: c.finalAmount + c.discountAmount,
          orderId,
        }).toPromise().catch(() => {})
      )
    );
  }

  isSelectedAddressCali(addresses: Address[]): boolean {
    const addr = this.getSelected(addresses);
    return addr?.city?.name?.toLowerCase() === 'cali';
  }

  confirm() {
    if (!this.selectedAddressId) return;
    if (!this.authUser()?.phone) {
      this.phoneModal.set(true);
      return;
    }
    this.dispatchCreateOrder();
  }

  private dispatchCreateOrder() {
    this.store.dispatch(createOrder({ addressId: this.selectedAddressId!, paymentMethod: this.selectedPaymentMethod }));
  }

  savePhone() {
    const phone = this.phoneInput().trim();
    if (!phone) return;
    this.savingPhone.set(true);
    this.phoneError.set('');
    this.authApi.updatePhone(phone).subscribe({
      next: me => {
        this.store.dispatch(updateUser({ changes: { phone: me.phone } }));
        const current = this.authUser();
        if (current) this.tokenStore.updateStoredUser({ ...current, phone: me.phone });
        this.savingPhone.set(false);
        this.phoneModal.set(false);
        this.store.dispatch(resetCreateOrder());
        this.dispatchCreateOrder();
      },
      error: () => {
        this.phoneError.set('No se pudo guardar el teléfono. Intenta de nuevo.');
        this.savingPhone.set(false);
      },
    });
  }
}
