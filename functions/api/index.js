/**
 * Housing Editor API - Cloudflare Pages Functions
 * Simplified backend with direct D1 and KV bindings
 */

import { v4 as uuidv4 } from 'uuid';

// ============================================================
// JWT Utilities
// ============================================================

async function signJWT(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(payload));
  
  const message = `${encodedHeader}.${encodedPayload}`;
  const signature = await hmacSign(message, secret);
  
  return `${message}.${signature}`;
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

// ============================================================
// Password Hashing
// ============================================================

async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const encoder = new TextEncoder();
  const data = encoder.encode(password + btoa(String.fromCharCode(...salt)));
  
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return btoa([...salt].map(b => String.fromCharCode(b)).join('')) + ':' + hashHex;
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

// ============================================================
// CORS Headers
// ============================================================

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };
}

function corsResponse(data, status = 200) {
  return new Response(
    typeof data === 'string' ? data : JSON.stringify(data),
    { status, headers: corsHeaders() }
  );
}

// ============================================================
// Authentication Middleware
// ============================================================

async function authenticateRequest(request, env) {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  const payload = await verifyJWT(token, env.JWT_SECRET);

  if (!payload) {
    return null;
  }

  // Check if session still exists in DB
  try {
    const session = await env.DB.prepare(
      'SELECT user_id FROM sessions WHERE token_hash = ? AND expires_at > datetime("now")'
    ).bind(hashToken(token)).first();

    if (!session) {
      return null;
    }

    return payload.userId;
  } catch (error) {
    console.error('Session check error:', error);
    return null;
  }
}

