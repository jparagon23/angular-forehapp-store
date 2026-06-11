import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { AsyncPipe, NgFor, NgIf, UpperCasePipe } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin, Observable, of, Subscription } from 'rxjs';
import { catchError, filter, map, skip, startWith, switchMap, take } from 'rxjs/operators';
import { CartService } from '../../core/services/cart.service';
import { ProductService } from '../../core/services/product.service';
import { CartSellerGroup, ShippingEstimateGroup, ShippingEstimateResponse } from '../../core/models/cart.model';
import { Product } from '../../core/models/product.model';
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
import { SeoService } from '../../core/services/seo.service';

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
  private productSvc      = inject(ProductService);
  private authApi         = inject(AuthApiService);
  private tokenStore      = inject(TokenStore);
  private seo             = inject(SeoService);

  sellerGroups$ = this.store.select(selectSellerGroups);
  total$        = this.store.select(selectCartTotal);
  count$        = this.store.select(selectCartCount);

  recommendations$: Observable<Record<number, Product[]>> = this.sellerGroups$.pipe(
    switchMap(groups => {
      const shortfallGroups = groups.filter(
        g => g.freeShippingMinAmount != null && g.subtotal < g.freeShippingMinAmount!
      );
      if (!shortfallGroups.length) return of({} as Record<number, Product[]>);

      const requests = shortfallGroups.map(group =>
        this.productSvc.getProducts({
          storeId:           group.storeId,
          maxPrice:          group.freeShippingMinAmount! - group.subtotal,
          excludeProductIds: group.items.map(i => i.productId),
          sortBy:            'PRICE_DESC',
          size:              4,
        }).pipe(
          map(products => ({ storeId: group.storeId, products })),
          catchError(() => of({ storeId: group.storeId, products: [] as Product[] }))
        )
      );

      return forkJoin(requests).pipe(
        map(results =>
          results.reduce((acc, r) => ({ ...acc, [r.storeId]: r.products }), {} as Record<number, Product[]>)
        )
      );
    }),
    startWith({} as Record<number, Product[]>)
  );
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
  selectedPaymentMethod: PaymentMethod | null = null;
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
    this.seo.set({ title: 'Finalizar Compra' });
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
      if (order!.checkoutUrl) {
        window.location.href = order!.checkoutUrl;
      }
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
    this.selectedPaymentMethod = null;
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

  goToProduct(id: number) { this.router.navigate(['/product', id]); }

  fspPct(group: CartSellerGroup): number {
    if (!group.freeShippingMinAmount) return 0;
    return Math.min(100, Math.round((group.subtotal / group.freeShippingMinAmount) * 100));
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
    const shippingCost = this.getGroupShipping(storeId)?.shippingCost ?? 0;
    this.couponService.validate({ code, storeId, orderAmount: subtotal, shippingCost }).subscribe({
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
        this.couponErrors[storeId]  = this.couponErrorMessage(err?.error?.message ?? '');
        this.couponLoading[storeId] = false;
        delete this.appliedCoupons[storeId];
      },
    });
  }

  private couponErrorMessage(msg: string): string {
    const map: Record<string, string> = {
      'Coupon not found': 'El código ingresado no existe',
      'Coupon is not valid for this store': 'Este cupón no aplica para esta tienda',
      'Coupon is not active': 'Este cupón no está activo',
      'Coupon is not yet valid': 'Este cupón aún no está vigente',
      'Coupon has expired': 'Este cupón ha vencido',
      'Coupon has reached its usage limit': 'Este cupón ya no tiene usos disponibles',
      'You have already used this coupon': 'Ya usaste este cupón anteriormente',
      "Cart has no items from the coupon's store": 'Tu carrito no tiene productos de la tienda de este cupón',
    };
    const minMatch = msg.match(/Order amount does not meet the minimum required: (.+)/);
    if (minMatch) return `Tu compra debe ser mínimo $${Number(minMatch[1]).toLocaleString('es-CO')} para usar este cupón`;
    return map[msg] ?? (msg || 'Cupón no válido');
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

  get mpSurcharge(): number {
    if (this.selectedPaymentMethod !== 'MERCADO_PAGO') return 0;
    return Math.round(this.totalWithDiscounts * 0.035);
  }

  get totalForDisplay(): number {
    return this.selectedPaymentMethod === 'MERCADO_PAGO'
      ? this.totalWithDiscounts + this.mpSurcharge
      : this.totalWithDiscounts;
  }

  getGroupTotal(storeId: number, subtotal: number): number {
    return this.appliedCoupons[storeId]?.finalAmount ?? subtotal;
  }

  isSelectedAddressCali(addresses: Address[]): boolean {
    const addr = this.getSelected(addresses);
    return addr?.city?.name?.toLowerCase() === 'cali';
  }

  confirm() {
    if (!this.selectedAddressId || !this.selectedPaymentMethod) return;
    if (!this.authUser()?.phone) {
      this.phoneModal.set(true);
      return;
    }
    this.dispatchCreateOrder();
  }

  private dispatchCreateOrder() {
    const applied = Object.values(this.appliedCoupons);
    const coupon  = applied.length > 0 ? applied[0] : null;
    this.store.dispatch(createOrder({
      addressId:     this.selectedAddressId!,
      paymentMethod: this.selectedPaymentMethod!,
      couponCode:    coupon?.code,
      couponStoreId: coupon?.storeId,
    }));
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
