import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

const VISITOR_KEY = 'fh_vid';
const SESSION_KEY = 'fh_sess';
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
const PING_MS = 30 * 1000;
/** Paneles internos: no son tráfico de la tienda. */
const INTERNAL = /^\/(admin|seller|ambassador)(\/|$)/;

interface StoredSession { id: string; last: number }

/**
 * Medición anónima de visitas: un id al azar por navegador (visitante) y otro por sesión
 * (30 min sin actividad cierran la sesión). No envía datos personales. Respeta "Do Not Track".
 */
@Injectable({ providedIn: 'root' })
export class TrafficTrackerService {
  private router = inject(Router);
  private browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly url = `${environment.apiBaseUrl}/track`;
  private started = false;
  private onInternalPage = false;

  start() {
    if (!this.browser || this.started || this.optedOut()) return;
    this.started = true;

    this.router.events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(e => this.pageView(e.urlAfterRedirects));

    // Tiempo en la página: solo mientras la pestaña está visible
    setInterval(() => {
      if (document.visibilityState === 'visible') this.ping();
    }, PING_MS);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') this.ping();
    });
  }

  addToCart() { this.event('add_to_cart'); }

  purchase(orderId: number | null | undefined) { this.event('purchase', orderId != null ? { o: orderId } : {}); }

  // ── Internos ──────────────────────────────────────────────────

  private pageView(url: string) {
    const path = url.split(/[?#]/)[0] || '/';
    this.onInternalPage = INTERNAL.test(path);
    if (this.onInternalPage) return;

    const { id, isNew } = this.session();
    const payload: Record<string, unknown> = { v: this.visitor(), s: id, t: 'pageview', p: path };
    if (isNew) {
      // Origen de la visita: solo al abrir la sesión
      const params = new URLSearchParams(location.search);
      payload['r'] = document.referrer || undefined;
      payload['us'] = params.get('utm_source') || undefined;
      payload['um'] = params.get('utm_medium') || undefined;
      payload['uc'] = params.get('utm_campaign') || undefined;
    }
    this.send(payload);
  }

  private ping() {
    if (this.onInternalPage) return;
    const stored = this.readSession();
    if (!stored || Date.now() - stored.last > SESSION_TIMEOUT_MS) return;
    this.touch(stored.id);
    this.send({ v: this.visitor(), s: stored.id, t: 'ping' });
  }

  private event(type: string, extra: Record<string, unknown> = {}) {
    if (!this.started) return;
    const stored = this.readSession();
    if (!stored) return;
    this.touch(stored.id);
    this.send({ v: this.visitor(), s: stored.id, t: type, ...extra });
  }

  private session(): { id: string; isNew: boolean } {
    const stored = this.readSession();
    if (stored && Date.now() - stored.last <= SESSION_TIMEOUT_MS) {
      this.touch(stored.id);
      return { id: stored.id, isNew: false };
    }
    const id = this.uuid();
    this.touch(id);
    return { id, isNew: true };
  }

  private visitor(): string {
    let id = this.safeGet(VISITOR_KEY);
    if (!id) {
      id = this.uuid();
      this.safeSet(VISITOR_KEY, id);
    }
    return id;
  }

  private readSession(): StoredSession | null {
    try {
      const raw = this.safeGet(SESSION_KEY);
      return raw ? JSON.parse(raw) as StoredSession : null;
    } catch {
      return null;
    }
  }

  private touch(id: string) {
    this.safeSet(SESSION_KEY, JSON.stringify({ id, last: Date.now() }));
  }

  /** text/plain evita el preflight de CORS; keepalive deja salir el evento aunque se cierre la página. */
  private send(payload: Record<string, unknown>) {
    try {
      fetch(this.url, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'text/plain' },
        keepalive: true,
        credentials: 'omit',
      }).catch(() => {});
    } catch {
      // Medir nunca debe romper la tienda
    }
  }

  private optedOut(): boolean {
    const nav = navigator as Navigator & { msDoNotTrack?: string };
    return nav.doNotTrack === '1' || (window as unknown as { doNotTrack?: string }).doNotTrack === '1' || nav.msDoNotTrack === '1';
  }

  private uuid(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
  }

  private safeGet(key: string): string | null {
    try { return localStorage.getItem(key); } catch { return null; }
  }

  private safeSet(key: string, value: string) {
    try { localStorage.setItem(key, value); } catch { /* modo privado */ }
  }
}
