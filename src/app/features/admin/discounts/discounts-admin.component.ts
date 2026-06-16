import { Component, inject, OnInit, signal } from '@angular/core';
import { NgFor, NgIf, NgSwitch, NgSwitchCase, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CouponService } from '../../../core/services/coupon.service';
import { CouponResponse } from '../../../core/models/coupon.model';
import { DonationService } from '../../../core/services/donation.service';
import { Foundation } from '../../../core/models/donation.model';
import { AdminTopbarComponent } from '../shared/admin-topbar.component';

@Component({
  selector: 'app-discounts-admin',
  standalone: true,
  imports: [NgFor, NgIf, NgSwitch, NgSwitchCase, DatePipe, FormsModule, AdminTopbarComponent],
  templateUrl: './discounts-admin.component.html',
  styleUrl: './discounts-admin.component.scss',
})
export class DiscountsAdminComponent implements OnInit {
  private couponService  = inject(CouponService);
  private donationService = inject(DonationService);

  coupons = signal<CouponResponse[]>([]);
  loading = signal(true);
  error   = signal('');
  page    = signal(0);
  total   = signal(0);
  readonly size = 20;

  // Create regular coupon modal
  creatingRegular       = signal(false);
  regError              = signal('');
  regSaving             = signal(false);
  regStoreId            = signal('');
  regCode               = signal('');
  regDescription        = signal('');
  regDiscountType       = signal<'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING'>('PERCENTAGE');
  regDiscountValue      = signal('');
  regMinOrderAmount     = signal('');
  regMaxUses            = signal('');
  regMaxPerUser         = signal('1');
  regValidFrom          = signal('');
  regValidUntil         = signal('');

