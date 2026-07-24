// Handle GitHub OAuth callback
import { validateRedirect, jsonError, signToken } from './utils.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const debug = url.searchParams.get('debug') === '1';

  const cookieHeader = request.headers.get('Cookie') || '';
  const stateMatch = cookieHeader.match(/gh_state=([^;]+)/);
  const savedState = stateMatch ? stateMatch[1] : '';
  const redirectMatch = cookieHeader.match(/gh_redirect=([^;]+)/);
  const redirect = redirectMatch ? validateRedirect(request, decodeURIComponent(redirectMatch[1])) : '/blogs/';

  if (!code || !state || state !== savedState) {
    return jsonError('Invalid or missing OAuth state', 400);
  }

  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code
    })
  });

  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    return jsonError('GitHub authentication failed', 400);
  }

  // Sign a short-lived token and redirect to same-origin /api/finish-auth
  // This avoids Safari ITP blocking cookies set during cross-site redirects
  const now = Math.floor(Date.now() / 1000);
  const signedToken = await signToken(
    { t: tokenData.access_token, iat: now, exp: now + 60 },
    env.GITHUB_CLIENT_SECRET
  );

  const finishUrl = new URL('/api/finish-auth', url.origin);
  finishUrl.searchParams.set('token', signedToken);
  finishUrl.searchParams.set('redirect', redirect);

  if (debug) {
    return new Response(JSON.stringify({
      success: true,
      token_prefix: tokenData.access_token.slice(0, 8) + '...',
      finish_url: finishUrl.toString(),
      redirect: redirect
    }, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
      }
    });
  }

  const headers = new Headers();
  headers.append('Location', finishUrl.toString());
  headers.append('Set-Cookie', 'gh_state=; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=0');
  headers.append('Set-Cookie', 'gh_redirect=; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=0');
  headers.append('X-Content-Type-Options', 'nosniff');
  headers.append('X-Frame-Options', 'DENY');
  headers.append('Referrer-Policy', 'strict-origin-when-cross-origin');

  return new Response(null, { status: 302, headers });
}
