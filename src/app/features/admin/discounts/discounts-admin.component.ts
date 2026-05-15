import { Component, inject, OnInit, signal } from '@angular/core';
import { NgFor, NgIf, NgSwitch, NgSwitchCase, DatePipe } from '@angular/common';
import { CouponService } from '../../../core/services/coupon.service';
import { CouponResponse } from '../../../core/models/coupon.model';
import { AdminTopbarComponent } from '../shared/admin-topbar.component';

@Component({
  selector: 'app-discounts-admin',
  standalone: true,
  imports: [NgFor, NgIf, NgSwitch, NgSwitchCase, DatePipe, AdminTopbarComponent],
  templateUrl: './discounts-admin.component.html',
  styleUrl: './discounts-admin.component.scss',
})
export class DiscountsAdminComponent implements OnInit {
  private couponService = inject(CouponService);

  coupons = signal<CouponResponse[]>([]);
  loading = signal(true);
  error   = signal('');
  page    = signal(0);
  total   = signal(0);
  readonly size = 20;

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

  discountLabel(c: CouponResponse): string {
    return c.discountType === 'PORCENTAJE' ? `${c.discountValue}%` : `$${c.discountValue.toLocaleString('es-CO')}`;
  }

  statusIcon(c: CouponResponse): string {
    if (c.status === 'INACTIVA') return 'inactiva';
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
