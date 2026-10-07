import { Component, computed, effect, inject, signal } from '@angular/core';
import { DecimalPipe, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { take } from 'rxjs/operators';
import { AssistedOrderService } from '../../../../core/services/assisted-order.service';
import { GuestCheckoutService } from '../../../../core/services/guest-checkout.service';
import { LocationService } from '../../../../core/services/location.service';
import { SellerProductService } from '../../../../core/services/seller-product.service';
import { AssistedCustomer, OrderResponse, PaymentMethod } from '../../../../core/models/order.model';
import { ShippingEstimateResponse } from '../../../../core/models/cart.model';
import { City, Country, State } from '../../../../core/models/location.model';
import { ProductVariant, SellerProduct, isSellable } from '../../../../core/models/seller-product.model';
import { apiCode, apiMessage } from '../../../../core/models/api-error.model';
import { CouponValidationResponse } from '../../../../core/models/coupon.model';
import { emailValidator } from '../../../../core/utils/email.utils';
import { selectActiveSellerStoreId } from '../../../../store/seller/seller.selectors';
import { CurrencyCopPipe } from '../../../../shared/pipes/currency-cop.pipe';

interface OrderLine {
  variantId: number;
  productTitle: string;
  variantLabel: string;
  price: number;
  /** Tope de unidades; null = sin tope (dropship con proveedor disponible). */
  max: number | null;
  quantity: number;
}

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string; hint: string }[] = [
  { value: 'CASH_ON_DELIVERY', label: 'Contraentrega',  hint: 'Paga al recibir (solo Cali)' },
  { value: 'TRANSFER',         label: 'Transferencia',  hint: 'Confirmas el pago cuando lo recibas' },
  { value: 'CASH',             label: 'Efectivo',       hint: 'Confirmas el pago cuando lo recibas' },
  { value: 'MERCADO_PAGO',     label: 'Link de MercadoPago', hint: 'Te damos el link para enviárselo' },
];

@Component({
  selector: 'app-assisted-order',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule, RouterLink, DecimalPipe, CurrencyCopPipe],
  templateUrl: './assisted-order.component.html',
  styleUrl: './assisted-order.component.scss',
})
export class AssistedOrderComponent {
  private assistedService = inject(AssistedOrderService);
  private checkoutService = inject(GuestCheckoutService);
  private locationService = inject(LocationService);
  private productService  = inject(SellerProductService);
  private ngrx            = inject(Store);
  private storeId = toSignal(this.ngrx.select(selectActiveSellerStoreId), { initialValue: null });

  readonly paymentOptions = PAYMENT_OPTIONS;

  // ── Cliente ──────────────────────────────────────────────────
  email        = signal('');
  emailConfirm = signal('');
  name         = signal('');
  lastname     = signal('');
  phone        = signal('');
  customer     = signal<AssistedCustomer | null>(null);
  lookingUp    = signal(false);

  emailValid   = computed(() => emailValidator({ value: this.email().trim() } as any) === null && !!this.email().trim());
  emailsMatch  = computed(() => this.email().trim().toLowerCase() === this.emailConfirm().trim().toLowerCase());

  // ── Productos ────────────────────────────────────────────────
  products        = signal<SellerProduct[]>([]);
  productQuery    = signal('');
  openProduct     = signal<SellerProduct | null>(null);
  openVariants    = signal<ProductVariant[]>([]);
  loadingVariants = signal(false);
  lines           = signal<OrderLine[]>([]);

  productMatches = computed(() => {
    const q = this.normalize(this.productQuery());
    if (!q) return [];
    return this.products()
      .filter(p => p.status === 'ACTIVE' || p.status === 'OUT_OF_STOCK' || p.status === 'DRAFT')
      .filter(p => this.normalize(`${p.title} ${p.brand}`).includes(q))
      .slice(0, 8);
  });
  itemsTotal = computed(() => this.lines().reduce((sum, l) => sum + l.price * l.quantity, 0));

  // ── Envío ────────────────────────────────────────────────────
  countries         = signal<Country[]>([]);
  states            = signal<State[]>([]);
  cities            = signal<City[]>([]);
  countryId         = signal<number | null>(null);
  stateId           = signal<number | null>(null);
  cityId            = signal<number | null>(null);
  address           = signal('');
  complement        = signal('');
  reference         = signal('');
  estimate          = signal<ShippingEstimateResponse | null>(null);
  estimating        = signal(false);
  estimateError     = signal('');

