import type { Config, Context } from '@netlify/edge-functions';

// CDN cache: 60s fresco, hasta 5min stale-while-revalidate
// Browser:   siempre va al CDN (no caché local)
const CDN_CACHE   = 'public, s-maxage=60, stale-while-revalidate=300';
const BROWSER_CC  = 'public, max-age=0, must-revalidate';

export default async function handler(request: Request, context: Context): Promise<Response> {
  const response = await context.next();

  const cached = new Response(response.body, {
    status:  response.status,
    headers: response.headers,
  });

  // Cookies prevent CDN caching — public SSR pages don't need them
  cached.headers.delete('set-cookie');
  cached.headers.set('Cache-Control',             BROWSER_CC);
  cached.headers.set('Netlify-CDN-Cache-Control', CDN_CACHE);

  return cached;
}

export const config: Config = {
  // Solo rutas públicas cuyo contenido no depende de sesión de usuario
  path: ['/'],
};
