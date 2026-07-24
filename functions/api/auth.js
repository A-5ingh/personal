// Handle GitHub OAuth callback
import { validateRedirect, jsonResponse, jsonError } from './utils.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

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

  const headers = new Headers();
  headers.append('Location', redirect);
  headers.append('Set-Cookie', `gh_token=${tokenData.access_token}; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=604800`);
  headers.append('Set-Cookie', 'gh_state=; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=0');
  headers.append('Set-Cookie', 'gh_redirect=; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=0');

  return new Response(null, { status: 302, headers });
}
