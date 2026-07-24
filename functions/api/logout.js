// Clear GitHub auth cookie
import { validateRedirect } from './utils.js';

export async function onRequestGet(context) {
  const { request } = context;
  const url = new URL(request.url);
  const redirect = validateRedirect(request, url.searchParams.get('redirect'));

  const headers = new Headers();
  headers.append('Location', redirect);
  headers.append('Set-Cookie', 'gh_token=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
  headers.append('X-Content-Type-Options', 'nosniff');
  headers.append('X-Frame-Options', 'DENY');
  headers.append('Referrer-Policy', 'strict-origin-when-cross-origin');

  return new Response(null, { status: 302, headers });
}
