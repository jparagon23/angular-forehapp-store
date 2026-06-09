import type { Config, Context } from '@netlify/edge-functions';

const PROTECTED_PATHS = ['/seller', '/admin', '/wishlist', '/account', '/orders', '/stores'];

export default async function handler(request: Request, context: Context): Promise<Response> {
  const indexUrl = new URL('/index.html', request.url);
  return fetch(indexUrl.toString());
}

export const config: Config = {
  path: [
    '/seller',
    '/seller/*',
    '/admin',
    '/admin/*',
    '/wishlist',
    '/account',
    '/account/*',
    '/orders',
    '/orders/*',
    '/stores',
    '/stores/*',
  ],
};
