// Health check / ping for API functions
export async function onRequestGet(context) {
  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
