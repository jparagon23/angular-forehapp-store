import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe, NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { take } from 'rxjs/operators';
import {
  ApexAxisChartSeries, ApexChart, ApexDataLabels, ApexFill, ApexGrid, ApexStroke, ApexTooltip, ApexXAxis, ApexYAxis,
  NgApexchartsModule,
} from 'ng-apexcharts';
import { AdminTopbarComponent } from '../shared/admin-topbar.component';
import { CurrencyCopPipe } from '../../../shared/pipes/currency-cop.pipe';
import { ReportService } from '../../../core/services/report.service';
import { AdminDashboard, Metric } from '../../../core/models/admin-dashboard.model';

interface Kpi { icon: string; label: string; value: string; change: Change; hint?: string }
interface Change { text: string; up: boolean | null }
interface Alert { text: string; link?: string; tone: 'warn' | 'info' | 'bad' }

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [NgFor, NgIf, DatePipe, DecimalPipe, RouterLink, NgApexchartsModule, AdminTopbarComponent, CurrencyCopPipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private reports = inject(ReportService);
  private money = new CurrencyCopPipe();

  readonly PERIODS = [7, 30, 90];
  days    = signal(30);
  data    = signal<AdminDashboard | null>(null);
  loading = signal(true);
  error   = signal('');

  kpis = computed<Kpi[]>(() => {
    const d = this.data();
    if (!d) return [];
    const k = d.kpis;
    const profitHint = k.itemsWithoutCost > 0
      ? `${k.itemsWithoutCost} de ${k.soldItems} productos vendidos no tienen costo y no entran en la ganancia`
      : undefined;
    return [
      { icon: '💰', label: 'Ventas', value: this.cop(k.revenue.value), change: this.change(k.revenue) },
      { icon: '📦', label: 'Pedidos', value: this.int(k.orders.value), change: this.change(k.orders) },
      { icon: '🧾', label: 'Ticket promedio', value: this.cop(k.averageTicket.value), change: this.change(k.averageTicket) },
      { icon: '📈', label: 'Ganancia', value: this.cop(k.profit.value), change: this.change(k.profit), hint: profitHint },
      { icon: '🛍️', label: 'Compradores', value: this.int(k.buyers.value), change: this.change(k.buyers) },
      { icon: '👥', label: 'Usuarios nuevos', value: this.int(k.newUsers.value), change: this.change(k.newUsers) },
    ];
  });

  /** Lo que hay que atender, solo lo que no está en cero. */
  alerts = computed<Alert[]>(() => {
    const d = this.data();
    if (!d) return [];
    const o = d.operations, c = d.catalog, a: Alert[] = [];
    if (o.toPrepare)       a.push({ tone: 'warn', text: `${o.toPrepare} pedido(s) pagado(s) por preparar`, link: '/seller/orders' });
    if (o.toShip)          a.push({ tone: 'warn', text: `${o.toShip} pedido(s) en preparación por enviar`, link: '/seller/orders' });
    if (o.awaitingPayment) a.push({ tone: 'info', text: `${o.awaitingPayment} pedido(s) esperando pago (${this.cop(o.awaitingPaymentAmount)})`, link: '/seller/orders' });
    if (o.balancesDue)     a.push({ tone: 'warn', text: `${o.balancesDue} pedido(s) con diferencia por saldar tras una edición (${this.cop(o.balancesDueAmount)})`, link: '/seller/orders' });
    if (d.reviews.pending) a.push({ tone: 'info', text: `${d.reviews.pending} reseña(s) por moderar`, link: '/admin/reviews' });
    if (c.variantsWithoutCost) a.push({ tone: 'info', text: `${c.variantsWithoutCost} variante(s) activa(s) sin costo: no se puede calcular su ganancia`, link: '/seller/products' });
    if (c.lowOwnStock)     a.push({ tone: 'warn', text: `${c.lowOwnStock} variante(s) de stock propio con 5 unidades o menos`, link: '/seller/products' });
    const s = d.supplierSync;
    if (s?.status === 'ABORTED') {
      a.push({ tone: 'bad', text: `La última sincronización con Profitness se detuvo: ${s.abortReason ?? 'revisar'}`, link: '/seller/supplier-sync' });
    } else if (s && this.hoursSince(s.startedAt) > 30) {
      a.push({ tone: 'bad', text: `La sincronización con Profitness no corre desde el ${new Date(s.startedAt).toLocaleDateString('es-CO')}`, link: '/seller/supplier-sync' });
    }
    return a;
  });

  // ── Gráfica de ventas por día (días sin ventas en 0) ─────────
  chartSeries = computed<ApexAxisChartSeries>(() => {
    const d = this.data();
    if (!d) return [];
    const byDay = new Map(d.series.map(p => [p.date, Number(p.revenue)]));
    const points: { x: string; y: number }[] = [];
    const [y, m, dd] = d.period.from.split('-').map(Number);
    for (let i = 0; i < d.period.days; i++) {
      const day = new Date(y, m - 1, dd + i);
      const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
      points.push({ x: day.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }), y: byDay.get(key) ?? 0 });
    }
    return [{ name: 'Ventas', data: points }];
  });
  hasSales = computed(() => (this.data()?.series.length ?? 0) > 0);

  chart: ApexChart = { type: 'area', height: 260, toolbar: { show: false }, zoom: { enabled: false }, fontFamily: 'inherit' };
  stroke: ApexStroke = { curve: 'smooth', width: 2.5 };
  fill: ApexFill = { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.03 } };
  xaxis: ApexXAxis = { type: 'category', tickAmount: 8, labels: { rotate: 0, style: { fontSize: '11px', colors: '#999' } }, axisBorder: { show: false }, axisTicks: { show: false } };
  yaxis: ApexYAxis = { labels: { formatter: (v: number) => this.cop(v), style: { colors: '#999', fontSize: '11px' } } };
  grid: ApexGrid = { strokeDashArray: 4, borderColor: '#f0f0f0', xaxis: { lines: { show: false } } };
  dataLabels: ApexDataLabels = { enabled: false };
  tooltip: ApexTooltip = { y: { formatter: (v: number) => this.cop(v) } };
  colors = ['#4caf50'];

  ngOnInit() { this.load(); }

  setDays(days: number) {
    if (days === this.days()) return;
    this.days.set(days);
    this.load();
  }

  load() {
    this.loading.set(true);
    this.error.set('');
    this.reports.getAdminDashboard(this.days()).pipe(take(1)).subscribe({
      next: d => { this.data.set(d); this.loading.set(false); },
      error: () => { this.error.set('No se pudo cargar el dashboard.'); this.loading.set(false); },
    });
  }

  statusLabel(o: AdminDashboard['recentOrders'][number]): { text: string; css: string } {
    if (o.status === 'CANCELLED') return { text: 'Cancelado', css: 's-canceled' };
    if (o.status === 'PAID' || o.status === 'PAYMENT_CONFIRMED') return { text: 'Pagado', css: 's-done' };
    if (o.paymentMethod === 'CASH_ON_DELIVERY') return { text: 'Contraentrega', css: 's-shipped' };
    return { text: 'Pago pendiente', css: 's-pending' };
  }

  paymentLabel(method: string): string {
    return ({ MERCADO_PAGO: 'MercadoPago', TRANSFER: 'Transferencia', CASH: 'Efectivo', CASH_ON_DELIVERY: 'Contraentrega' } as Record<string, string>)[method] ?? method;
  }

  private change(m: Metric): Change {
    const now = Number(m.value) || 0, before = Number(m.previous) || 0;
    if (before === 0) return now === 0 ? { text: '—', up: null } : { text: 'nuevo', up: true };
    const pct = ((now - before) / Math.abs(before)) * 100;
    if (Math.abs(pct) < 0.5) return { text: '= 0%', up: null };
    return { text: `${pct > 0 ? '▲' : '▼'} ${Math.abs(pct).toFixed(0)}%`, up: pct > 0 };
  }

  private hoursSince(iso: string): number {
    return (Date.now() - new Date(iso).getTime()) / 3_600_000;
  }

  private cop(v: number): string { return this.money.transform(Math.round(Number(v) || 0)); }
  private int(v: number): string { return (Number(v) || 0).toLocaleString('es-CO'); }
}
