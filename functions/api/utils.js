// Security utilities for API functions

const SITE_HOST = 'singhamarbir.com';

export function getOrigin(request) {
  const origin = request.headers.get('Origin');
  if (origin) return origin;
  const referer = request.headers.get('Referer');
  if (referer) {
    try {
      return new URL(referer).origin;
    } catch (e) {
      return null;
    }
  }
  return null;
}

export function isSameOrigin(request) {
  const url = new URL(request.url);
  const origin = getOrigin(request);
  if (origin) return origin === url.origin;

  // Fallback to Sec-Fetch-Site if available
  const secFetchSite = request.headers.get('Sec-Fetch-Site');
  if (secFetchSite === 'same-origin') return true;
  if (secFetchSite === 'cross-site' || secFetchSite === 'same-site') return false;

  // No origin/referer and no Sec-Fetch-Site: allow for compatibility, but log
  return true;
}

export function requireSameOrigin(request) {
  if (!isSameOrigin(request)) {
    return new Response(JSON.stringify({ error: 'Cross-origin request rejected' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  return null;
}

export function getSecurityHeaders(request) {
  const headers = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  };
  const origin = request.headers.get('Origin');
  if (origin) {
    headers['Vary'] = 'Origin';
  }
  return headers;
}

export function validateRedirect(request, redirect) {
  if (!redirect) return '/blogs/';
  // Only allow relative paths starting with /
  if (/^\//.test(redirect) && !/\/\//.test(redirect)) {
    return redirect;
  }
  // Or same-origin absolute URLs
  try {
    const url = new URL(request.url);
    const redirectUrl = new URL(redirect, url.origin);
    if (redirectUrl.origin === url.origin) {
      return redirectUrl.pathname + redirectUrl.search;
    }
  } catch (e) {}
  return '/blogs/';
}

export function sanitizeIssue(issue) {
  if (!issue) return null;
  const str = String(issue).trim();
  if (!/^\d+$/.test(str)) return null;
  const num = parseInt(str, 10);
  if (num <= 0 || num > 999999999) return null;
  return num;
}

export function jsonError(message, status) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

export function jsonResponse(data) {
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// Simple in-memory rate limiter per IP and action
const rateLimits = new Map();
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 10; // 10 likes/comments per minute per IP

export function checkRateLimit(request, action) {
  const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
  const key = `${clientIP}:${action}`;
  const now = Date.now();
  const entry = rateLimits.get(key);

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    rateLimits.set(key, { windowStart: now, count: 1 });
    return null;
  }

  entry.count++;
  if (entry.count > MAX_REQUESTS) {
    return jsonError('Rate limit exceeded. Please try again later.', 429);
  }
  return null;
}

export function sanitizeComment(text) {
  if (!text || typeof text !== 'string') return null;
  const trimmed = text.trim();
  if (!trimmed) return null;
  if (trimmed.length > 2000) return null;
  return trimmed;
}

export function getToken(request) {
  const cookieHeader = request.headers.get('Cookie') || '';
  const tokenMatch = cookieHeader.match(/gh_token=([^;]+)/);
  return tokenMatch ? tokenMatch[1] : null;
}
