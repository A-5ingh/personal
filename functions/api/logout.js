// Clear GitHub auth cookie
import { validateRedirect } from './utils.js';

export async function onRequestGet(context) {
  const { request } = context;
  const url = new URL(request.url);
  const redirect = validateRedirect(request, url.searchParams.get('redirect'));

  const headers = new Headers();
  headers.append('Location', redirect);
  headers.append('Set-Cookie', 'gh_token=; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=0');

  return new Response(null, { status: 302, headers });
}
