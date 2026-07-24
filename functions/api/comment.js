// Post a comment to a GitHub issue
export async function onRequestPost(context) {
  const { request, env } = context;
  const cookieHeader = request.headers.get('Cookie') || '';
  const tokenMatch = cookieHeader.match(/gh_token=([^;]+)/);

  if (!tokenMatch) {
    return new Response('Unauthorized', { status: 401 });
  }

  const token = tokenMatch[1];
  const body = await request.json();
  const issue = body.issue;
  const text = body.text;
  if (!issue || !text || !text.trim()) {
    return new Response('Missing issue or comment text', { status: 400 });
  }

  const res = await fetch(`https://api.github.com/repos/a-5ingh/personal/issues/${issue}/comments`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ body: text.trim() })
  });

  if (!res.ok) {
    const err = await res.text();
    return new Response(err, { status: res.status });
  }

  const data = await res.json();
  return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
}
