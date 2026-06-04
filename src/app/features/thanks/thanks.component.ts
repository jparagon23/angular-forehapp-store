import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';
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
        // Guest order: user is not authenticated, fall back to sessionStorage
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
        this.loading = false;
        this.error = true;
      },
    });
  }
}
