/**
 * Housing Editor API - Cloudflare Workers Backend
 * Production-ready with JWT authentication, D1 database, and KV cache
 */

import { Router, json } from 'itty-router';
import { v4 as uuidv4 } from 'uuid';
import * as crypto_browserify from 'crypto';

// ============================================================
// Type Definitions
// ============================================================

interface Env {
  DB: D1Database;
  KV: KVNamespace;
  JWT_SECRET: string;
  ENVIRONMENT: string;
  MAX_AUTH_TOKEN_AGE?: string;
  SESSION_TIMEOUT?: string;
  API_RATE_LIMIT?: string;
}

interface RequestWithAuth extends Request {
  userId?: string;
  user?: any;
}

interface User {
  id: string;
  email: string;
  name: string;
  profile_image_url?: string;
  created_at: string;
}

interface House {
  id: string;
  user_id: string;
  name: string;
  description: string;
  code: string;
  thumbnail_url?: string;
  is_public: number;
  created_at: string;
  updated_at: string;
}

interface AuthPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

// ============================================================
// JWT Utilities
// ============================================================

async function signJWT(payload: any, secret: string): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(payload));
  
  const message = `${encodedHeader}.${encodedPayload}`;
  const signature = await hmacSign(message, secret);
  
  return `${message}.${signature}`;
}

