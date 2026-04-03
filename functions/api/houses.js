export async function onRequestGet(context) {
  const { request, env } = context;
  
  try {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Authentication required. Please log in to view your houses.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const token = authHeader.substring(7);
    
    // Verify JWT token
    const payload = await verifyJWT(token, env.JWT_SECRET);
    if (!payload) {
      return new Response(JSON.stringify({ error: 'Your session has expired. Please log in again.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // Fetch user's houses from database
    const houses = await env.DB.prepare(
      'SELECT * FROM houses WHERE user_id = ? ORDER BY updated_at DESC LIMIT 100'
    ).bind(payload.userId).all();

    return new Response(JSON.stringify({
      success: true,
      houses: houses.results || []
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });

  } catch (error) {
    console.error('Fetch houses error:', error);
    
    if (error.message.includes('database') || error.message.includes('SQL')) {
      return new Response(JSON.stringify({ error: 'Database error occurred while loading your houses. Please try again in a few moments.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }
    
    return new Response(JSON.stringify({ error: 'Failed to load your houses due to a server error. Please try again.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}

async function verifyJWT(token, secret) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, signature] = parts;
    const message = `${encodedHeader}.${encodedPayload}`;
    const expectedSignature = await hmacSign(message, secret);

    if (signature !== expectedSignature) return null;

    const payload = JSON.parse(atob(encodedPayload));
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;

    return payload;
  } catch (error) {
    console.error('JWT verification error:', error);
    return null;
  }
}

async function hmacSign(message, secret) {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(message);
  
  const key = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, messageData);
  
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}
