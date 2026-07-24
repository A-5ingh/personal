// Clear GitHub auth cookie
export async function onRequestGet(context) {
  const { request } = context;
  const url = new URL(request.url);
  const redirect = url.searchParams.get('redirect') || '/blogs/';

  const headers = new Headers();
  headers.append('Location', redirect);
  headers.append('Set-Cookie', 'gh_token=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0');

  return new Response(null, { status: 302, headers });
}
