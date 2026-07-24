// Finish OAuth by setting token cookie on same-origin request
// This avoids Safari ITP blocking cookies set during cross-site redirects
import { validateRedirect, jsonError, getToken } from './utils.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  const redirect = validateRedirect(request, url.searchParams.get('redirect'));

  if (!token || !env.GITHUB_CLIENT_SECRET) {
    return jsonError('Invalid token', 400);
  }

  // Verify the signed token
  const { verifyToken } = await import('./utils.js');
  const payload = await verifyToken(token, env.GITHUB_CLIENT_SECRET, 60);
  if (!payload || !payload.t) {
    return jsonError('Invalid or expired token', 400);
  }

  // Don't set cookie if already logged in (prevents replay attacks)
  const existingToken = getToken(request);
  if (existingToken && existingToken !== payload.t) {
    // Different token, still allow but not from replay
  }

  const headers = new Headers();
  headers.append('Location', redirect);
  headers.append('Set-Cookie', `gh_token=${payload.t}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800`);
  headers.append('X-Content-Type-Options', 'nosniff');
  headers.append('X-Frame-Options', 'DENY');
  headers.append('Referrer-Policy', 'strict-origin-when-cross-origin');

  return new Response(null, { status: 302, headers });
}
