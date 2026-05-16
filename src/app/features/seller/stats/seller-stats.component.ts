import { Component, computed, inject, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { AsyncPipe, NgFor, NgIf, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import ApexCharts from 'apexcharts';

import { loadSellerProducts } from '../../../store/seller/seller.actions';
import { selectSellerProducts, selectSellerLoading } from '../../../store/seller/seller.selectors';
import { CurrencyCopPipe } from '../../../shared/pipes/currency-cop.pipe';
import { ReportService } from '../../../core/services/report.service';
import { DateRange, ReportSummary, TopProduct } from '../../../core/models/report.model';

interface Preset { label: string; key: string; }
const PRESETS: Preset[] = [
  { label: 'Hoy',      key: 'today'     },
  { label: '7 días',   key: 'last7'     },
  { label: '30 días',  key: 'last30'    },
  { label: 'Este mes', key: 'thisMonth' },
  { label: 'Mes ant.', key: 'lastMonth' },
];

@Component({
  selector: 'app-seller-stats',
  standalone: true,
  imports: [AsyncPipe, NgFor, NgIf, NgClass, FormsModule, RouterLink, CurrencyCopPipe],
  templateUrl: './seller-stats.component.html',
  styleUrl: './seller-stats.component.scss',
})
export class SellerStatsComponent implements OnInit, OnDestroy {
  private svc   = inject(ReportService);
  private store = inject(Store);

  @ViewChild('apexChart') apexChartEl?: ElementRef;
  private chartInstance?: ApexCharts;

  presets      = PRESETS;
  activePreset = 'last30';
  customFrom   = '';
  customTo     = '';
  showCustom   = false;

  loading = false;
  error   = false;

  summary: ReportSummary | null = null;
  topProducts: TopProduct[]     = [];

  private products  = toSignal(this.store.select(selectSellerProducts), { initialValue: [] });
  catalogLoading$   = this.store.select(selectSellerLoading);
  activeProducts    = computed(() => this.products().filter(p => p.status === 'ACTIVE').length);
  totalProducts     = computed(() => this.products().length);
  outOfStock        = computed(() => this.products().filter(p => p.status === 'OUT_OF_STOCK').length);
  lowStock          = computed(() => this.products().flatMap(p => p.variants).filter(v => v.stock > 0 && v.stock <= 5).length);

  ngOnInit() {
    this.store.dispatch(loadSellerProducts());
    this.loadReport('last30');
  }

  ngOnDestroy() {
    this.chartInstance?.destroy();
  }

  select(key: string) {
    if (key === 'custom') { this.showCustom = !this.showCustom; return; }
    this.activePreset = key;
    this.showCustom   = false;
    this.loadReport(key);
  }

  applyCustom() {
    if (!this.customFrom || !this.customTo) return;
    this.activePreset = 'custom';
    this.showCustom   = false;
    this.loadReport('custom');
  }

  private loadReport(key: string) {
    const range = this.buildRange(key);
    this.loading = true;
    this.error   = false;

    this.svc.getSellerSummary(range).subscribe({
      next: s => { this.summary = s; },
      error: () => { this.error = true; },
    });

    this.svc.getSellerTopProducts(range, 8).subscribe({
      next: products => {
        this.topProducts = products;
        this.buildChart(products);
        this.loading = false;
      },
      error: () => { this.loading = false; this.error = true; },
    });
  }

  private buildChart(data: TopProduct[]) {
    this.chartInstance?.destroy();
    this.chartInstance = undefined;

    if (!data.length) return;

    const items = [...data].reverse();
    const options = {
      series: [{ name: 'Ingresos', data: items.map(p => ({ x: p.productTitle, y: p.revenue })) }],
      chart: { type: 'bar' as const, height: 250, toolbar: { show: false }, fontFamily: 'inherit' },
      plotOptions: { bar: { horizontal: true, barHeight: '58%', borderRadius: 5 } },
      xaxis: { labels: { formatter: (v: string) => this.fmtShort(Number(v)), style: { fontSize: '11px', colors: ['#999'] } } },
      yaxis: { labels: { style: { fontSize: '12px' } } },
      dataLabels: { enabled: false },
      grid: { strokeDashArray: 4, borderColor: '#f0f0f0', yaxis: { lines: { show: false } } },
      tooltip: { y: { formatter: (v: number) => '$' + v.toLocaleString('es-CO') } },
      colors: ['#66bb6a'],
    };

    // setTimeout lets Angular render the #apexChart div before we mount the chart
    setTimeout(() => {
      if (this.apexChartEl) {
        this.chartInstance = new ApexCharts(this.apexChartEl.nativeElement, options);
        this.chartInstance.render();
      }
    }, 0);
  }

  private buildRange(key: string): DateRange {
    const today = new Date();
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    switch (key) {
      case 'today':     return { from: fmt(today), to: fmt(today) };
      case 'last7':   { const f = new Date(today); f.setDate(f.getDate() - 6);  return { from: fmt(f), to: fmt(today) }; }
      case 'last30':  { const f = new Date(today); f.setDate(f.getDate() - 29); return { from: fmt(f), to: fmt(today) }; }
      case 'thisMonth': return { from: fmt(new Date(today.getFullYear(), today.getMonth(), 1)), to: fmt(today) };
      case 'lastMonth': return {
        from: fmt(new Date(today.getFullYear(), today.getMonth() - 1, 1)),
        to:   fmt(new Date(today.getFullYear(), today.getMonth(), 0)),
      };
      case 'custom': return { from: this.customFrom, to: this.customTo };
      default: return { from: fmt(today), to: fmt(today) };
    }
  }

  fmtShort(v: number): string {
    if (v >= 1_000_000) return '$' + (v / 1_000_000).toFixed(1) + 'M';
    if (v >= 1_000)     return '$' + (v / 1_000).toFixed(0) + 'k';
    return '$' + v;
  }

  topMax() { return this.topProducts[0]?.unitsSold ?? 1; }
}