  isCali = computed(() => this.normalize(this.cities().find(c => c.id === this.cityId())?.name ?? '') === 'cali');

  // ── Pago ─────────────────────────────────────────────────────
  paymentMethod = signal<PaymentMethod | null>(null);
  alreadyPaid   = signal(false);
  dataConsent   = signal(false);

  canBeAlreadyPaid = computed(() => this.paymentMethod() === 'CASH' || this.paymentMethod() === 'TRANSFER');

  // ── Cupón ────────────────────────────────────────────────────
  couponInput    = signal('');
  coupon         = signal<CouponValidationResponse | null>(null);
  couponError    = signal('');
  validatingCoupon = signal(false);

  couponDiscount = computed(() => {
    const c = this.coupon();
    return c && !c.isDonation ? c.discountAmount : 0;
  });

  total = computed(() => {
    const est = this.estimate();
    if (!est) return null;
    const afterCoupon = Math.max(0, est.grandTotal - this.couponDiscount());
    if (this.paymentMethod() !== 'MERCADO_PAGO') return afterCoupon;
    // El recargo de MercadoPago se calcula sobre el total ya con el descuento
    const rate = est.grandTotal > 0 ? est.mercadoPagoSurcharge / est.grandTotal : 0;
    return Math.round(afterCoupon * (1 + rate) * 100) / 100;
  });

  // ── Envío del formulario ─────────────────────────────────────
  reviewing   = signal(false);
  submitting  = signal(false);
  submitError = signal('');
  created     = signal<OrderResponse | null>(null);
  copied      = signal(false);

  missing = computed(() => {
    const m: string[] = [];
    if (!this.emailValid()) m.push('correo válido');
    else if (!this.emailsMatch()) m.push('confirmar el correo');
    if (!this.name().trim() || !this.lastname().trim()) m.push('nombre y apellido');
    if (!this.phone().trim()) m.push('teléfono');
    if (!this.lines().length) m.push('al menos un producto');
    if (!this.cityId() || !this.address().trim()) m.push('ciudad y dirección');
    if (!this.paymentMethod()) m.push('método de pago');
    if (!this.dataConsent()) m.push('autorización de datos');
    return m;
  });

  constructor() {
    effect(() => {
      const storeId = this.storeId();
      if (!storeId) return;
      this.productService.getSellerProducts(storeId).pipe(take(1))
        .subscribe(ps => this.products.set(ps));
    }, { allowSignalWrites: true });

    this.locationService.getCountries().pipe(take(1)).subscribe(cs => {
      this.countries.set(cs);
      const colombia = cs.find(c => c.code === 'CO' || this.normalize(c.name) === 'colombia');
      if (colombia) this.onCountryChange(colombia.id);
    });
  }

  // ── Cliente ──────────────────────────────────────────────────

  onEmailBlur() {
    const storeId = this.storeId();
    this.customer.set(null);
    if (!storeId || !this.emailValid()) return;
    this.lookingUp.set(true);
    this.assistedService.lookupCustomer(storeId, this.email().trim()).pipe(take(1)).subscribe({
      next: c => { this.customer.set(c); this.lookingUp.set(false); },
      error: () => this.lookingUp.set(false),
    });
  }

  // ── Productos ────────────────────────────────────────────────

  pickProduct(p: SellerProduct) {
    const storeId = this.storeId();
    if (!storeId) return;
    this.openProduct.set(p);
    this.openVariants.set([]);
    this.loadingVariants.set(true);
    this.productService.getProduct(storeId, p.id).pipe(take(1)).subscribe({
      next: detail => {
        this.openVariants.set(detail.variants.filter(v => v.active));
        this.loadingVariants.set(false);
      },
      error: () => this.loadingVariants.set(false),
    });
  }

  readonly isSellable = isSellable;

  stockLabel(v: ProductVariant): string {
    if (!v.dropship) return `stock ${v.stock}`;
    return v.supplierAvailable === false ? `stock ${v.stock} · proveedor agotado` : `stock ${v.stock} + proveedor`;
  }

  variantLabel(v: ProductVariant): string {
    const attrs = v.attributes.map(a => `${a.attribute}: ${a.value}`).join(' · ');
    return attrs || v.sku || `Variante #${v.id}`;
  }

