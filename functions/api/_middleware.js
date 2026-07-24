// Security headers and CSRF middleware for all /api/* functions
import { requireSameOrigin, getSecurityHeaders } from './utils.js';

export async function onRequest(context) {
  const { request, next } = context;

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
  for (const [key, value] of Object.entries(securityHeaders)) {
    newResponse.headers.set(key, value);
  }
  return newResponse;
}
