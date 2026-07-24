// Debug endpoint: checks GitHub token validity and scope hints
export async function onRequestGet(context) {
  const { request } = context;
  const cookieHeader = request.headers.get('Cookie') || '';
  const tokenMatch = cookieHeader.match(/gh_token=([^;]+)/);

  if (!tokenMatch) {
    return new Response(JSON.stringify({ authed: false, message: 'No gh_token cookie' }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const token = tokenMatch[1];
  const res = await fetch('https://api.github.com/user', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json'
    }
  });

  const body = await res.text();
  const headers = Object.fromEntries(res.headers.entries());
  const scopes = headers['x-oauth-scopes'] || 'unknown';

  return new Response(JSON.stringify({
    authed: res.ok,
    status: res.status,
    scopes: scopes,
    user: res.ok ? JSON.parse(body) : null,
    error: res.ok ? null : body
  }, null, 2), { headers: { 'Content-Type': 'application/json' } });
}
