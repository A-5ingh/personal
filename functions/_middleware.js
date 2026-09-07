// Return 410 Gone for known exploit/probe paths so they stop polluting
// analytics as 404s and signal to scanners/crawlers these are permanently gone.
const GONE = [
  /^\/(wp-admin|wp-content|wp-includes|wp-json)(\/|$)/,
  /^\/wp-(login|signup|admin)\.php(\/|$)/,
  /^\/\.env(\/|$)/,
  /^\/xmlrpc\.php(\/|$)/,
  /phpinfo/i,
];

// Internal/source files that get uploaded by `pages deploy .` but should never
// be served publicly. Return 404 so their existence isn't disclosed.
const INTERNAL = [
  /^\/\.entire(\/|$)/,
  /^\/\.gitignore$/,
  /^\/\.git(\/|$)/,
  /^\/\.github(\/|$)/,
  /^\/\.opencode(\/|$)/,
  /^\/\.wrangler(\/|$)/,
  /^\/package(-lock)?\.json$/,
  /^\/plan(\/|$)/,
  /^\/AGENTS\.md$/,
  /^\/\.DS_Store$/,
];

export async function onRequest(context) {
  const { request, next } = context;
  const path = new URL(request.url).pathname;

  for (const pattern of GONE) {
    if (pattern.test(path)) {
      return new Response('410 Gone', { status: 410 });
    }
  }

  for (const pattern of INTERNAL) {
    if (pattern.test(path)) {
      return new Response('404 Not Found', { status: 404 });
    }
  }

  return next();
}
