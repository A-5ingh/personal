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

// JWT-like signed token using HMAC-SHA256 (for same-origin token exchange)
// We avoid JWS library imports to keep zero dependencies.
function base64UrlEncode(buffer) {
  const bytes = new Uint8Array(buffer);
  let str = '';
  for (let i = 0; i < bytes.length; i++) {
    str += String.fromCharCode(bytes[i]);
  }
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str) {
  const padding = '='.repeat((4 - (str.length % 4)) % 4);
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/') + padding;
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function getHmacKey(secret) {
  const enc = new TextEncoder();
  const keyData = enc.encode(secret);
  const hash = await crypto.subtle.digest('SHA-256', keyData);
  return await crypto.subtle.importKey(
    'raw',
    hash,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export async function signToken(payload, secret) {
  const header = JSON.stringify({ alg: 'HS256', typ: 'JWT' });
  const body = JSON.stringify(payload);
  const enc = new TextEncoder();
  const headerB64 = base64UrlEncode(enc.encode(header));
  const bodyB64 = base64UrlEncode(enc.encode(body));
  const signingInput = `${headerB64}.${bodyB64}`;
  const key = await getHmacKey(secret);
  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(signingInput));
  const signatureB64 = base64UrlEncode(signature);
  return `${signingInput}.${signatureB64}`;
}

export async function verifyToken(token, secret, maxAgeSeconds = 60) {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [headerB64, bodyB64, signatureB64] = parts;
  const enc = new TextEncoder();
  const signingInput = `${headerB64}.${bodyB64}`;
  const key = await getHmacKey(secret);
  const signature = base64UrlDecode(signatureB64);
  const valid = await crypto.subtle.verify('HMAC', key, signature, enc.encode(signingInput));
  if (!valid) return null;
  try {
    const bodyBytes = base64UrlDecode(bodyB64);
    const bodyText = new TextDecoder().decode(bodyBytes);
    const payload = JSON.parse(bodyText);
    if (!payload.iat || !payload.exp) return null;
    const now = Math.floor(Date.now() / 1000);
    if (now > payload.exp || now < payload.iat - maxAgeSeconds) return null;
    return payload;
  } catch (e) {
    return null;
  }
}
