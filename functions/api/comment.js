// Post a comment to a GitHub issue
import { getToken, sanitizeIssue, sanitizeComment, jsonError, checkRateLimit, jsonResponse } from './utils.js';

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

  const text = sanitizeComment(body.text);
  if (!text) {
    return jsonError('Invalid or empty comment', 400);
  }

  const rateLimited = checkRateLimit(request, 'comment');
  if (rateLimited) return rateLimited;

  const res = await fetch(`https://api.github.com/repos/a-5ingh/personal/issues/${issue}/comments`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'User-Agent': 'singhamarbir.com'
    },
    body: JSON.stringify({ body: text })
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error('GitHub comment API error:', res.status, errText);
    return jsonError('Unable to post comment', res.status);
  }

  const data = await res.json();
  return jsonResponse(data);
}
