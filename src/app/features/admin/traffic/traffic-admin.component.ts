import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe, NgFor, NgIf } from '@angular/common';
import { take } from 'rxjs/operators';
import {
  ApexAxisChartSeries, ApexChart, ApexDataLabels, ApexFill, ApexGrid, ApexLegend, ApexStroke, ApexTooltip, ApexXAxis,
  ApexYAxis, NgApexchartsModule,
} from 'ng-apexcharts';
import { AdminTopbarComponent } from '../shared/admin-topbar.component';
import { ReportService } from '../../../core/services/report.service';
import { TrafficReport, TrafficShare } from '../../../core/models/traffic.model';

interface Kpi { label: string; value: string; change: { text: string; good: boolean | null }; hint: string }

const SOURCE_LABELS: Record<string, string> = {
  google: 'Google', instagram: 'Instagram', facebook: 'Facebook', whatsapp: 'WhatsApp', tiktok: 'TikTok',
  direct: 'Directo', referral: 'Otros sitios', search: 'Otros buscadores', x: 'X / Twitter',
  youtube: 'YouTube', email: 'Correo', other: 'Campañas (otras)',
};
const DEVICE_LABELS: Record<string, string> = { mobile: 'Celular', desktop: 'Computador', tablet: 'Tableta' };

@Component({
  selector: 'app-traffic-admin',
  standalone: true,
  imports: [NgFor, NgIf, DatePipe, NgApexchartsModule, AdminTopbarComponent],
  templateUrl: './traffic-admin.component.html',
  styleUrl: './traffic-admin.component.scss',
})
export class TrafficAdminComponent implements OnInit {
  private reports = inject(ReportService);

  readonly PERIODS = [7, 30, 90];
  days    = signal(30);
  data    = signal<TrafficReport | null>(null);
  loading = signal(true);
  error   = signal('');

  kpis = computed<Kpi[]>(() => {
    const d = this.data();
    if (!d) return [];
    const c = d.current, p = d.previous;
    return [
      { label: 'Visitantes', value: this.int(c.visitors), change: this.pct(c.visitors, p.visitors, true),
        hint: 'Personas distintas (navegadores) que entraron' },
      { label: 'Sesiones', value: this.int(c.sessions), change: this.pct(c.sessions, p.sessions, true),
        hint: 'Visitas; una sesión termina tras 30 min sin actividad' },
      { label: 'Tiempo promedio', value: this.duration(c.avgDurationSeconds), change: this.pct(c.avgDurationSeconds, p.avgDurationSeconds, true),
        hint: 'Tiempo con la página abierta y visible, por sesión' },
      { label: 'Páginas por sesión', value: (Number(c.pagesPerSession) || 0).toLocaleString('es-CO', { maximumFractionDigits: 1 }),
        change: this.pct(c.pagesPerSession, p.pagesPerSession, true), hint: 'Cuántas páginas ve cada visita' },
      { label: 'Rebote', value: this.rate(c.bounceRate), change: this.points(c.bounceRate, p.bounceRate, false),
        hint: 'Visitas que se van en menos de 10 s sin ver otra página (menos es mejor)' },
      { label: 'Conversión', value: this.rate(c.conversionRate, 2), change: this.points(c.conversionRate, p.conversionRate, true),
        hint: 'Sesiones que terminan en compra' },
    ];
  });

  funnelSteps = computed(() => {
    const f = this.data()?.funnel;
    if (!f) return [];
    const steps = [
      { label: 'Visitan la tienda', value: f.sessions },
      { label: 'Ven un producto', value: f.viewedProduct },
      { label: 'Agregan al carrito', value: f.addedToCart },
      { label: 'Inician la compra', value: f.reachedCheckout },
      { label: 'Compran', value: f.purchased },
    ];
    return steps.map((s, i) => ({
      ...s,
      width: f.sessions ? Math.max(2, (s.value / f.sessions) * 100) : 0,
      ofTotal: f.sessions ? (s.value / f.sessions) * 100 : 0,
      fromPrev: i > 0 && steps[i - 1].value ? (s.value / steps[i - 1].value) * 100 : null,
    }));
  });

  sources = computed(() => this.withShare(this.data()?.sources ?? [], SOURCE_LABELS));
  devices = computed(() => this.withShare(this.data()?.devices ?? [], DEVICE_LABELS));

