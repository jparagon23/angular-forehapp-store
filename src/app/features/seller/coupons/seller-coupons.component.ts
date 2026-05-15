import { Component, inject, OnInit, signal } from '@angular/core';
import { NgFor, NgIf, NgSwitch, NgSwitchCase, DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CouponService } from '../../../core/services/coupon.service';
import {
  CouponResponse,
  CreateCouponRequest,
  DiscountType,
  UpdateCouponRequest,
} from '../../../core/models/coupon.model';
import { CurrencyCopPipe } from '../../../shared/pipes/currency-cop.pipe';

@Component({
  selector: 'app-seller-coupons',
  standalone: true,
  imports: [NgFor, NgIf, NgSwitch, NgSwitchCase, DatePipe, ReactiveFormsModule, CurrencyCopPipe],
  templateUrl: './seller-coupons.component.html',
  styleUrl: './seller-coupons.component.scss',
})
export class SellerCouponsComponent implements OnInit {
  private couponService = inject(CouponService);
  private fb            = inject(FormBuilder);

  coupons  = signal<CouponResponse[]>([]);
  loading  = signal(true);
  saving   = signal(false);
  error    = signal('');
  formError = signal('');

  showForm  = signal(false);
  editId    = signal<number | null>(null);

  form = this.fb.group({
    code:           ['', [Validators.required, Validators.maxLength(50)]],
    description:    [''],
    discountType:   ['PORCENTAJE' as DiscountType, Validators.required],
    discountValue:  [null as number | null, [Validators.required, Validators.min(0.01)]],
    minOrderAmount: [null as number | null],
    maxUses:        [null as number | null],
    maxUsesPerUser: [1, [Validators.required, Validators.min(1)]],
    validFrom:      ['', Validators.required],
    validUntil:     [''],
  });

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.couponService.getMyCoupons().subscribe({
      next: page => { this.coupons.set(page.content); this.loading.set(false); },
      error: ()   => { this.error.set('Error al cargar cupones'); this.loading.set(false); },
    });
  }

  openCreate() {
    this.form.reset({ discountType: 'PORCENTAJE', maxUsesPerUser: 1 });
    this.editId.set(null);
    this.formError.set('');
    this.showForm.set(true);
  }

  closeForm() { this.showForm.set(false); this.formError.set(''); }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const v = this.form.getRawValue();
    this.saving.set(true);
    this.formError.set('');

    const req: CreateCouponRequest = {
      code:           v.code!.toUpperCase(),
      description:    v.description || undefined,
      discountType:   v.discountType as DiscountType,
      discountValue:  v.discountValue!,
      minOrderAmount: v.minOrderAmount ?? undefined,
      maxUses:        v.maxUses ?? undefined,
      maxUsesPerUser: v.maxUsesPerUser!,
      validFrom:      v.validFrom!,
      validUntil:     v.validUntil || undefined,
    };

    this.couponService.createCoupon(req).subscribe({
      next: () => { this.saving.set(false); this.closeForm(); this.load(); },
      error: err => {
        const msg = err?.error?.message ?? 'Error al crear el cupón';
        this.formError.set(msg);
        this.saving.set(false);
      },
    });
  }

  deactivate(c: CouponResponse) {
    this.couponService.deactivateCoupon(c.couponId).subscribe({
      next: updated => this.coupons.update(list => list.map(x => x.couponId === updated.couponId ? updated : x)),
    });
  }

  reactivate(c: CouponResponse) {
    this.couponService.reactivateCoupon(c.couponId).subscribe({
      next: updated => this.coupons.update(list => list.map(x => x.couponId === updated.couponId ? updated : x)),
    });
  }

  usesLabel(c: CouponResponse): string {
    return c.maxUses != null ? `${c.usesCount} / ${c.maxUses}` : `${c.usesCount} usos`;
  }

  discountLabel(c: CouponResponse): string {
    return c.discountType === 'PORCENTAJE' ? `${c.discountValue}%` : `$${c.discountValue.toLocaleString('es-CO')}`;
  }

  statusIcon(c: CouponResponse): string {
    if (c.status === 'INACTIVA') return 'inactiva';
    if (c.validUntil && new Date(c.validUntil) < new Date()) return 'vencida';
    return 'activa';
  }

  hasError(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c.touched);
  }
}
