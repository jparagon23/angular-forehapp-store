import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { take } from 'rxjs/operators';
import { GuestCartService } from '../../core/services/guest-cart.service';
import { GuestCheckoutService } from '../../core/services/guest-checkout.service';
import { AuthApiService } from '../../core/services/auth-api.service';
import { LocationService } from '../../core/services/location.service';
import { TokenStore } from '../../core/services/token-store.service';
import { GuestCartItem } from '../../core/services/guest-cart.service';
import { ShippingEstimateGroup, ShippingEstimateResponse } from '../../core/models/cart.model';
import { Country, State, City } from '../../core/models/location.model';
import { OrderResponse, PaymentMethod } from '../../core/models/order.model';
import { AuthResponse } from '../../core/models/auth.model';
import { AuthUser, loginSuccess } from '../../store/auth/auth.actions';
import { CurrencyCopPipe } from '../../shared/pipes/currency-cop.pipe';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { resolveRole } from '../../core/utils/jwt.utils';
import { loadCart } from '../../store/cart/cart.actions';
import { validateEmail, EmailValidationResult } from '../../core/utils/email.utils';
import { CouponService } from '../../core/services/coupon.service';
import { AppliedCoupon, CouponValidationResponse } from '../../core/models/coupon.model';
import { getActiveReferralCode } from '../../core/utils/referral.utils';

@Component({
  selector: 'app-guest-checkout',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule, RouterLink, CurrencyCopPipe, NavbarComponent],
  templateUrl: './guest-checkout.component.html',
  styleUrl: './guest-checkout.component.scss',
})
export class GuestCheckoutComponent implements OnInit {
  private guestCart        = inject(GuestCartService);
  private guestCheckout    = inject(GuestCheckoutService);
  private couponService    = inject(CouponService);
  private authApi          = inject(AuthApiService);
  private locationService  = inject(LocationService);
  private tokenStore       = inject(TokenStore);
  private store            = inject(Store);
  private router           = inject(Router);

  // ── Navigation ──────────────────────────────────────────────────────────────
  step = signal<1 | 2 | 3 | 4>(1);

  // ── Cart items ───────────────────────────────────────────────────────────────
  cartItems = signal<GuestCartItem[]>([]);
  cartTotal = computed(() => this.cartItems().reduce((s, i) => s + i.unitPrice * i.quantity, 0));

  // ── Step 1 — Contact ─────────────────────────────────────────────────────────
  name          = signal('');
  lastname      = signal('');
  email         = signal('');
  phone         = signal('');
  emailChecking = signal(false);
  emailExists   = signal<boolean | null>(null);
  emailDismissed = signal(false);

  emailValidation = computed<EmailValidationResult>(() => validateEmail(this.email().trim()));

  emailError = computed(() => {
    const e = this.email().trim();
    if (!e) return '';
    const r = this.emailValidation();
    if (r === 'invalid-format') return 'Ingresa un correo electrónico válido.';
    if (r === 'disposable')     return 'No se permiten correos temporales o de prueba.';
    return '';
  });

  step1Valid = computed(() =>
    this.name().trim().length > 0 &&
    this.lastname().trim().length > 0 &&
    this.emailValidation() === 'valid' &&
    this.phone().trim().length >= 7
  );

  // ── Step 2 — Address ─────────────────────────────────────────────────────────
  countries        = signal<Country[]>([]);
  states           = signal<State[]>([]);
  cities           = signal<City[]>([]);
  selectedCountryId = signal<number | null>(null);
  selectedStateId   = signal<number | null>(null);
  selectedCityId    = signal<number | null>(null);
  selectedCityName  = signal<string>('');
  street           = signal('');
  complement       = signal('');
  reference        = signal('');

  isCaliSelected = computed(() => this.selectedCityName().toLowerCase().includes('cali'));
  loadingStates    = signal(false);
  loadingCities    = signal(false);

  estimate         = signal<ShippingEstimateResponse | null>(null);
  estimating       = signal(false);
  estimateError    = signal('');

