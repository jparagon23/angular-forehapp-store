import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { AsyncPipe, NgFor, NgIf, UpperCasePipe } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import { selectSellerGroups, selectCartTotal, selectCartCount } from '../../store/cart/cart.selectors';
import { selectIsLoggedIn, selectAuthUser } from '../../store/auth/auth.selectors';
import { loadAddresses, createAddress } from '../../store/addresses/addresses.actions';
import { selectAllAddresses, selectAddressesLoading, selectAddressesSaving } from '../../store/addresses/addresses.selectors';
import { createOrder, resetCreateOrder } from '../../store/orders/orders.actions';
import { selectCreatingOrder, selectCreatedOrder, selectCreateOrderError } from '../../store/orders/orders.selectors';
import { Address, CreateAddressRequest } from '../../core/models/address.model';
import { PaymentMethod } from '../../core/models/order.model';
import { CurrencyCopPipe } from '../../shared/pipes/currency-cop.pipe';
import { CouponService } from '../../core/services/coupon.service';
import { AppliedCoupon, CouponValidationResponse } from '../../core/models/coupon.model';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [AsyncPipe, NgFor, NgIf, RouterLink, CurrencyCopPipe, UpperCasePipe, ReactiveFormsModule, FormsModule],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss',
})
export class CheckoutComponent implements OnInit, OnDestroy {
  private store         = inject(Store);
  private router        = inject(Router);
  private fb            = inject(FormBuilder);
  private couponService = inject(CouponService);

  sellerGroups$ = this.store.select(selectSellerGroups);
  total$        = this.store.select(selectCartTotal);
  count$        = this.store.select(selectCartCount);
  authUser$     = this.store.select(selectAuthUser);
  isLoggedIn$   = this.store.select(selectIsLoggedIn);

  addresses$        = this.store.select(selectAllAddresses);
  addressesLoading$ = this.store.select(selectAddressesLoading);
  addressesSaving$  = this.store.select(selectAddressesSaving);

  creatingOrder$    = this.store.select(selectCreatingOrder);
  createOrderError$ = this.store.select(selectCreateOrderError);
  createdOrder$     = this.store.select(selectCreatedOrder);

  selectedAddressId: number | null = null;
  selectedPaymentMethod: PaymentMethod = 'MERCADO_PAGO';
  showAddressPicker = false;
  showAddressForm   = false;

  // coupon state keyed by storeId
  couponInputs:   Record<number, string>        = {};
  couponLoading:  Record<number, boolean>       = {};
  couponErrors:   Record<number, string>        = {};
  appliedCoupons: Record<number, AppliedCoupon> = {};

  cartTotal = 0;

  addressForm = this.fb.group({
    alias:   [''],
    street:  ['', [Validators.required, Validators.maxLength(255)]],
    city:    ['', [Validators.required, Validators.maxLength(100)]],
    state:   [''],
    country: ['', [Validators.required, Validators.maxLength(100)]],
    zipCode: [''],
  });

  private addrSub?:  Subscription;
  private orderSub?: Subscription;
  private totalSub?: Subscription;

  ngOnInit() {
    this.store.dispatch(resetCreateOrder());

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
  }

  ngOnDestroy() {
    this.addrSub?.unsubscribe();
    this.orderSub?.unsubscribe();
    this.totalSub?.unsubscribe();
  }

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
    this.addressesSaving$.pipe(filter(s => s), take(1)).subscribe(() => {
      this.addressesSaving$.pipe(filter(s => !s), take(1)).subscribe(() => {
        this.addresses$.pipe(take(1)).subscribe(addresses => {
          const newAddr = addresses.find(a => a.isDefault) ?? addresses[addresses.length - 1];
          if (newAddr) this.selectedAddressId = newAddr.id;
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

  get totalWithDiscounts(): number {
    const totalDiscount = Object.values(this.appliedCoupons)
      .reduce((sum, c) => sum + c.discountAmount, 0);
    return this.cartTotal - totalDiscount;
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
    return addr?.city?.toLowerCase() === 'cali';
  }

  confirm() {
    if (!this.selectedAddressId) return;
    this.store.dispatch(createOrder({ addressId: this.selectedAddressId, paymentMethod: this.selectedPaymentMethod }));
  }
}
