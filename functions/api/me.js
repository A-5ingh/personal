// Check current GitHub auth status
export async function onRequestGet(context) {
  const { request, env } = context;
  const cookieHeader = request.headers.get('Cookie') || '';
  const tokenMatch = cookieHeader.match(/gh_token=([^;]+)/);

  if (!tokenMatch) {
    return json({ authed: false });
  }

  const token = tokenMatch[1];
  const res = await fetch('https://api.github.com/user', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json'
    }
  });

  if (!res.ok) {
    return json({ authed: false });
  }

  const user = await res.json();
  return json({ authed: true, user: user.login, avatar: user.avatar_url });
}

function json(data) {
  return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
}