  step2Valid = computed(() =>
    this.selectedCityId() !== null &&
    this.street().trim().length >= 5
  );

  // ── Step 3 — Payment ─────────────────────────────────────────────────────────
  paymentMethod = signal<PaymentMethod | null>(null);

  readonly paymentOptions: { value: PaymentMethod; label: string; desc: string }[] = [
    { value: 'MERCADO_PAGO',    label: 'MercadoPago',          desc: 'Paga en línea con tarjeta, PSE o efectivo. Se aplica un recargo del 3.5%.' },
    { value: 'CASH_ON_DELIVERY', label: 'Pago contra entrega', desc: 'Pagas en efectivo al recibir tu pedido' },
  ];

  submitting   = signal(false);
  submitError  = signal('');

  // ── Coupons (per store group) ────────────────────────────────────────────────
  couponInputs:   Record<number, string>        = {};
  couponLoading:  Record<number, boolean>       = {};
  couponErrors:   Record<number, string>        = {};
  appliedCoupons: Record<number, AppliedCoupon> = {};

  // ── Donation coupon (global) ──────────────────────────────────────────────────
  donationCouponInput   = signal('');
  donationCouponLoading = signal(false);
  donationCouponError   = signal('');
  appliedDonationCoupon = signal<AppliedCoupon | null>(null);

  get totalCouponDiscount(): number {
    return Object.values(this.appliedCoupons).reduce((s, c) => s + c.discountAmount, 0);
  }

