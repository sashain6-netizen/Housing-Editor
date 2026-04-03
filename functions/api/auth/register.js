export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    const text = await request.text();
    const body = JSON.parse(text);
    const { email, password, name } = body;

    if (!email || !password || !name) {
      return new Response(JSON.stringify({ error: 'Missing required fields: email, password, name' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    if (password.length < 8) {
      return new Response(JSON.stringify({ error: 'Password must be at least 8 characters' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: 'Invalid email format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // Check if user already exists
    const existing = await env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(email.toLowerCase()).first();

    if (existing) {
      return new Response(JSON.stringify({ error: 'Email already registered' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // Create user
    const userId = crypto.randomUUID();
    const passwordHash = await hashPassword(password);
    const now = new Date().toISOString();

    await env.DB.prepare(
      'INSERT INTO users (id, email, password_hash, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(userId, email.toLowerCase(), passwordHash, name, now, now).run();

    // Generate JWT token
    const expiresIn = 7 * 24 * 60 * 60; // 7 days
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + expiresIn;

    const token = await signJWT(
      { userId, email: email.toLowerCase(), iat, exp },
      env.JWT_SECRET
    );

    return new Response(JSON.stringify({
      success: true,
      user: { id: userId, email: email.toLowerCase(), name },
      token,
      expiresIn
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });

  } catch (error) {
    console.error('Register error:', error);
    return new Response(JSON.stringify({ error: 'Registration failed: ' + error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}

async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const encoder = new TextEncoder();
  const data = encoder.encode(password + btoa(String.fromCharCode(...salt)));
  
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return btoa([...salt].map(b => String.fromCharCode(b)).join('')) + ':' + hashHex;
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