  // Create donation coupon modal
  creating         = signal(false);
  foundations      = signal<Foundation[]>([]);
  foundLoading     = signal(false);
  createError      = signal('');
  createSaving     = signal(false);
  newCode             = signal('');
  newDescription      = signal('');
  newFoundationId     = signal('');
  newDiscountValue    = signal('');
  newMinOrderAmount   = signal('');
  newMaxUses          = signal('');
  newMaxPerUser       = signal('1');
  newValidFrom        = signal('');
  newValidUntil       = signal('');

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.couponService.getAllCoupons(this.page(), this.size).subscribe({
      next: res => {
        this.coupons.set(res.content);
        this.total.set(res.totalElements);
        this.loading.set(false);
      },
      error: () => { this.error.set('Error al cargar cupones'); this.loading.set(false); },
    });
  }

  nextPage() {
    if ((this.page() + 1) * this.size < this.total()) {
      this.page.update(p => p + 1);
      this.load();
    }
  }

  prevPage() {
    if (this.page() > 0) {
      this.page.update(p => p - 1);
      this.load();
    }
  }

  openCreateRegular() {
    this.creatingRegular.set(true);
    this.regError.set('');
    this.regStoreId.set(''); this.regCode.set(''); this.regDescription.set('');
    this.regDiscountType.set('PERCENTAGE'); this.regDiscountValue.set('');
    this.regMinOrderAmount.set(''); this.regMaxUses.set(''); this.regMaxPerUser.set('1');
    this.regValidFrom.set(''); this.regValidUntil.set('');
  }

  closeCreateRegular() { this.creatingRegular.set(false); this.regError.set(''); }

  submitCreateRegular() {
    const storeId    = parseInt(this.regStoreId(), 10);
    const code       = this.regCode().trim().toUpperCase();
    const type       = this.regDiscountType();
    const value      = type !== 'FREE_SHIPPING' ? parseFloat(this.regDiscountValue()) : undefined;
    const maxPerUser = parseInt(this.regMaxPerUser(), 10);
    const validFrom  = this.regValidFrom();

    if (!storeId || !code || !validFrom || isNaN(maxPerUser) || maxPerUser < 1 ||
        (type !== 'FREE_SHIPPING' && (value === undefined || isNaN(value) || value <= 0))) {
      this.regError.set('Completa todos los campos obligatorios correctamente.');
      return;
    }

    this.regSaving.set(true);
    this.regError.set('');
    this.couponService.createCoupon(storeId, {
      code,
      description:    this.regDescription().trim() || undefined,
      discountType:   type,
      discountValue:  value,
      minOrderAmount: this.regMinOrderAmount() ? Number(this.regMinOrderAmount()) : undefined,
      maxUses:        this.regMaxUses() ? Number(this.regMaxUses()) : undefined,
      maxUsesPerUser: maxPerUser,
      validFrom,
      validUntil:     this.regValidUntil() || undefined,
    }).subscribe({
      next: coupon => {
        this.coupons.update(list => [coupon, ...list]);
        this.closeCreateRegular();
        this.regSaving.set(false);
      },
      error: err => {
        const msg = err.error?.message ?? '';
        this.regError.set(err.status === 409
          ? (msg || 'Ya existe un cupón con ese código en esta tienda.')
          : (msg || 'Error al crear el cupón.'));
        this.regSaving.set(false);
      },
    });
  }

  openCreateDonation() {
    this.creating.set(true);
    this.createError.set('');
    this.resetForm();
    if (this.foundations().length === 0) {
      this.foundLoading.set(true);
      this.donationService.listFoundations().subscribe({
        next: list => { this.foundations.set(list); this.foundLoading.set(false); },
        error: ()   => this.foundLoading.set(false),
      });
    }
  }

  closeCreate() {
    this.creating.set(false);
    this.createError.set('');
    this.resetForm();
  }

  private resetForm() {
    this.newCode.set(''); this.newDescription.set(''); this.newFoundationId.set('');
    this.newDiscountValue.set(''); this.newMinOrderAmount.set('');
    this.newMaxUses.set(''); this.newMaxPerUser.set('1');
    this.newValidFrom.set(''); this.newValidUntil.set('');
  }

  submitCreate() {
    const code         = this.newCode().trim().toUpperCase();
    const foundationId = Number(this.newFoundationId());
    const discountValue = parseFloat(this.newDiscountValue());
    const maxPerUser   = parseInt(this.newMaxPerUser(), 10);
    const validFrom    = this.newValidFrom();

    if (!code || !foundationId || isNaN(discountValue) || discountValue <= 0 || discountValue > 100 || !validFrom || isNaN(maxPerUser) || maxPerUser < 1) {
      this.createError.set('Completa todos los campos obligatorios correctamente.');
      return;
    }

    this.createSaving.set(true);
    this.createError.set('');
    this.couponService.createDonationCoupon({
      code,
      description:    this.newDescription().trim() || undefined,
      discountValue,
      foundationId,
      minOrderAmount: this.newMinOrderAmount() ? Number(this.newMinOrderAmount()) : null,
      maxUses:        this.newMaxUses() ? Number(this.newMaxUses()) : null,
      maxUsesPerUser: maxPerUser,
      validFrom,
      validUntil:     this.newValidUntil() || null,
    }).subscribe({
      next: coupon => {
        this.coupons.update(list => [coupon, ...list]);
        this.closeCreate();
        this.createSaving.set(false);
      },
      error: err => {
        const msg = err.error?.message ?? '';
        this.createError.set(err.status === 409
          ? (msg || 'Ya existe un cupón con ese código.')
          : (msg || 'Error al crear el cupón.'));
        this.createSaving.set(false);
      },
    });
  }

  discountLabel(c: CouponResponse): string {
    if (c.discountType === 'PERCENTAGE')   return `${c.discountValue}%`;
    if (c.discountType === 'FIXED_AMOUNT') return `$${c.discountValue.toLocaleString('es-CO')}`;
    if (c.discountType === 'DONATION')     return `${c.discountValue}% donación`;
    return 'Envío gratis';
  }

  statusIcon(c: CouponResponse): string {
    if (c.status === 'INACTIVE') return 'inactiva';
    if (c.status === 'EXPIRED')  return 'vencida';
    if (c.validUntil && new Date(c.validUntil) < new Date()) return 'vencida';
    return 'activa';
  }

  usesLabel(c: CouponResponse): string {
    return c.maxUses != null ? `${c.usesCount} / ${c.maxUses}` : `${c.usesCount} usos`;
  }

  get totalPages(): number {
    return Math.ceil(this.total() / this.size);
  }
}