  applyCoupon(storeId: number, subtotal: number, shippingCost: number) {
    const code = (this.couponInputs[storeId] ?? '').trim().toUpperCase();
    if (!code) return;
    this.couponLoading[storeId] = true;
    this.couponErrors[storeId]  = '';
    this.couponService.validateGuest({
      email: this.email().trim(),
      code,
      storeId,
      orderAmount: subtotal,
      shippingCost,
    }).subscribe({
      next: (res: CouponValidationResponse) => {
        if (res.isDonation) {
          this.couponErrors[storeId] = 'Este es un cupón de donación. Ingrésalo en el campo "Cupón de donación" de más abajo.';
          this.couponLoading[storeId] = false;
          return;
        }
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

  applyDonationCoupon() {
    const code = this.donationCouponInput().trim().toUpperCase();
    if (!code) return;
    this.donationCouponLoading.set(true);
    this.donationCouponError.set('');
    const shippingCost = this.estimate()?.shippingTotal ?? 0;
    this.couponService.validateGuest({
      email:       this.email().trim(),
      code,
      storeId:     null,
      orderAmount: this.cartTotal(),
      shippingCost,
    }).subscribe({
      next: (res: CouponValidationResponse) => {
        if (!res.isDonation) {
          this.donationCouponError.set('Este código no es un cupón de donación. Ingrésalo en el campo de la tienda correspondiente.');
          this.donationCouponLoading.set(false);
          return;
        }
        this.appliedDonationCoupon.set({
          storeId:       null,
          code:          res.code,
          discountAmount: 0,
          finalAmount:   res.finalAmount,
          discountType:  'DONATION',
          discountValue: res.discountValue,
          isDonation:    true,
          donationAmount: res.donationAmount ?? 0,
          foundationName: res.foundationName ?? '',
        });
        this.donationCouponLoading.set(false);
      },
      error: (err) => {
        this.donationCouponError.set(this.couponErrorMessage(err?.error?.message ?? ''));
        this.donationCouponLoading.set(false);
      },
    });
  }

  removeDonationCoupon() {
    this.appliedDonationCoupon.set(null);
    this.donationCouponInput.set('');
    this.donationCouponError.set('');
  }

  removeCoupon(storeId: number) {
    delete this.appliedCoupons[storeId];
    this.couponInputs[storeId] = '';
    this.couponErrors[storeId] = '';
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
      'Donation coupon cannot be combined with a referral code': 'El cupón de donación no es compatible con un enlace de embajador.',
    };
    const minMatch = msg.match(/Order amount does not meet the minimum required: (.+)/);
    if (minMatch) return `Tu compra debe ser mínimo $${Number(minMatch[1]).toLocaleString('es-CO')} para usar este cupón`;
    return map[msg] ?? (msg || 'Cupón no válido');
  }

  // ── Step 4 — Confirmation ────────────────────────────────────────────────────
  createdOrder = signal<OrderResponse | null>(null);

  // Optional create-account
  newPassword      = signal('');
  creatingAccount  = signal(false);
  accountError     = signal('');
  accountCreated   = signal(false);

  ngOnInit() {
    const items = this.guestCart.getItems();
    if (items.length === 0) {
      this.router.navigate(['/']);
      return;
    }
    this.cartItems.set(items);
    this.locationService.getCountries().pipe(take(1)).subscribe(cs => this.countries.set(cs));
  }

  // ── Email check ──────────────────────────────────────────────────────────────
  onEmailBlur() {
    const e = this.email().trim();
    if (this.emailValidation() !== 'valid') return;
    this.emailChecking.set(true);
    this.authApi.checkEmail(e).pipe(take(1)).subscribe({
      next: res => {
        this.emailExists.set(res.exists);
        this.emailDismissed.set(false);
        this.emailChecking.set(false);
      },
      error: () => this.emailChecking.set(false),
    });
  }

  goToLogin() {
    this.router.navigate(['/login'], {
      queryParams: { redirect: '/checkout', email: this.email().trim() },
    });
  }

  // ── Location cascade ─────────────────────────────────────────────────────────
  onCountryChange(id: string) {
    const cid = Number(id);
    this.selectedCountryId.set(cid);
    this.selectedStateId.set(null);
    this.selectedCityId.set(null);
    this.states.set([]);
    this.cities.set([]);
    this.estimate.set(null);
    if (!cid) return;
    this.loadingStates.set(true);
    this.locationService.getStates(cid).pipe(take(1)).subscribe({
      next: ss => { this.states.set(ss); this.loadingStates.set(false); },
      error: ()  => this.loadingStates.set(false),
    });
  }

  onStateChange(id: string) {
    const sid = Number(id);
    this.selectedStateId.set(sid);
    this.selectedCityId.set(null);
    this.cities.set([]);
    this.estimate.set(null);
    if (!sid) return;
    this.loadingCities.set(true);
    this.locationService.getCities(sid).pipe(take(1)).subscribe({
      next: cs => { this.cities.set(cs); this.loadingCities.set(false); },
      error: ()  => this.loadingCities.set(false),
    });
  }

  onCityChange(id: string) {
    const cid = Number(id);
    this.selectedCityId.set(cid || null);
    const city = this.cities().find(c => c.id === cid);
    this.selectedCityName.set(city?.name ?? '');
    if (this.paymentMethod() === 'CASH_ON_DELIVERY' && !this.isCaliSelected()) {
      this.paymentMethod.set(null);
    }
    this.estimate.set(null);
    this.estimateError.set('');
    if (!cid) return;
    this.runEstimate(cid);
  }

  private runEstimate(cityId: number) {
    this.estimating.set(true);
    const items = this.cartItems().map(i => ({ variantId: i.variantId, quantity: i.quantity }));
    this.guestCheckout.estimateShipping({ cityId, items }).pipe(take(1)).subscribe({
      next: res => { this.estimate.set(res); this.estimating.set(false); },
      error: err => {
        this.estimateError.set(err.error?.message ?? 'No se pudo calcular el envío.');
        this.estimating.set(false);
      },
    });
  }

  // ── Shipping helpers ─────────────────────────────────────────────────────────
  shippingForStore(storeId: number): ShippingEstimateGroup | undefined {
    return this.estimate()?.sellerGroups.find(g => g.storeId === storeId);
  }

  // For the cart display: group items by storeId (guest cart has storeId = 0)
  // We display all items in one block and use estimate groups for shipping
  get estimateGroups(): ShippingEstimateGroup[] {
    return this.estimate()?.sellerGroups ?? [];
  }

  // ── Navigation ───────────────────────────────────────────────────────────────
  goNext() {
    const s = this.step();
    if (s === 1 && this.step1Valid()) this.step.set(2);
    else if (s === 2 && this.step2Valid()) this.step.set(3);
  }

  goBack() {
    const s = this.step();
    if (s > 1 && s < 4) this.step.set((s - 1) as 1 | 2 | 3);
  }

  // ── Submit order ─────────────────────────────────────────────────────────────
  submit() {
    if (this.submitting()) return;
    const cityId = this.selectedCityId();
    if (!cityId) return;
    const method = this.paymentMethod();
    if (!method) {
      this.submitError.set('Selecciona un método de pago para continuar.');
      return;
    }

    this.submitting.set(true);
    this.submitError.set('');

    const donationCoupon  = this.appliedDonationCoupon();
    const regularCoupons  = Object.values(this.appliedCoupons);
    const regularCoupon   = regularCoupons.length > 0 ? regularCoupons[0] : null;
    const activeCoupon    = donationCoupon ?? regularCoupon;

    const body = {
      name:               this.name().trim(),
      lastname:           this.lastname().trim(),
      email:              this.email().trim(),
      phone:              this.phone().trim(),
      shippingAddress:    this.street().trim(),
      shippingCityId:     cityId,
      shippingComplement: this.complement().trim() || undefined,
      shippingReference:  this.reference().trim() || undefined,
      items:              this.cartItems().map(i => ({ variantId: i.variantId, quantity: i.quantity })),
      paymentMethod:      method,
      couponCode:         activeCoupon?.code,
      couponStoreId:      donationCoupon ? null : activeCoupon?.storeId ?? undefined,
      referralCode:       donationCoupon ? undefined : (getActiveReferralCode() ?? undefined),
    };

    this.guestCheckout.createOrder(body).pipe(take(1)).subscribe({
      next: order => {
        this.submitting.set(false);
        this.guestCart.clear();
        this.store.dispatch(loadCart());
        this.createdOrder.set(order);

        if (order.checkoutUrl) {
          sessionStorage.setItem('guest_order', JSON.stringify(order));
          window.location.href = order.checkoutUrl;
        } else {
          this.step.set(4);
        }
      },
      error: err => {
        this.submitting.set(false);
        const status = err.status;
        const msg    = err.error?.message ?? '';
        if (status === 409) {
          this.submitError.set('Stock insuficiente para uno de los productos. Revisa tu carrito.');
        } else if (status === 400 && msg.toLowerCase().includes('cali')) {
          this.submitError.set('El pago contra entrega solo está disponible para Cali.');
        } else {
          this.submitError.set(msg || 'Ocurrió un error. Intenta nuevamente.');
        }
      },
    });
  }

  // ── Create account post-purchase ─────────────────────────────────────────────
  createAccount() {
    const pwd = this.newPassword().trim();
    if (pwd.length < 6) {
      this.accountError.set('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    this.creatingAccount.set(true);
    this.accountError.set('');
    this.guestCheckout.createAccount({ email: this.email().trim(), password: pwd })
      .pipe(take(1))
      .subscribe({
        next: (res: AuthResponse) => {
          const role = resolveRole(res.storeRoles);
          const user: AuthUser = {
            userId: res.userId,
            name:   res.name,
            email:  res.email,
            role,
            storeRoles: res.storeRoles,
          };
          this.tokenStore.setTokens(res.access_token, res.refresh_token, user);
          this.store.dispatch(loginSuccess({ user }));
          this.creatingAccount.set(false);
          this.accountCreated.set(true);
        },
        error: err => {
          this.accountError.set(err.error?.message ?? 'No se pudo crear la cuenta.');
          this.creatingAccount.set(false);
        },
      });
  }

  paymentMethodLabel(m: PaymentMethod): string {
    const opt = this.paymentOptions.find(o => o.value === m);
    return opt?.label ?? m;
  }
}