function hashToken(token) {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  return Array.from(new Uint8Array(data)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ============================================================
// Route Handler
// ============================================================

async function handleRequest(request, env, ctx) {
  let url;
  try {
    url = new URL(request.url);
  } catch (error) {
    // Fallback for Pages Functions environment
    const requestUrl = request.url || 'http://localhost:8788';
    url = new URL(requestUrl);
  }
  const path = url.pathname;
  const method = request.method;

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    return corsResponse('OK');
  }

  try {
    // AUTH ENDPOINTS
    if (path === '/api/auth/register' && method === 'POST') {
      return await handleRegister(request, env);
    }
    if (path === '/api/auth/login' && method === 'POST') {
      return await handleLogin(request, env);
    }
    if (path === '/api/auth/me' && method === 'GET') {
      return await handleAuthMe(request, env);
    }
    if (path === '/api/auth/logout' && method === 'POST') {
      return await handleLogout(request, env);
    }

    // HOUSES ENDPOINTS
    if (path === '/api/houses' && method === 'GET') {
      return await handleGetHouses(request, env);
    }
    if (path === '/api/houses' && method === 'POST') {
      return await handleCreateHouse(request, env);
    }
    if (path.startsWith('/api/houses/') && method === 'GET') {
      return await handleGetHouse(request, env);
    }
    if (path.startsWith('/api/houses/') && method === 'PUT') {
      return await handleUpdateHouse(request, env);
    }
    if (path.startsWith('/api/houses/') && method === 'DELETE') {
      return await handleDeleteHouse(request, env);
    }

    // HEALTH CHECK
    if (path === '/api/health') {
      return corsResponse({
        success: true,
        message: 'API is healthy',
        timestamp: new Date().toISOString()
      });
    }

    // 404
    return corsResponse({ error: 'Not Found' }, 404);

  } catch (error) {
    console.error('API Error:', error);
    return corsResponse({ error: 'Internal server error' }, 500);
  }
}

// ============================================================
// Auth Handlers
// ============================================================

async function handleRegister(request, env) {
  try {
    let body;
    try {
      const text = await request.text();
      body = JSON.parse(text);
    } catch (parseError) {
      return corsResponse({ error: 'Invalid JSON in request body' }, 400);
    }
    
    const { email, password, name } = body;

    if (!email || !password || !name) {
      return corsResponse({ error: 'Missing required fields: email, password, name' }, 400);
    }

    if (password.length < 8) {
      return corsResponse({ error: 'Password must be at least 8 characters' }, 400);
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return corsResponse({ error: 'Invalid email format' }, 400);
    }

    const existing = await env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(email.toLowerCase()).first();

    if (existing) {
      return corsResponse({ error: 'Email already registered' }, 409);
    }

    const userId = uuidv4();
    const passwordHash = await hashPassword(password);
    const now = new Date().toISOString();

    await env.DB.prepare(
      'INSERT INTO users (id, email, password_hash, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(userId, email.toLowerCase(), passwordHash, name, now, now).run();

    const expiresIn = 7 * 24 * 60 * 60;
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + expiresIn;

    const token = await signJWT(
      { userId, email: email.toLowerCase(), iat, exp },
      env.JWT_SECRET
    );

    const tokenHash = hashToken(token);
    const sessionId = uuidv4();
    const expiresAt = new Date(exp * 1000).toISOString();
    const ip = request.headers.get('cf-connecting-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || '';

    await env.DB.prepare(
      'INSERT INTO sessions (id, user_id, token_hash, ip_address, user_agent, expires_at, created_at, last_used_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(sessionId, userId, tokenHash, ip, userAgent, expiresAt, now, now).run();

    await env.KV.put(`session:${tokenHash}`, JSON.stringify({ userId, exp }), { expirationTtl: expiresIn });

    return corsResponse({
      success: true,
      user: { id: userId, email: email.toLowerCase(), name },
      token,
      expiresIn
    }, 201);

  } catch (error) {
    console.error('Register error:', error);
    return corsResponse({ error: 'Registration failed: ' + error.message }, 500);
  }
}

async function handleLogin(request, env) {
  try {
    let body;
    try {
      const text = await request.text();
      body = JSON.parse(text);
    } catch (parseError) {
      return corsResponse({ error: 'Invalid JSON in request body' }, 400);
    }
    
    const { email, password } = body;

    if (!email || !password) {
      return corsResponse({ error: 'Missing email or password' }, 400);
    }

    const user = await env.DB.prepare(
      'SELECT * FROM users WHERE email = ?'
    ).bind(email.toLowerCase()).first();

    if (!user) {
      return corsResponse({ error: 'Invalid credentials' }, 401);
    }

    const passwordValid = await verifyPassword(password, user.password_hash);
    if (!passwordValid) {
      return corsResponse({ error: 'Invalid credentials' }, 401);
    }

    const expiresIn = 30 * 24 * 60 * 60;
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + expiresIn;
    const now = new Date().toISOString();

    const token = await signJWT(
      { userId: user.id, email: user.email, iat, exp },
      env.JWT_SECRET
    );

    const tokenHash = hashToken(token);
    const sessionId = uuidv4();
    const expiresAt = new Date(exp * 1000).toISOString();
    const ip = request.headers.get('cf-connecting-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || '';

    await env.DB.prepare(
      'INSERT INTO sessions (id, user_id, token_hash, ip_address, user_agent, expires_at, created_at, last_used_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(sessionId, user.id, tokenHash, ip, userAgent, expiresAt, now, now).run();

    await env.KV.put(`session:${tokenHash}`, JSON.stringify({ userId: user.id, exp }), { expirationTtl: expiresIn });

    return corsResponse({
      success: true,
      user: { id: user.id, email: user.email, name: user.name },
      token,
      expiresIn
    });

  } catch (error) {
    console.error('Login error:', error);
    return corsResponse({ error: 'Login failed: ' + error.message }, 500);
  }
}

async function handleAuthMe(request, env) {
  try {
    const userId = await authenticateRequest(request, env);
    if (!userId) return corsResponse({ error: 'Unauthorized' }, 401);

    const user = await env.DB.prepare(
      'SELECT id, email, name, profile_image_url, created_at FROM users WHERE id = ?'
    ).bind(userId).first();

    if (!user) return corsResponse({ error: 'User not found' }, 404);

    return corsResponse({ success: true, user });

  } catch (error) {
    console.error('Auth check error:', error);
    return corsResponse({ error: 'Auth check failed: ' + error.message }, 500);
  }
}

async function handleLogout(request, env) {
  try {
    const userId = await authenticateRequest(request, env);
    if (!userId) return corsResponse({ error: 'Unauthorized' }, 401);

    const authHeader = request.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const tokenHash = hashToken(token);

      await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(tokenHash).run();
      await env.KV.delete(`session:${tokenHash}`);
    }

    return corsResponse({ success: true, message: 'Logged out successfully' });

  } catch (error) {
    console.error('Logout error:', error);
    return corsResponse({ error: 'Logout failed: ' + error.message }, 500);
  }
}

// ============================================================
// Houses Handlers
// ============================================================

async function handleGetHouses(request, env) {
  try {
    const userId = await authenticateRequest(request, env);
    if (!userId) return corsResponse({ error: 'Unauthorized' }, 401);

    const result = await env.DB.prepare(
      'SELECT * FROM houses WHERE user_id = ? ORDER BY updated_at DESC LIMIT 100'
    ).bind(userId).all();

    return corsResponse({
      success: true,
      houses: result.results || []
    });

  } catch (error) {
    console.error('Fetch houses error:', error);
    return corsResponse({ error: 'Failed to fetch houses: ' + error.message }, 500);
  }
}

async function handleCreateHouse(request, env) {
  try {
    const userId = await authenticateRequest(request, env);
    if (!userId) return corsResponse({ error: 'Unauthorized' }, 401);

    let body;
    try {
      const text = await request.text();
      body = JSON.parse(text);
    } catch (parseError) {
      return corsResponse({ error: 'Invalid JSON in request body' }, 400);
    }
    
    const { name, description, code } = body;

    if (!name) return corsResponse({ error: 'House name is required' }, 400);
    if (name.length > 100) return corsResponse({ error: 'House name is too long' }, 400);

    const houseId = uuidv4();
    const now = new Date().toISOString();

    await env.DB.prepare(
      'INSERT INTO houses (id, user_id, name, description, code, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(houseId, userId, name, description || '', code || '', now, now).run();

    const house = await env.DB.prepare(
      'SELECT * FROM houses WHERE id = ?'
    ).bind(houseId).first();

    const logId = uuidv4();
    await env.DB.prepare(
      'INSERT INTO activity_log (id, user_id, house_id, action, created_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(logId, userId, houseId, 'created', now).run();

    return corsResponse({
      success: true,
      house
    }, 201);

  } catch (error) {
    console.error('Create house error:', error);
    return corsResponse({ error: 'Failed to create house: ' + error.message }, 500);
  }
}

async function handleGetHouse(request, env) {
  try {
    const userId = await authenticateRequest(request, env);
    if (!userId) return corsResponse({ error: 'Unauthorized' }, 401);

    const url = new URL(request.url);
    const houseId = url.pathname.split('/').pop();
    if (!houseId) return corsResponse({ error: 'House ID is required' }, 400);

    const house = await env.DB.prepare(
      'SELECT * FROM houses WHERE id = ? AND user_id = ?'
    ).bind(houseId, userId).first();

    if (!house) return corsResponse({ error: 'House not found' }, 404);

    return corsResponse({
      success: true,
      house
    });

  } catch (error) {
    console.error('Get house error:', error);
    return corsResponse({ error: 'Failed to fetch house: ' + error.message }, 500);
  }
}

async function handleUpdateHouse(request, env) {
  try {
    const userId = await authenticateRequest(request, env);
    if (!userId) return corsResponse({ error: 'Unauthorized' }, 401);

    const url = new URL(request.url);
    const houseId = url.pathname.split('/').pop();
    if (!houseId) return corsResponse({ error: 'House ID is required' }, 400);

    let body;
    try {
      const text = await request.text();
      body = JSON.parse(text);
    } catch (parseError) {
      return corsResponse({ error: 'Invalid JSON in request body' }, 400);
    }
    
    const { name, description, code } = body;

    const house = await env.DB.prepare(
      'SELECT * FROM houses WHERE id = ? AND user_id = ?'
    ).bind(houseId, userId).first();

    if (!house) return corsResponse({ error: 'House not found' }, 404);

    const now = new Date().toISOString();
    await env.DB.prepare(
      'UPDATE houses SET name = COALESCE(?, name), description = COALESCE(?, description), code = COALESCE(?, code), updated_at = ? WHERE id = ?'
    ).bind(name, description, code, now, houseId).run();

    const updated = await env.DB.prepare(
      'SELECT * FROM houses WHERE id = ?'
    ).bind(houseId).first();

    const logId = uuidv4();
    await env.DB.prepare(
      'INSERT INTO activity_log (id, user_id, house_id, action, created_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(logId, userId, houseId, 'updated', now).run();

    return corsResponse({
      success: true,
      house: updated
    });

  } catch (error) {
    console.error('Update house error:', error);
    return corsResponse({ error: 'Failed to update house: ' + error.message }, 500);
  }
}

async function handleDeleteHouse(request, env) {
  try {
    const userId = await authenticateRequest(request, env);
    if (!userId) return corsResponse({ error: 'Unauthorized' }, 401);

    const url = new URL(request.url);
    const houseId = url.pathname.split('/').pop();
    if (!houseId) return corsResponse({ error: 'House ID is required' }, 400);

    const house = await env.DB.prepare(
      'SELECT * FROM houses WHERE id = ? AND user_id = ?'
    ).bind(houseId, userId).first();

    if (!house) return corsResponse({ error: 'House not found' }, 404);

    await env.DB.prepare('DELETE FROM houses WHERE id = ?').bind(houseId).run();

    const now = new Date().toISOString();
    const logId = uuidv4();
    await env.DB.prepare(
      'INSERT INTO activity_log (id, user_id, action, created_at) VALUES (?, ?, ?, ?)'
    ).bind(logId, userId, 'deleted_house', now).run();

    return corsResponse({
      success: true,
      message: 'House deleted successfully'
    });

  } catch (error) {
    console.error('Delete house error:', error);
    return corsResponse({ error: 'Failed to delete house: ' + error.message }, 500);
  }
}

// ============================================================
// Export
// ============================================================

export async function onRequest(request, env, ctx) {
  return handleRequest(request, env, ctx);
}
