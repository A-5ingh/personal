// Remove a heart reaction from a GitHub issue
import { getToken, sanitizeIssue, jsonError, checkRateLimit, jsonResponse } from './utils.js';

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
  const reactionId = sanitizeIssue(body.reactionId);
  if (!issue || !reactionId) {
    return jsonError('Invalid issue or reaction ID', 400);
  }

  const rateLimited = checkRateLimit(request, 'unlike');
  if (rateLimited) return rateLimited;

  const res = await fetch(`https://api.github.com/repos/a-5ingh/personal/issues/${issue}/reactions/${reactionId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'User-Agent': 'singhamarbir.com'
    }
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error('GitHub unlike API error:', res.status, errText);
    return jsonError('Unable to remove like', res.status);
  }

  return jsonResponse({ success: true });
}
