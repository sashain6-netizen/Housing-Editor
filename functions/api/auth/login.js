export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    const text = await request.text();
    const body = JSON.parse(text);
    const { email, password } = body;

    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Missing email or password' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const user = await env.DB.prepare(
      'SELECT * FROM users WHERE email = ?'
    ).bind(email.toLowerCase()).first();

    if (!user) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const passwordValid = await verifyPassword(password, user.password_hash);
    if (!passwordValid) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // Generate JWT token
    const expiresIn = 30 * 24 * 60 * 60; // 30 days
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + expiresIn;

    const token = await signJWT(
      { userId: user.id, email: user.email, iat, exp },
      env.JWT_SECRET
    );

    return new Response(JSON.stringify({
      success: true,
      user: { id: user.id, email: user.email, name: user.name },
      token,
      expiresIn
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });

  } catch (error) {
    console.error('Login error:', error);
    return new Response(JSON.stringify({ error: 'Login failed: ' + error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}

async function verifyPassword(password, hash) {
  try {
    const [saltB64, hashHex] = hash.split(':');
    const salt = new Uint8Array([...atob(saltB64)].map(c => c.charCodeAt(0)));
    
    const encoder = new TextEncoder();
    const data = encoder.encode(password + btoa(String.fromCharCode(...salt)));
    
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const calculatedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return calculatedHash === hashHex;
  } catch (error) {
    return false;
  }
}

async function signJWT(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(payload));
  
  const message = `${encodedHeader}.${encodedPayload}`;
  const signature = await hmacSign(message, secret);
  
  return `${message}.${signature}`;
}

async function hmacSign(message, secret) {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(message);
  
  const key = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, messageData);
  
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}
