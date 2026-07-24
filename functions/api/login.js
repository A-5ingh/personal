// Redirect to GitHub OAuth authorization
export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const redirect = url.searchParams.get('redirect') || '/blogs/';
  const state = crypto.randomUUID();

  const githubUrl = new URL('https://github.com/login/oauth/authorize');
  githubUrl.searchParams.set('client_id', env.GITHUB_CLIENT_ID);
  githubUrl.searchParams.set('redirect_uri', `${url.origin}/api/auth`);
  githubUrl.searchParams.set('scope', 'repo');
  githubUrl.searchParams.set('state', state);
  githubUrl.searchParams.set('allow_signup', 'true');

  const headers = new Headers();
  headers.append('Location', githubUrl.toString());
  headers.append('Set-Cookie', `gh_state=${state}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`);
  headers.append('Set-Cookie', `gh_redirect=${encodeURIComponent(redirect)}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`);

  return new Response(null, { status: 302, headers });
}
