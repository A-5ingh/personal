// Post a heart reaction to a GitHub issue
import { getToken, sanitizeIssue, jsonError, checkRateLimit } from './utils.js';

export async function onRequestPost(context) {
  const { request, env } = context;
  const token = getToken(request);

  if (!token) {
    return jsonError('Unauthorized', 401);
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return jsonError('Invalid JSON body', 400);
  }

  const issue = sanitizeIssue(body.issue);
  if (!issue) {
    return jsonError('Invalid issue number', 400);
  }

  const rateLimited = checkRateLimit(request, 'like');
  if (rateLimited) return rateLimited;

  const res = await fetch(`https://api.github.com/repos/a-5ingh/personal/issues/${issue}/reactions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ content: 'heart' })
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error('GitHub like API error:', res.status, errText);
    return jsonError('Unable to save like', res.status);
  }

  const data = await res.json();
  return jsonResponse(data);
}
