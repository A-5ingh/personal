// Clear GitHub auth cookie
import { validateRedirect } from './utils.js';

export async function onRequestGet(context) {
  const { request } = context;
  const url = new URL(request.url);
  const redirect = validateRedirect(request, url.searchParams.get('redirect'));

  const safeRedirect = redirect.replace(/</g, '&lt;').replace(/"/g, '&quot;');
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Signed out</title></head><body><p>Signed out. Redirecting...</p><script>setTimeout(function(){location.href=${JSON.stringify(redirect)}},500)</script></body></html>`;

  const headers = new Headers({
    'Content-Type': 'text/html;charset=utf-8',
    'Set-Cookie': 'gh_token=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:01 GMT',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  });

  return new Response(html, { status: 200, headers });
}
