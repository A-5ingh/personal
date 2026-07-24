// Test cookie setting and reading on same-origin redirect
import { jsonResponse } from './utils.js';

export async function onRequestGet(context) {
  const { request } = context;
  const url = new URL(request.url);
  const action = url.searchParams.get('action') || 'set';

  if (action === 'set') {
    const headers = new Headers();
    headers.append('Location', '/api/set-cookie?action=check');
    headers.append('Set-Cookie', 'gh_test=dummy-value; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=60');
    headers.append('X-Content-Type-Options', 'nosniff');
    headers.append('X-Frame-Options', 'DENY');
    headers.append('Referrer-Policy', 'strict-origin-when-cross-origin');
    return new Response(null, { status: 302, headers });
  }

  const cookieHeader = request.headers.get('Cookie') || '';
  const hasTest = cookieHeader.includes('gh_test=dummy-value');
  return jsonResponse({
    hasTestCookie: hasTest,
    cookieHeader: cookieHeader.replace(/gh_token=[^;]+/, 'gh_token=***'),
    userAgent: request.headers.get('User-Agent')
  });
}
