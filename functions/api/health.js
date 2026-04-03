export async function onRequestGet(context) {
  return new Response(JSON.stringify({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}
