import { Component, computed, inject, OnInit } from '@angular/core';
import { AsyncPipe, NgFor, NgIf, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  ApexAxisChartSeries, ApexChart, ApexXAxis, ApexYAxis,
  ApexDataLabels, ApexGrid, ApexTooltip, ApexPlotOptions,
  NgApexchartsModule,
} from 'ng-apexcharts';

import { loadSellerProducts } from '../../../store/seller/seller.actions';
import { selectSellerProducts, selectSellerLoading } from '../../../store/seller/seller.selectors';
import { CurrencyCopPipe } from '../../../shared/pipes/currency-cop.pipe';
import { ReportService } from '../../../core/services/report.service';
import { DateRange, GroupBy, ReportSummary, TopProduct } from '../../../core/models/report.model';

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
  imports: [AsyncPipe, NgFor, NgIf, NgClass, FormsModule, RouterLink, NgApexchartsModule, CurrencyCopPipe],
  templateUrl: './seller-stats.component.html',
  styleUrl: './seller-stats.component.scss',
})
export class SellerStatsComponent implements OnInit {
  private svc   = inject(ReportService);
  private store = inject(Store);

  presets      = PRESETS;
  activePreset = 'last30';
  customFrom   = '';
  customTo     = '';
  showCustom   = false;

  loading = false;
  error   = false;

  summary: ReportSummary | null = null;
  topProducts: TopProduct[]     = [];

  /* NgRx — stock del catálogo propio */
  private products  = toSignal(this.store.select(selectSellerProducts), { initialValue: [] });
  catalogLoading$   = this.store.select(selectSellerLoading);
  activeProducts    = computed(() => this.products().filter(p => p.status === 'ACTIVE').length);
  totalProducts     = computed(() => this.products().length);
  outOfStock        = computed(() => this.products().filter(p => p.status === 'OUT_OF_STOCK').length);
  lowStock          = computed(() => this.products().flatMap(p => p.variants).filter(v => v.stock > 0 && v.stock <= 5).length);

  /* ── ApexCharts: top productos (horizontal bar) ─── */
  prodSeries: ApexAxisChartSeries = [];
  prodChart: ApexChart = {
    type: 'bar', height: 250,
    toolbar: { show: false }, fontFamily: 'inherit',
  };
  prodPlot: ApexPlotOptions    = { bar: { horizontal: true, barHeight: '58%', borderRadius: 5 } };
  prodXaxis: ApexXAxis         = { labels: { formatter: (v: string) => this.fmtShort(Number(v)), style: { fontSize: '11px', colors: '#999' } } };
  prodYaxis: ApexYAxis         = { labels: { style: { fontSize: '12px' } } };
  prodDataLabels: ApexDataLabels = { enabled: false };
  prodGrid: ApexGrid           = { strokeDashArray: 4, borderColor: '#f0f0f0', yaxis: { lines: { show: false } } };
  prodTooltip: ApexTooltip     = { y: { formatter: (v: number) => '$' + v.toLocaleString('es-CO') } };
  prodColors                   = ['#66bb6a'];

  ngOnInit() {
    this.store.dispatch(loadSellerProducts());
    this.loadReport('last30');
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
    const items = [...data].reverse();
    this.prodSeries = items.length
      ? [{ name: 'Ingresos', data: items.map(p => ({ x: p.productTitle, y: p.revenue })) }]
      : [];
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