  addVariant(v: ProductVariant) {
    const product = this.openProduct();
    if (!product || !isSellable(v)) return;
    const existing = this.lines().find(l => l.variantId === v.id);
    if (existing) {
      this.setQuantity(v.id, existing.quantity + 1);
    } else {
      this.lines.update(ls => [...ls, {
        variantId: v.id, productTitle: product.title, variantLabel: this.variantLabel(v),
        price: v.price, quantity: 1,
        max: v.dropship && v.supplierAvailable !== false ? null : v.stock,
      }]);
      this.refreshEstimate();
    }
  }

  setQuantity(variantId: number, quantity: number) {
    this.lines.update(ls => ls.map(l => l.variantId === variantId
      ? { ...l, quantity: Math.max(1, Math.min(Math.floor(quantity) || 1, l.max ?? Number.MAX_SAFE_INTEGER)) }
      : l));
    this.refreshEstimate();
  }

  removeLine(variantId: number) {
    this.lines.update(ls => ls.filter(l => l.variantId !== variantId));
    this.refreshEstimate();
  }

  closeProduct() {
    this.openProduct.set(null);
    this.productQuery.set('');
  }

  // ── Envío ────────────────────────────────────────────────────

  onCountryChange(id: number | string) {
    const cid = Number(id) || null;
    this.countryId.set(cid);
    this.stateId.set(null);
    this.cityId.set(null);
    this.states.set([]);
    this.cities.set([]);
    this.estimate.set(null);
    if (!cid) return;
    this.locationService.getStates(cid).pipe(take(1)).subscribe(ss => this.states.set(ss));
  }

  onStateChange(id: number | string) {
    const sid = Number(id) || null;
    this.stateId.set(sid);
    this.cityId.set(null);
    this.cities.set([]);
    this.estimate.set(null);
    if (!sid) return;
    this.locationService.getCities(sid).pipe(take(1)).subscribe(cs => this.cities.set(cs));
  }

  onCityChange(id: number | string) {
    this.cityId.set(Number(id) || null);
    if (this.paymentMethod() === 'CASH_ON_DELIVERY' && !this.isCali()) this.paymentMethod.set(null);
    this.refreshEstimate();
  }

  private refreshEstimate() {
    const cityId = this.cityId();
    const items = this.lines().map(l => ({ variantId: l.variantId, quantity: l.quantity }));
    this.estimate.set(null);
    this.estimateError.set('');
    if (!cityId || !items.length) return;
    this.estimating.set(true);
    this.checkoutService.estimateShipping({ cityId, items }).pipe(take(1)).subscribe({
      next: est => {
        this.estimate.set(est);
        this.estimating.set(false);
        // Productos o envío cambiaron: el descuento hay que recalcularlo
        if (this.coupon()) this.applyCoupon(this.coupon()!.code);
      },
      error: err => {
        this.estimateError.set(apiMessage(err, 'No se pudo calcular el envío.'));
        this.estimating.set(false);
      },
    });
  }

  // ── Cupón ────────────────────────────────────────────────────

  applyCoupon(code = this.couponInput()) {
    const storeId = this.storeId();
    const est = this.estimate();
    const clean = code.trim().toUpperCase();
    this.couponError.set('');
    if (!clean) return;
    if (!storeId || !est || !this.emailValid()) {
      this.couponError.set('Primero ingresa el correo del cliente, los productos y la ciudad.');
      return;
    }
    this.validatingCoupon.set(true);
    this.assistedService.validateCoupon(storeId, {
      email: this.email().trim(), code: clean, orderAmount: est.itemsTotal, shippingCost: est.shippingTotal,
    }).pipe(take(1)).subscribe({
      next: res => {
        this.coupon.set(res);
        this.couponInput.set(res.code);
        this.validatingCoupon.set(false);
      },
      error: err => {
        this.coupon.set(null);
        this.validatingCoupon.set(false);
        this.couponError.set(apiCode(err) === 'COUPON_NOT_FOUND'
          ? 'Ese cupón no existe.'
          : this.couponMessage(apiMessage(err, 'No se pudo aplicar el cupón.')));
      },
    });
  }

  removeCoupon() {
    this.coupon.set(null);
    this.couponInput.set('');
    this.couponError.set('');
  }

  couponLabel(c: CouponValidationResponse): string {
    if (c.isDonation) return `Cupón de donación${c.foundationName ? ' (' + c.foundationName + ')' : ''}`;
    if (c.discountType === 'FREE_SHIPPING') return 'Envío gratis';
    if (c.discountType === 'PERCENTAGE') return `${c.discountValue}% de descuento`;
    return 'Descuento';
  }

