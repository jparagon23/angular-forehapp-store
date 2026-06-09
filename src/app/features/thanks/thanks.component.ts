import { Component, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { isPlatformBrowser, NgIf } from '@angular/common';
import { OrderService } from '../../core/services/order.service';
import { OrderResponse } from '../../core/models/order.model';
import { CurrencyCopPipe } from '../../shared/pipes/currency-cop.pipe';

@Component({
  selector: 'app-thanks',
  standalone: true,
  imports: [RouterLink, NgIf, CurrencyCopPipe],
  templateUrl: './thanks.component.html',
  styleUrl: './thanks.component.scss',
})
export class ThanksComponent implements OnInit {
  private route        = inject(ActivatedRoute);
  private orderService = inject(OrderService);
  private platformId   = inject(PLATFORM_ID);

  loading = true;
  order: OrderResponse | null = null;
  error  = false;

  ngOnInit() {
    const orderId = Number(this.route.snapshot.queryParamMap.get('order_id'));
    if (!orderId) {
      this.loading = false;
      this.error = true;
      return;
    }
    this.orderService.getOrderById(orderId).subscribe({
      next: order => { this.order = order; this.loading = false; },
      error: () => {
        // Guest order: fall back to sessionStorage (browser only)
        if (isPlatformBrowser(this.platformId)) {
          const cached = sessionStorage.getItem('guest_order');
          if (cached) {
            try {
              const parsed = JSON.parse(cached) as OrderResponse;
              if (parsed.orderId === orderId) {
                this.order = parsed;
                sessionStorage.removeItem('guest_order');
                this.loading = false;
                return;
              }
            } catch { /* ignore */ }
          }
        }
        this.loading = false;
        this.error = true;
      },
    });
  }
}
