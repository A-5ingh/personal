// Check current GitHub auth status
import { getToken, jsonResponse, jsonError } from './utils.js';

export async function onRequestGet(context) {
  const { request } = context;
  const token = getToken(request);

  if (!token) {
    return jsonResponse({ authed: false });
  }

  const res = await fetch('https://api.github.com/user', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json'
    }
  });

  if (!res.ok) {
    return jsonResponse({ authed: false });
  }

  const user = await res.json();
  return jsonResponse({ authed: true, user: user.login });
}