  /** Los mensajes del back vienen en inglés; traducimos los de las reglas de cupón. */
  private couponMessage(msg: string): string {
    if (msg.includes('already used')) return 'El cliente ya usó este cupón.';
    if (msg.includes('expired')) return 'El cupón está vencido.';
    if (msg.includes('not yet valid')) return 'El cupón todavía no está vigente.';
    if (msg.includes('not active')) return 'El cupón no está activo.';
    if (msg.includes('not valid for this store')) return 'El cupón no es válido para esta tienda.';
    if (msg.includes('usage limit')) return 'El cupón ya alcanzó su límite de usos.';
    if (msg.includes('minimum')) return 'El pedido no alcanza el monto mínimo del cupón.';
    if (msg.includes('assigned to a specific user')) return 'Este cupón está asignado a otro cliente.';
    return msg;
  }

  // ── Pago ─────────────────────────────────────────────────────

  selectPayment(m: PaymentMethod) {
    if (m === 'CASH_ON_DELIVERY' && !this.isCali()) return;
    this.paymentMethod.set(m);
    if (m !== 'CASH' && m !== 'TRANSFER') this.alreadyPaid.set(false);
  }

  paymentLabel(m: PaymentMethod | null): string {
    return PAYMENT_OPTIONS.find(o => o.value === m)?.label ?? '';
  }

  // ── Crear ────────────────────────────────────────────────────

  review() {
    this.submitError.set('');
    if (this.missing().length) return;
    this.reviewing.set(true);
  }

  submit() {
    const storeId = this.storeId();
    const cityId = this.cityId();
    const method = this.paymentMethod();
    if (!storeId || !cityId || !method) return;
    this.submitting.set(true);
    this.submitError.set('');
    this.assistedService.placeOrder(storeId, {
      email: this.email().trim(),
      name: this.name().trim(),
      lastname: this.lastname().trim(),
      phone: this.phone().trim(),
      shippingAddress: this.address().trim(),
      shippingCityId: cityId,
      shippingComplement: this.complement().trim() || undefined,
      shippingReference: this.reference().trim() || undefined,
      items: this.lines().map(l => ({ variantId: l.variantId, quantity: l.quantity })),
      paymentMethod: method,
      alreadyPaid: this.canBeAlreadyPaid() && this.alreadyPaid(),
      dataConsent: this.dataConsent(),
      couponCode: this.coupon()?.code,
    }).pipe(take(1)).subscribe({
      next: order => {
        this.submitting.set(false);
        this.reviewing.set(false);
        this.created.set(order);
      },
      error: err => {
        this.submitting.set(false);
        this.reviewing.set(false);
        this.submitError.set(this.errorMessage(err));
      },
    });
  }

  copyLink(url: string) {
    navigator.clipboard?.writeText(url).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2500);
    });
  }

  startOver() {
    this.created.set(null);
    this.email.set(''); this.emailConfirm.set(''); this.name.set(''); this.lastname.set(''); this.phone.set('');
    this.customer.set(null);
    this.lines.set([]);
    this.address.set(''); this.complement.set(''); this.reference.set('');
    this.paymentMethod.set(null); this.alreadyPaid.set(false); this.dataConsent.set(false);
    this.estimate.set(null);
    this.removeCoupon();
  }

  private errorMessage(err: unknown): string {
    switch (apiCode(err)) {
      case 'ORDER_INSUFFICIENT_STOCK':          return 'No hay stock suficiente de uno de los productos. Ajusta las cantidades.';
      case 'ORDER_ADDRESS_STORE_MISMATCH':      return 'La contraentrega solo está disponible para envíos a Cali.';
      case 'ASSISTED_ORDER_CONSENT_REQUIRED':   return 'Falta la autorización del cliente para usar sus datos.';
      case 'ASSISTED_ORDER_ALREADY_PAID_METHOD': return '"Ya pagó" solo aplica a efectivo o transferencia.';
      case 'ASSISTED_ORDER_VARIANT_NOT_IN_STORE': return 'Uno de los productos no pertenece a esta tienda.';
      case 'STORE_ACCESS_DENIED':               return 'Solo el dueño o el administrador de la tienda puede registrar pedidos.';
      case 'COUPON_NOT_FOUND':                  return 'El cupón no existe.';
      case 'COUPON_INVALID':                    return this.couponMessage(apiMessage(err, 'El cupón no es válido.'));
      default:                                  return apiMessage(err, 'No se pudo crear el pedido.');
    }
  }

  private normalize(text: string): string {
    return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  }
}
