// Check current GitHub auth status
import { getToken, jsonResponse } from './utils.js';

export async function onRequestGet(context) {
  const { request } = context;
  const token = getToken(request);

  if (!token) {
    return jsonResponse({ authed: false, reason: 'no_token' });
  }

  const res = await fetch('https://api.github.com/user', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json'
    }
  });

  if (!res.ok) {
    const errText = await res.text();
    return jsonResponse({
      authed: false,
      reason: 'github_api_error',
      status: res.status,
      error_snippet: errText.slice(0, 200)
    });
  }

  const user = await res.json();
  return jsonResponse({ authed: true, user: user.login });
}