  // ── Gráfica visitantes y sesiones por día ────────────────────
  chartSeries = computed<ApexAxisChartSeries>(() => {
    const d = this.data();
    if (!d) return [];
    const byDay = new Map(d.series.map(p => [p.date, p]));
    const visitors: { x: string; y: number }[] = [], sessions: { x: string; y: number }[] = [];
    const [y, m, dd] = d.from.split('-').map(Number);
    for (let i = 0; i < d.days; i++) {
      const day = new Date(y, m - 1, dd + i);
      const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
      const label = day.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
      visitors.push({ x: label, y: byDay.get(key)?.visitors ?? 0 });
      sessions.push({ x: label, y: byDay.get(key)?.sessions ?? 0 });
    }
    return [{ name: 'Visitantes', data: visitors }, { name: 'Sesiones', data: sessions }];
  });
  hasData = computed(() => (this.data()?.current.sessions ?? 0) > 0);

  chart: ApexChart = { type: 'area', height: 260, toolbar: { show: false }, zoom: { enabled: false }, fontFamily: 'inherit' };
  stroke: ApexStroke = { curve: 'smooth', width: 2.5 };
  fill: ApexFill = { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.3, opacityTo: 0.03 } };
  xaxis: ApexXAxis = { type: 'category', tickAmount: 8, labels: { rotate: 0, style: { fontSize: '11px', colors: '#999' } }, axisBorder: { show: false }, axisTicks: { show: false } };
  yaxis: ApexYAxis = { labels: { formatter: (v: number) => Math.round(v).toString(), style: { colors: '#999', fontSize: '11px' } } };
  grid: ApexGrid = { strokeDashArray: 4, borderColor: '#f0f0f0', xaxis: { lines: { show: false } } };
  dataLabels: ApexDataLabels = { enabled: false };
  tooltip: ApexTooltip = { shared: true };
  legend: ApexLegend = { position: 'top', horizontalAlign: 'right' };
  colors = ['#1565c0', '#4caf50'];

  ngOnInit() { this.load(); }

  setDays(days: number) {
    if (days === this.days()) return;
    this.days.set(days);
    this.load();
  }

  load() {
    this.loading.set(true);
    this.error.set('');
    this.reports.getTraffic(this.days()).pipe(take(1)).subscribe({
      next: d => { this.data.set(d); this.loading.set(false); },
      error: () => { this.error.set('No se pudo cargar el tráfico.'); this.loading.set(false); },
    });
  }

  pageLabel(p: { path: string; title: string | null }): string {
    if (p.title) return p.title;
    if (p.path === '/') return 'Inicio';
    if (p.path.startsWith('/checkout')) return 'Checkout';
    return p.path;
  }

  fmtPct(v: number | null, digits = 0): string {
    return v == null ? '—' : `${v.toLocaleString('es-CO', { maximumFractionDigits: digits })}%`;
  }

  private withShare(rows: TrafficShare[], labels: Record<string, string>) {
    const total = rows.reduce((s, r) => s + r.sessions, 0);
    return rows.map(r => ({
      label: labels[r.name] ?? r.name,
      sessions: r.sessions,
      share: total ? (r.sessions / total) * 100 : 0,
      conversion: r.sessions ? (r.purchases / r.sessions) * 100 : 0,
    }));
  }

  /** Cambio relativo; `upIsGood` define el color. */
  private pct(now: number, before: number, upIsGood: boolean) {
    now = Number(now) || 0; before = Number(before) || 0;
    if (before === 0) return now === 0 ? { text: '—', good: null } : { text: 'nuevo', good: true };
    const p = ((now - before) / before) * 100;
    if (Math.abs(p) < 0.5) return { text: '= 0%', good: null };
    return { text: `${p > 0 ? '▲' : '▼'} ${Math.abs(p).toFixed(0)}%`, good: (p > 0) === upIsGood };
  }

  /** Cambio en puntos porcentuales, para tasas. */
  private points(now: number, before: number, upIsGood: boolean) {
    now = Number(now) || 0; before = Number(before) || 0;
    const d = now - before;
    if (Math.abs(d) < 0.05) return { text: '= 0 pts', good: null };
    return { text: `${d > 0 ? '▲' : '▼'} ${Math.abs(d).toLocaleString('es-CO', { maximumFractionDigits: 1 })} pts`, good: (d > 0) === upIsGood };
  }

  private duration(seconds: number): string {
    const s = Math.round(Number(seconds) || 0);
    if (s < 60) return `${s} s`;
    return `${Math.floor(s / 60)} min ${String(s % 60).padStart(2, '0')} s`;
  }

  private rate(v: number, digits = 1): string { return this.fmtPct(Number(v) || 0, digits); }
  private int(v: number): string { return (Number(v) || 0).toLocaleString('es-CO'); }
}
