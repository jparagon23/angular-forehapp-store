import { inject, Injectable } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { environment } from '../../../environments/environment';

const SITE_NAME = 'Forehapp Store';
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
  private titleSvc = inject(Title);
  private meta     = inject(Meta);

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
    let script = document.querySelector<HTMLScriptElement>('script[data-seo="ld"]');
    if (!script) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      script.dataset['seo'] = 'ld';
      document.head.appendChild(script);
    }
    script.text = JSON.stringify(data);
  }

  clearJsonLd() {
    document.querySelector('script[data-seo="ld"]')?.remove();
  }
}
