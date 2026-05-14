import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';
import { OrderService } from '../../core/services/order.service';
import { OrderResponse } from '../../core/models/order.model';

@Component({
  selector: 'app-payment-failure',
  standalone: true,
  imports: [RouterLink, NgIf],
  templateUrl: './payment-failure.component.html',
  styleUrl: './payment-failure.component.scss',
})
export class PaymentFailureComponent implements OnInit {
  private route        = inject(ActivatedRoute);
  private orderService = inject(OrderService);

  loading = true;
  order: OrderResponse | null = null;

  ngOnInit() {
    const orderId = Number(this.route.snapshot.queryParamMap.get('order_id'));
    if (!orderId) { this.loading = false; return; }
    this.orderService.getOrderById(orderId).subscribe({
      next: order => { this.order = order; this.loading = false; },
      error: ()    => { this.loading = false; },
    });
  }
}
