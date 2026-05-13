import { Component, computed, inject, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { loadSellerProducts } from '../../../store/seller/seller.actions';
import { selectSellerProducts, selectSellerLoading } from '../../../store/seller/seller.selectors';
import { CurrencyCopPipe } from '../../../shared/pipes/currency-cop.pipe';

interface TopProduct { name: string; sold: number; revenue: number; pct: number; }

// Derived from mock orders — same data as seller-orders component
const TOP_PRODUCTS: TopProduct[] = [
  { name: 'Wilson Pro Staff 97',        sold: 3, revenue: 1050000, pct: 100 },
  { name: 'Nike Dri-FIT Camiseta',      sold: 5, revenue:  445000, pct:  42 },
  { name: 'Wilson Clash 100',           sold: 1, revenue:  280000, pct:  27 },
  { name: 'Head Prestige MP',           sold: 1, revenue:  320000, pct:  30 },
  { name: 'Wilson Ultra Tour',          sold: 1, revenue:  195000, pct:  19 },
];

const MOCK_REVENUE      = 2_450_000;
const MOCK_ORDERS_COUNT = 7;
const MOCK_ORDERS_PREV  = 5;  // previous month, for delta

@Component({
  selector: 'app-seller-stats',
  standalone: true,
  imports: [AsyncPipe, NgFor, NgIf, CurrencyCopPipe],
  templateUrl: './seller-stats.component.html',
  styleUrl: './seller-stats.component.scss',
})
export class SellerStatsComponent implements OnInit {
  private store = inject(Store);

  private products = toSignal(this.store.select(selectSellerProducts), { initialValue: [] });
  loading$         = this.store.select(selectSellerLoading);

  readonly revenue        = MOCK_REVENUE;
  readonly ordersMonth    = MOCK_ORDERS_COUNT;
  readonly ordersDelta    = MOCK_ORDERS_COUNT - MOCK_ORDERS_PREV;
  readonly topProducts    = TOP_PRODUCTS;

  activeProducts   = computed(() => this.products().filter(p => p.status === 'ACTIVE').length);
  totalProducts    = computed(() => this.products().length);
  outOfStock       = computed(() => this.products().filter(p => p.status === 'OUT_OF_STOCK').length);
  lowStockVariants = computed(() =>
    this.products().flatMap(p => p.variants).filter(v => v.stock > 0 && v.stock <= 5).length
  );

  ngOnInit() { this.store.dispatch(loadSellerProducts()); }
}
