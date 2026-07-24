// Security headers and CSRF middleware for all /api/* functions
import { requireSameOrigin, getSecurityHeaders } from './utils.js';

export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  // Auth endpoints manage their own headers and cookies; skip middleware
  if (path === '/api/auth' || path === '/api/finish-auth' || path === '/api/login' || path === '/api/logout' || path === '/api/set-cookie') {
    return next();
  }

  // Block cross-origin requests for state-changing methods
  if (request.method === 'POST' || request.method === 'DELETE' || request.method === 'PUT') {
    const blocked = requireSameOrigin(request);
    if (blocked) return blocked;
  }

  const securityHeaders = getSecurityHeaders(request);

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: securityHeaders
    });
  }

  const response = await next();
  const newResponse = new Response(response.body, response);

  // Cloudflare Workers: preserve all Set-Cookie headers explicitly
  const setCookies = response.headers.getSetCookie ? response.headers.getSetCookie() : [];
  if (setCookies.length > 0) {
    newResponse.headers.delete('Set-Cookie');
    for (const cookie of setCookies) {
      newResponse.headers.append('Set-Cookie', cookie);
    }
  }

  for (const [key, value] of Object.entries(securityHeaders)) {
    newResponse.headers.set(key, value);
  }
  return newResponse;
}
