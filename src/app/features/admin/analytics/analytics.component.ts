import { Component, inject, OnInit } from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import {
  ApexAxisChartSeries, ApexChart, ApexXAxis, ApexYAxis,
  ApexDataLabels, ApexStroke, ApexFill, ApexGrid,
  ApexTooltip, ApexPlotOptions, NgApexchartsModule,
} from 'ng-apexcharts';

import { AdminTopbarComponent } from '../shared/admin-topbar.component';
import { CurrencyCopPipe } from '../../../shared/pipes/currency-cop.pipe';
import { ReportService } from '../../../core/services/report.service';
import { DateRange, GroupBy, ReportSummary, RevenuePoint, SellerSales, TopProduct } from '../../../core/models/report.model';

interface Preset { label: string; key: string; }

const PRESETS: Preset[] = [
  { label: 'Hoy',       key: 'today'      },
  { label: '7 días',    key: 'last7'      },
  { label: '30 días',   key: 'last30'     },
  { label: 'Este mes',  key: 'thisMonth'  },
  { label: 'Mes ant.',  key: 'lastMonth'  },
];

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, FormsModule, NgApexchartsModule, AdminTopbarComponent, CurrencyCopPipe],
  templateUrl: './analytics.component.html',
  styleUrl: './analytics.component.scss',
})
export class AnalyticsComponent implements OnInit {
  private svc = inject(ReportService);

  presets = PRESETS;
  activePreset = 'last30';
  customFrom = '';
  customTo   = '';
  showCustom = false;

  loading = false;
  error   = false;

  summary: ReportSummary | null = null;
  topProducts: TopProduct[]     = [];
  sellers: SellerSales[]        = [];

  /* ── ApexCharts: ingresos ─────────────────────────── */
  revSeries: ApexAxisChartSeries = [];
  revChart: ApexChart = {
    type: 'area', height: 290,
    toolbar: { show: false }, zoom: { enabled: false },
    fontFamily: 'inherit', sparkline: { enabled: false },
  };
  revStroke: ApexStroke     = { curve: 'smooth', width: 2.5 };
  revFill: ApexFill         = { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.03 } };
  revXaxis: ApexXAxis       = { type: 'category', labels: { rotate: -35, style: { fontSize: '11px', colors: '#999' } }, axisBorder: { show: false }, axisTicks: { show: false } };
  revYaxis: ApexYAxis       = { labels: { formatter: (v: number) => this.fmt(v), style: { colors: '#999', fontSize: '11px' } }, axisBorder: { show: false } };
  revGrid: ApexGrid         = { strokeDashArray: 4, borderColor: '#f0f0f0', xaxis: { lines: { show: false } } };
  revDataLabels: ApexDataLabels = { enabled: false };
  revTooltip: ApexTooltip   = { y: { formatter: (v: number) => this.fmt(v) } };
  revColors                 = ['#4caf50'];

  /* ── ApexCharts: top productos ────────────────────── */
  prodSeries: ApexAxisChartSeries = [];
  prodChart: ApexChart = {
    type: 'bar', height: 260,
    toolbar: { show: false }, fontFamily: 'inherit',
  };
  prodPlot: ApexPlotOptions = { bar: { horizontal: true, barHeight: '60%', borderRadius: 5 } };
  prodXaxis: ApexXAxis      = { type: 'category', labels: { formatter: (v: string) => this.fmt(Number(v)), style: { fontSize: '11px', colors: '#999' } } };
  prodYaxis: ApexYAxis      = { labels: { style: { fontSize: '12px' } } };
  prodDataLabels: ApexDataLabels = { enabled: false };
  prodTooltip: ApexTooltip  = { y: { formatter: (v: number) => this.fmt(v) } };
  prodColors                = ['#66bb6a'];
  prodGrid: ApexGrid        = { strokeDashArray: 4, borderColor: '#f0f0f0', yaxis: { lines: { show: false } } };

  ngOnInit() { this.load('last30'); }

  select(key: string) {
    if (key === 'custom') { this.showCustom = !this.showCustom; return; }
    this.activePreset = key;
    this.showCustom   = false;
    this.load(key);
  }

  applyCustom() {
    if (!this.customFrom || !this.customTo) return;
    this.activePreset = 'custom';
    this.showCustom   = false;
    this.load('custom');
  }

  private load(key: string) {
    const range = this.buildRange(key);
    const groupBy = this.autoGroupBy(range);
    this.loading = true;
    this.error   = false;

    forkJoin({
      summary:     this.svc.getAdminSummary(range),
      revenue:     this.svc.getAdminRevenue(range, groupBy),
      topProducts: this.svc.getAdminTopProducts(range, 8),
      sellers:     this.svc.getAdminSellers(range),
    }).subscribe({
      next: ({ summary, revenue, topProducts, sellers }) => {
        this.summary     = summary;
        this.topProducts = topProducts;
        this.sellers     = sellers;
        this.buildRevChart(revenue);
        this.buildProdChart(topProducts);
        this.loading = false;
      },
      error: () => { this.loading = false; this.error = true; },
    });
  }

  private buildRevChart(data: RevenuePoint[]) {
    this.revSeries = data.length
      ? [{ name: 'Ingresos', data: data.map(d => ({ x: d.period, y: d.revenue })) }]
      : [];
  }

  private buildProdChart(data: TopProduct[]) {
    const items = [...data].reverse();
    this.prodSeries = items.length
      ? [{ name: 'Ingresos', data: items.map(p => ({ x: p.productTitle, y: p.revenue })) }]
      : [];
  }

  private autoGroupBy(range: DateRange): GroupBy {
    const days = Math.ceil((new Date(range.to).getTime() - new Date(range.from).getTime()) / 86400000) + 1;
    if (days <= 60)  return 'DAY';
    if (days <= 365) return 'WEEK';
    return 'MONTH';
  }

  private buildRange(key: string): DateRange {
    const today = new Date();
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    switch (key) {
      case 'today':     return { from: fmt(today), to: fmt(today) };
      case 'last7':   { const f = new Date(today); f.setDate(f.getDate() - 6); return { from: fmt(f), to: fmt(today) }; }
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

  fmt(v: number) {
    if (v >= 1_000_000) return '$' + (v / 1_000_000).toFixed(1) + 'M';
    if (v >= 1_000)     return '$' + (v / 1_000).toFixed(0) + 'k';
    return '$' + v.toLocaleString('es-CO');
  }

  topMax() { return this.topProducts[0]?.unitsSold ?? 1; }
}
