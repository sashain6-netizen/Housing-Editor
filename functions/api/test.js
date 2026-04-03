export async function onRequest(request, env, ctx) {
  return new Response(JSON.stringify({ message: 'Functions are working!' }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
