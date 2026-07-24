// Temporary diagnostic endpoint: returns request context (no secrets exposed)
import { getToken, isSameOrigin } from './utils.js';

export async function onRequest(context) {
  const { request } = context;
  const token = getToken(request);

  const headers = {};
  for (const [key, value] of request.headers.entries()) {
    if (key.toLowerCase() === 'cookie') {
      headers[key] = token ? 'gh_token=***; ...' : '(no gh_token)';
    } else if (key.toLowerCase().includes('auth')) {
      headers[key] = '***';
    } else {
      headers[key] = value;
    }
  }

  return new Response(JSON.stringify({
    url: request.url,
    method: request.method,
    origin: request.headers.get('Origin'),
    referer: request.headers.get('Referer'),
    secFetchSite: request.headers.get('Sec-Fetch-Site'),
    sameOrigin: isSameOrigin(request),
    hasToken: !!token,
    tokenPrefix: token ? token.slice(0, 8) + '...' : null,
    headers: headers
  }, null, 2), { headers: { 'Content-Type': 'application/json' } });
}
