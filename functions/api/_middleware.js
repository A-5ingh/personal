// Security headers middleware for all /api/* functions
import { requireSameOrigin } from './utils.js';

export async function onRequest(context) {
  const { request, next } = context;

  // Block cross-origin requests for state-changing methods
  if (request.method === 'POST' || request.method === 'DELETE' || request.method === 'PUT') {
    const blocked = requireSameOrigin(request);
    if (blocked) return blocked;
  }

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
      }
    });
  }

  const response = await next();
  const newResponse = new Response(response.body, response);
  newResponse.headers.set('X-Content-Type-Options', 'nosniff');
  newResponse.headers.set('X-Frame-Options', 'DENY');
  newResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  return newResponse;
}