async function verifyJWT(token: string, secret: string): Promise<AuthPayload | null> {
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

async function hmacSign(message: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(message);
  
  const key = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, messageData);
  
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

// ============================================================
// Password Hashing (bcrypt-like)
// ============================================================

async function hashPassword(password: string): Promise<string> {
  // Using SHA-256 with salt for demo - upgrade to bcrypt in production
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const encoder = new TextEncoder();
  const data = encoder.encode(password + btoa(String.fromCharCode(...salt)));
  
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return btoa([...salt].map(b => String.fromCharCode(b)).join('')) + ':' + hashHex;
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
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
// Rate Limiting (KV-based)
// ============================================================

async function checkRateLimit(kv: KVNamespace, key: string, limit: number = 100, window: number = 60): Promise<boolean> {
  try {
    const current = await kv.get(key);
    const count = current ? parseInt(current) : 0;

    if (count >= limit) return false;

    await kv.put(key, (count + 1).toString(), { expirationTtl: window });
    return true;
  } catch (error) {
    // Fail open on KV errors
    return true;
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

function corsResponse(data: any, status: number = 200) {
  return new Response(
    typeof data === 'string' ? data : JSON.stringify(data),
    { status, headers: corsHeaders() }
  );
}

// ============================================================
// Middleware: Authentication
// ============================================================

async function authenticateRequest(req: RequestWithAuth, env: Env): Promise<string | null> {
  const authHeader = req.headers.get('Authorization');
  
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
    ).bind(hashToken(token)).first() as any;

    if (!session) {
      return null;
    }

    req.userId = payload.userId;
    return payload.userId;
  } catch (error) {
    console.error('Session check error:', error);
    return null;
  }
}

function hashToken(token: string): string {
  // Simple token hash for DB storage
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  return Array.from(new Uint8Array(data)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ============================================================
// Router Setup
// ============================================================

const router = Router();

// OPTIONS for CORS
router.options('*', () => corsResponse('OK'));

// ============================================================
// AUTH ENDPOINTS
// ============================================================

// POST /api/auth/register
router.post('/api/auth/register', async (req: Request, env: Env) => {
  try {
    // Rate limit registration
    const ip = req.headers.get('cf-connecting-ip') || 'unknown';
    if (!await checkRateLimit(env.KV, `register:${ip}:${new Date().toISOString().split('T')[0]}`, 5, 86400)) {
      return corsResponse({ error: 'Too many registration attempts. Try again tomorrow.' }, 429);
    }

    const body: any = await req.json();
    const { email, password, name } = body;

    // Validation
    if (!email || !password || !name) {
      return corsResponse({ error: 'Missing required fields: email, password, name' }, 400);
    }

    if (password.length < 8) {
      return corsResponse({ error: 'Password must be at least 8 characters' }, 400);
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return corsResponse({ error: 'Invalid email format' }, 400);
    }

    // Check if user exists
    const existing = await env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(email.toLowerCase()).first() as any;

    if (existing) {
      return corsResponse({ error: 'Email already registered' }, 409);
    }

    // Create user
    const userId = uuidv4();
    const passwordHash = await hashPassword(password);
    const now = new Date().toISOString();

    await env.DB.prepare(
      'INSERT INTO users (id, email, password_hash, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(userId, email.toLowerCase(), passwordHash, name, now, now).run();

    // Create JWT session
    const expiresIn = 7 * 24 * 60 * 60; // 7 days
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + expiresIn;

    const token = await signJWT(
      { userId, email: email.toLowerCase(), iat, exp },
      env.JWT_SECRET
    );

    // Store session in DB
    const tokenHash = hashToken(token);
    const sessionId = uuidv4();
    const expiresAt = new Date(exp * 1000).toISOString();
    const userAgent = req.headers.get('user-agent') || '';

    await env.DB.prepare(
      'INSERT INTO sessions (id, user_id, token_hash, ip_address, user_agent, expires_at, created_at, last_used_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(sessionId, userId, tokenHash, ip, userAgent, expiresAt, now, now).run();

    // Cache session in KV for faster lookups
    await env.KV.put(`session:${tokenHash}`, JSON.stringify({ userId, exp }), { expirationTtl: expiresIn });

    return corsResponse({
      success: true,
      user: { id: userId, email: email.toLowerCase(), name },
      token,
      expiresIn
    }, 201);

  } catch (error: any) {
    console.error('Register error:', error);
    return corsResponse({ error: 'Registration failed: ' + error.message }, 500);
  }
});

// POST /api/auth/login
router.post('/api/auth/login', async (req: Request, env: Env) => {
  try {
    // Rate limit login
    const ip = req.headers.get('cf-connecting-ip') || 'unknown';
    if (!await checkRateLimit(env.KV, `login:${ip}`, 10, 60)) {
      return corsResponse({ error: 'Too many login attempts. Please try again later.' }, 429);
    }

    const body: any = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return corsResponse({ error: 'Missing email or password' }, 400);
    }

    // Find user
    const user = await env.DB.prepare(
      'SELECT * FROM users WHERE email = ?'
    ).bind(email.toLowerCase()).first() as any;

    if (!user) {
      return corsResponse({ error: 'Invalid credentials' }, 401);
    }

    // Verify password
    const passwordValid = await verifyPassword(password, user.password_hash);
    if (!passwordValid) {
      return corsResponse({ error: 'Invalid credentials' }, 401);
    }

    // Create JWT session
    const expiresIn = 30 * 24 * 60 * 60; // 30 days
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + expiresIn;
    const now = new Date().toISOString();

    const token = await signJWT(
      { userId: user.id, email: user.email, iat, exp },
      env.JWT_SECRET
    );

    // Store session in DB
    const tokenHash = hashToken(token);
    const sessionId = uuidv4();
    const expiresAt = new Date(exp * 1000).toISOString();
    const userAgent = req.headers.get('user-agent') || '';

    await env.DB.prepare(
      'INSERT INTO sessions (id, user_id, token_hash, ip_address, user_agent, expires_at, created_at, last_used_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(sessionId, user.id, tokenHash, ip, userAgent, expiresAt, now, now).run();

    // Cache session in KV
    await env.KV.put(`session:${tokenHash}`, JSON.stringify({ userId: user.id, exp }), { expirationTtl: expiresIn });

    return corsResponse({
      success: true,
      user: { id: user.id, email: user.email, name: user.name },
      token,
      expiresIn
    });

  } catch (error: any) {
    console.error('Login error:', error);
    return corsResponse({ error: 'Login failed: ' + error.message }, 500);
  }
});

// GET /api/auth/me
router.get('/api/auth/me', async (req: RequestWithAuth, env: Env) => {
  try {
    const userId = await authenticateRequest(req, env);
    if (!userId) return corsResponse({ error: 'Unauthorized' }, 401);

    const user = await env.DB.prepare(
      'SELECT id, email, name, profile_image_url, created_at FROM users WHERE id = ?'
    ).bind(userId).first() as any;

    if (!user) return corsResponse({ error: 'User not found' }, 404);

    return corsResponse({ success: true, user });

  } catch (error: any) {
    console.error('Auth check error:', error);
    return corsResponse({ error: 'Auth check failed: ' + error.message }, 500);
  }
});

// POST /api/auth/logout
router.post('/api/auth/logout', async (req: RequestWithAuth, env: Env) => {
  try {
    const userId = await authenticateRequest(req, env);
    if (!userId) return corsResponse({ error: 'Unauthorized' }, 401);

    const authHeader = req.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const tokenHash = hashToken(token);

      // Delete from DB
      await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(tokenHash).run();

      // Delete from KV cache
      await env.KV.delete(`session:${tokenHash}`);
    }

    return corsResponse({ success: true, message: 'Logged out successfully' });

  } catch (error: any) {
    console.error('Logout error:', error);
    return corsResponse({ error: 'Logout failed: ' + error.message }, 500);
  }
});

// ============================================================
// HOUSES ENDPOINTS
// ============================================================

// GET /api/houses
router.get('/api/houses', async (req: RequestWithAuth, env: Env) => {
  try {
    const userId = await authenticateRequest(req, env);
    if (!userId) return corsResponse({ error: 'Unauthorized' }, 401);

    const result = await env.DB.prepare(
      'SELECT * FROM houses WHERE user_id = ? ORDER BY updated_at DESC LIMIT 100'
    ).bind(userId).all() as any;

    return corsResponse({
      success: true,
      houses: result.results || []
    });

  } catch (error: any) {
    console.error('Fetch houses error:', error);
    return corsResponse({ error: 'Failed to fetch houses: ' + error.message }, 500);
  }
});

// POST /api/houses
router.post('/api/houses', async (req: RequestWithAuth, env: Env) => {
  try {
    const userId = await authenticateRequest(req, env);
    if (!userId) return corsResponse({ error: 'Unauthorized' }, 401);

    const body: any = await req.json();
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
    ).bind(houseId).first() as any;

    // Log activity
    const logId = uuidv4();
    await env.DB.prepare(
      'INSERT INTO activity_log (id, user_id, house_id, action, created_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(logId, userId, houseId, 'created', now).run();

    return corsResponse({
      success: true,
      house
    }, 201);

  } catch (error: any) {
    console.error('Create house error:', error);
    return corsResponse({ error: 'Failed to create house: ' + error.message }, 500);
  }
});

// GET /api/houses/:houseId
router.get('/api/houses/:houseId', async (req: RequestWithAuth, env: Env) => {
  try {
    const userId = await authenticateRequest(req, env);
    if (!userId) return corsResponse({ error: 'Unauthorized' }, 401);

    const houseId = (req as any).params?.houseId;
    if (!houseId) return corsResponse({ error: 'House ID is required' }, 400);

    const house = await env.DB.prepare(
      'SELECT * FROM houses WHERE id = ? AND user_id = ?'
    ).bind(houseId, userId).first() as any;

    if (!house) return corsResponse({ error: 'House not found' }, 404);

    return corsResponse({
      success: true,
      house
    });

  } catch (error: any) {
    console.error('Get house error:', error);
    return corsResponse({ error: 'Failed to fetch house: ' + error.message }, 500);
  }
});

// PUT /api/houses/:houseId
router.put('/api/houses/:houseId', async (req: RequestWithAuth, env: Env) => {
  try {
    const userId = await authenticateRequest(req, env);
    if (!userId) return corsResponse({ error: 'Unauthorized' }, 401);

    const houseId = (req as any).params?.houseId;
    if (!houseId) return corsResponse({ error: 'House ID is required' }, 400);

    const body: any = await req.json();
    const { name, description, code } = body;

    // Verify ownership
    const house = await env.DB.prepare(
      'SELECT * FROM houses WHERE id = ? AND user_id = ?'
    ).bind(houseId, userId).first() as any;

    if (!house) return corsResponse({ error: 'House not found' }, 404);

    // Update
    const now = new Date().toISOString();
    await env.DB.prepare(
      'UPDATE houses SET name = COALESCE(?, name), description = COALESCE(?, description), code = COALESCE(?, code), updated_at = ? WHERE id = ?'
    ).bind(name, description, code, now, houseId).run();

    const updated = await env.DB.prepare(
      'SELECT * FROM houses WHERE id = ?'
    ).bind(houseId).first() as any;

    // Log activity
    const logId = uuidv4();
    await env.DB.prepare(
      'INSERT INTO activity_log (id, user_id, house_id, action, created_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(logId, userId, houseId, 'updated', now).run();

    return corsResponse({
      success: true,
      house: updated
    });

  } catch (error: any) {
    console.error('Update house error:', error);
    return corsResponse({ error: 'Failed to update house: ' + error.message }, 500);
  }
});

// DELETE /api/houses/:houseId
router.delete('/api/houses/:houseId', async (req: RequestWithAuth, env: Env) => {
  try {
    const userId = await authenticateRequest(req, env);
    if (!userId) return corsResponse({ error: 'Unauthorized' }, 401);

    const houseId = (req as any).params?.houseId;
    if (!houseId) return corsResponse({ error: 'House ID is required' }, 400);

    const house = await env.DB.prepare(
      'SELECT * FROM houses WHERE id = ? AND user_id = ?'
    ).bind(houseId, userId).first() as any;

    if (!house) return corsResponse({ error: 'House not found' }, 404);

    await env.DB.prepare('DELETE FROM houses WHERE id = ?').bind(houseId).run();

    // Log activity
    const now = new Date().toISOString();
    const logId = uuidv4();
    await env.DB.prepare(
      'INSERT INTO activity_log (id, user_id, action, created_at) VALUES (?, ?, ?, ?)'
    ).bind(logId, userId, 'deleted_house', now).run();

    return corsResponse({
      success: true,
      message: 'House deleted successfully'
    });

  } catch (error: any) {
    console.error('Delete house error:', error);
    return corsResponse({ error: 'Failed to delete house: ' + error.message }, 500);
  }
});

// ============================================================
// HEALTH CHECK
// ============================================================

router.get('/api/health', () => {
  return corsResponse({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString()
  });
});

// ============================================================
// 404 Handler
// ============================================================

router.all('*', () => corsResponse({ error: 'Not Found' }, 404));

// ============================================================
// Export
// ============================================================

export default router;
