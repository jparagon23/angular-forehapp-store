import { Component, inject, OnInit, signal } from '@angular/core';
import { NgClass, NgFor, NgIf, NgSwitch, NgSwitchCase, DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { CouponService } from '../../../core/services/coupon.service';
import {
  CouponResponse,
  CreateCouponRequest,
  DiscountType,
  UpdateCouponRequest,
} from '../../../core/models/coupon.model';
import { CurrencyCopPipe } from '../../../shared/pipes/currency-cop.pipe';
import { selectActiveSellerStoreId } from '../../../store/seller/seller.selectors';

@Component({
  selector: 'app-seller-coupons',
  standalone: true,
  imports: [NgClass, NgFor, NgIf, NgSwitch, NgSwitchCase, DatePipe, ReactiveFormsModule, CurrencyCopPipe],
  templateUrl: './seller-coupons.component.html',
  styleUrl: './seller-coupons.component.scss',
})
export class SellerCouponsComponent implements OnInit {
  private couponService = inject(CouponService);
  private fb            = inject(FormBuilder);
  private ngrx          = inject(Store);

  private storeId = toSignal(this.ngrx.select(selectActiveSellerStoreId), { initialValue: null });

  coupons   = signal<CouponResponse[]>([]);
  loading   = signal(true);
  saving    = signal(false);
  error     = signal('');
  formError = signal('');
  showForm  = signal(false);

  form = this.fb.group({
    code:           ['', [Validators.required, Validators.maxLength(50)]],
    description:    [''],
    discountType:   ['PERCENTAGE' as DiscountType, Validators.required],
    discountValue:  [null as number | null, [Validators.min(0.01)]],
    minOrderAmount: [null as number | null],
    maxUses:        [null as number | null],
    maxUsesPerUser: [1, [Validators.required, Validators.min(1)]],
    validFrom:      ['', Validators.required],
    validUntil:     [''],
  });

  ngOnInit() { this.load(); }

  load() {
    const storeId = this.storeId();
    if (!storeId) { this.loading.set(false); return; }
    this.loading.set(true);
    this.couponService.getMyCoupons(storeId).subscribe({
      next: page => { this.coupons.set(page.content); this.loading.set(false); },
      error: ()   => { this.error.set('Error al cargar cupones'); this.loading.set(false); },
    });
  }

  openCreate() {
    this.form.reset({ discountType: 'PERCENTAGE', maxUsesPerUser: 1 });
    this.formError.set('');
    this.showForm.set(true);
  }

  closeForm() { this.showForm.set(false); this.formError.set(''); }

  get isShipping(): boolean {
    return this.form.get('discountType')?.value === 'FREE_SHIPPING';
  }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const v = this.form.getRawValue();
    const isFreeShipping = v.discountType === 'FREE_SHIPPING';
    if (!isFreeShipping && !v.discountValue) {
      this.formError.set('El valor del descuento es requerido para este tipo de cupón.');
      return;
    }
    this.saving.set(true);
    this.formError.set('');

    const req: CreateCouponRequest = {
      code:           v.code!.toUpperCase(),
      description:    v.description || undefined,
      discountType:   v.discountType as DiscountType,
      discountValue:  isFreeShipping ? undefined : v.discountValue!,
      minOrderAmount: v.minOrderAmount ?? undefined,
      maxUses:        v.maxUses ?? undefined,
      maxUsesPerUser: v.maxUsesPerUser!,
      validFrom:      v.validFrom!,
      validUntil:     v.validUntil || undefined,
    };

    const storeId = this.storeId();
    if (!storeId) { this.saving.set(false); return; }
    this.couponService.createCoupon(storeId, req).subscribe({
      next: () => { this.saving.set(false); this.closeForm(); this.load(); },
      error: err => {
        const msg = err?.error?.message ?? 'Error al crear el cupón';
        this.formError.set(msg);
        this.saving.set(false);
      },
    });
  }

  deactivate(c: CouponResponse) {
    const storeId = this.storeId();
    if (!storeId) return;
    this.couponService.deactivateCoupon(storeId, c.couponId).subscribe({
      next: updated => this.coupons.update(list => list.map(x => x.couponId === updated.couponId ? updated : x)),
    });
  }

  usesLabel(c: CouponResponse): string {
    return c.maxUses != null ? `${c.usesCount} / ${c.maxUses}` : `${c.usesCount} usos`;
  }

  discountLabel(c: CouponResponse): string {
    if (c.discountType === 'PERCENTAGE')   return `${c.discountValue}%`;
    if (c.discountType === 'FIXED_AMOUNT') return `$${c.discountValue.toLocaleString('es-CO')}`;
    return 'Envío gratis';
  }

  statusIcon(c: CouponResponse): 'activa' | 'vencida' | 'inactiva' {
    if (c.status === 'INACTIVE') return 'inactiva';
    if (c.status === 'EXPIRED')  return 'vencida';
    if (c.validUntil && new Date(c.validUntil) < new Date()) return 'vencida';
    return 'activa';
  }

  hasError(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c.touched);
  }
}
