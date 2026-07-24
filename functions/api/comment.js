// Post a comment to a GitHub issue
export async function onRequestPost(context) {
  const { request, env } = context;
  const cookieHeader = request.headers.get('Cookie') || '';
  const tokenMatch = cookieHeader.match(/gh_token=([^;]+)/);

  if (!tokenMatch) {
    return jsonError('Unauthorized', 401);
  }

  const token = tokenMatch[1];
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return jsonError('Invalid JSON body', 400);
  }

  const issue = body.issue;
  const text = body.text;
  if (!issue || !text || !text.trim()) {
    return jsonError('Missing issue or comment text', 400);
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
    const errText = await res.text();
    console.error('GitHub comment API error:', res.status, errText);
    return jsonError(`GitHub API error: ${res.status} ${errText}`, res.status);
  }

  const data = await res.json();
  return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
}

function jsonError(message, status) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}
