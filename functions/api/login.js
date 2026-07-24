// Redirect to GitHub OAuth authorization
import { validateRedirect } from './utils.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const redirect = validateRedirect(request, url.searchParams.get('redirect'));
  const state = crypto.randomUUID();

  const githubUrl = new URL('https://github.com/login/oauth/authorize');
  githubUrl.searchParams.set('client_id', env.GITHUB_CLIENT_ID);
  githubUrl.searchParams.set('redirect_uri', `${url.origin}/api/auth`);
  githubUrl.searchParams.set('scope', 'repo');
  githubUrl.searchParams.set('state', state);
  githubUrl.searchParams.set('allow_signup', 'true');

  const headers = new Headers();
  headers.append('Location', githubUrl.toString());
  headers.append('Set-Cookie', `gh_state=${state}; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=600`);
  headers.append('Set-Cookie', `gh_redirect=${encodeURIComponent(redirect)}; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=600`);
  headers.append('X-Content-Type-Options', 'nosniff');
  headers.append('X-Frame-Options', 'DENY');
  headers.append('Referrer-Policy', 'strict-origin-when-cross-origin');

  return new Response(null, { status: 302, headers });
}
