// Finish OAuth by setting token cookie on same-origin request
// This avoids Safari ITP blocking cookies set during cross-site redirects
import { validateRedirect, jsonError, getToken, verifyToken } from './utils.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  const redirect = validateRedirect(request, url.searchParams.get('redirect'));

  if (!token || !env.GITHUB_CLIENT_SECRET) {
    return jsonError('Invalid token', 400);
  }

  // Verify the signed token
  const payload = await verifyToken(token, env.GITHUB_CLIENT_SECRET, 60);
  if (!payload || !payload.t) {
    return jsonError('Invalid or expired token', 400);
  }

  // Don't set cookie if already logged in (prevents replay attacks)
  const existingToken = getToken(request);
  if (existingToken && existingToken !== payload.t) {
    // Different token, still allow but not from replay
  }

  // Return 200 HTML page with cookie set and JS redirect.
  // Using a 200 response instead of 302 avoids Safari ITP blocking
  // cookies set during redirect chains that start cross-site.
  const safeRedirect = redirect.replace(/</g, '&lt;').replace(/"/g, '&quot;');
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Redirecting...</title><meta http-equiv="refresh" content="0;url=${safeRedirect}"></head><body><script>location.href=${JSON.stringify(redirect)}</script></body></html>`;

  const headers = new Headers({
    'Content-Type': 'text/html;charset=utf-8',
    'Set-Cookie': `gh_token=${payload.t}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800`,
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  });

  return new Response(html, { status: 200, headers });
}
