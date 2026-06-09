import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { environment } from '../../../environments/environment';

const SITE_NAME = 'ForehApp Store';
const SITE_URL  = environment.siteUrl;
const DEFAULT_DESC = 'Tienda online de tenis en Colombia. Raquetas, zapatillas, ropa y accesorios de las mejores marcas. Envíos a todo el país.';
const DEFAULT_IMG  = `${SITE_URL}/assets/og-default.jpg`;

export interface SeoConfig {
  title: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'product';
}

@Injectable({ providedIn: 'root' })
export class SeoService {
  private titleSvc   = inject(Title);
  private meta       = inject(Meta);
  private doc        = inject(DOCUMENT);
  private platformId = inject(PLATFORM_ID);

  set(cfg: SeoConfig) {
    const full = cfg.title.includes(SITE_NAME) ? cfg.title : `${cfg.title} | ${SITE_NAME}`;
    const desc = cfg.description ?? DEFAULT_DESC;
    const img  = cfg.image       ?? DEFAULT_IMG;
    const url  = cfg.url         ?? SITE_URL;
    const type = cfg.type        ?? 'website';

    this.titleSvc.setTitle(full);

    const tags: { [k: string]: string } = {
      'description':         desc,
      'og:title':            full,
      'og:description':      desc,
      'og:image':            img,
      'og:url':              url,
      'og:type':             type,
      'og:site_name':        SITE_NAME,
      'twitter:card':        'summary_large_image',
      'twitter:title':       full,
      'twitter:description': desc,
      'twitter:image':       img,
    };

    for (const [key, content] of Object.entries(tags)) {
      const isOg = key.startsWith('og:') || key.startsWith('twitter:');
      if (isOg) this.meta.updateTag({ property: key, content });
      else      this.meta.updateTag({ name: key, content });
    }
  }

  setJsonLd(data: Record<string, unknown>) {
    if (!isPlatformBrowser(this.platformId)) return;
    let script = this.doc.querySelector<HTMLScriptElement>('script[data-seo="ld"]');
    if (!script) {
      script = this.doc.createElement('script');
      script.type = 'application/ld+json';
      script.dataset['seo'] = 'ld';
      this.doc.head.appendChild(script);
    }
    script.text = JSON.stringify(data);
  }

  clearJsonLd() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.doc.querySelector('script[data-seo="ld"]')?.remove();
  }
}
