# 🔧 Backend Setup Guide - Cloudflare Workers + D1 + KV

This guide explains how to set up the backend for the Hypixel Housing HTSL Editor using Cloudflare infrastructure.

## Overview

The backend consists of:
- **Cloudflare Workers** - Serverless compute for API endpoints
- **Cloudflare D1** - SQL database for users and houses
- **Cloudflare KV** - Key-value storage for sessions
- **Wrangler CLI** - Local development and deployment

## Prerequisites

1. Cloudflare account with Workers enabled
2. Node.js and npm installed
3. Wrangler CLI: `npm install -g wrangler`

## Setup Steps

### 1. Create a New Worker Project

```bash
wrangler init housing-editor-api
cd housing-editor-api
```

### 2. Create D1 Database

```bash
# Create main database
wrangler d1 create housing-editor

# You'll get a database_id - save this for wrangler.toml
```

### 3. Update wrangler.toml

```toml
name = "housing-editor-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[env.production]
database_id = "YOUR_DATABASE_ID"

[[d1_databases]]
binding = "DB"
database_name = "housing-editor"
database_id = "YOUR_DATABASE_ID"

[[kv_namespaces]]
binding = "KV"
id = "YOUR_KV_NAMESPACE_ID"
```

### 4. Initialize Database Tables

Create `src/schema.sql`:

```sql
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Houses table
CREATE TABLE IF NOT EXISTS houses (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  code TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Sessions table (for auth tokens)
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_houses_user_id ON houses(user_id);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token);
```

Run migrations:

```bash
wrangler d1 execute housing-editor --remote < src/schema.sql
```

### 5. API Implementation

Create `src/index.ts`:

```typescript
import { Router } from 'itty-router';
import { z } from 'zod';
import * as crypto from 'crypto';
import * as jwt from '@tsndr/cloudflare-worker-jwt';

interface Env {
  DB: D1Database;
  KV: KVNamespace;
  JWT_SECRET: string;
}

const router = Router();
const JWT_SECRET = 'your-secret-key'; // Use environment variable in production

// ==================== AUTH ====================

interface LoginBody {
  email: string;
  password: string;
}

interface RegisterBody {
  email: string;
  password: string;
  name: string;
}

// Bcrypt-like hashing (simplified for example)
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function generateToken(userId: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2);
  return `${userId}-${timestamp}-${random}`;
}

// POST /api/auth/register
router.post('/api/auth/register', async (req: any, env: Env) => {
  try {
    const body: RegisterBody = await req.json();

    // Validation
    if (!body.email || !body.password || !body.name) {
      return new Response('Missing required fields', { status: 400 });
    }

    if (body.password.length < 6) {
      return new Response('Password must be at least 6 characters', { status: 400 });
    }

    // Check if user exists
    const existing = await env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(body.email).first();

    if (existing) {
      return new Response('Email already registered', { status: 409 });
    }

    // Create user
    const userId = crypto.randomUUID();
    const passwordHash = hashPassword(body.password);

    await env.DB.prepare(
      'INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)'
    ).bind(userId, body.email, passwordHash, body.name).run();

    // Create session
    const token = generateToken(userId);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await env.DB.prepare(
      'INSERT INTO sessions (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)'
    ).bind(crypto.randomUUID(), userId, token, expiresAt).run();

    return new Response(JSON.stringify({
      user: { id: userId, email: body.email, name: body.name },
      token
    }), { status: 201 });
  } catch (error) {
    console.error('Register error:', error);
    return new Response('Registration failed', { status: 500 });
  }
});

// POST /api/auth/login
router.post('/api/auth/login', async (req: any, env: Env) => {
  try {
    const body: LoginBody = await req.json();

    if (!body.email || !body.password) {
      return new Response('Missing email or password', { status: 400 });
    }

    // Find user
    const user = await env.DB.prepare(
      'SELECT * FROM users WHERE email = ?'
    ).bind(body.email).first();

    if (!user) {
      return new Response('Invalid credentials', { status: 401 });
    }

    // Verify password
    const passwordHash = hashPassword(body.password);
    if (user.password_hash !== passwordHash) {
      return new Response('Invalid credentials', { status: 401 });
    }

    // Create session
    const token = generateToken(user.id);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await env.DB.prepare(
      'INSERT INTO sessions (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)'
    ).bind(crypto.randomUUID(), user.id, token, expiresAt).run();

    return new Response(JSON.stringify({
      user: { id: user.id, email: user.email, name: user.name },
      token
    }));
  } catch (error) {
    console.error('Login error:', error);
    return new Response('Login failed', { status: 500 });
  }
});

// GET /api/auth/me (verify token)
router.get('/api/auth/me', async (req: any, env: Env) => {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response('Unauthorized', { status: 401 });
    }

    const token = authHeader.substring(7);

    // Find session
    const session = await env.DB.prepare(
      'SELECT user_id FROM sessions WHERE token = ? AND expires_at > datetime("now")'
    ).bind(token).first();

    if (!session) {
      return new Response('Invalid token', { status: 401 });
    }

    // Get user
    const user = await env.DB.prepare(
      'SELECT id, email, name FROM users WHERE id = ?'
    ).bind(session.user_id).first();

    return new Response(JSON.stringify(user));
  } catch (error) {
    console.error('Auth check error:', error);
    return new Response('Unauthorized', { status: 401 });
  }
});

// ==================== HOUSES ====================

// Middleware: Verify token
async function verifyAuth(req: any, env: Env) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  const session = await env.DB.prepare(
    'SELECT user_id FROM sessions WHERE token = ? AND expires_at > datetime("now")'
  ).bind(token).first();

  return session?.user_id || null;
}

// GET /api/houses - List user's houses
router.get('/api/houses', async (req: any, env: Env) => {
  try {
    const userId = await verifyAuth(req, env);
    if (!userId) return new Response('Unauthorized', { status: 401 });

    const houses = await env.DB.prepare(
      'SELECT * FROM houses WHERE user_id = ? ORDER BY updated_at DESC'
    ).bind(userId).all();

    return new Response(JSON.stringify(houses.results || []));
  } catch (error) {
    console.error('Fetch houses error:', error);
    return new Response('Failed to fetch houses', { status: 500 });
  }
});

// POST /api/houses - Create house
router.post('/api/houses', async (req: any, env: Env) => {
  try {
    const userId = await verifyAuth(req, env);
    if (!userId) return new Response('Unauthorized', { status: 401 });

    const body = await req.json();
    if (!body.name) {
      return new Response('House name is required', { status: 400 });
    }

    const houseId = crypto.randomUUID();
    const code = body.code || '';
    const description = body.description || '';

    await env.DB.prepare(
      'INSERT INTO houses (id, user_id, name, description, code) VALUES (?, ?, ?, ?, ?)'
    ).bind(houseId, userId, body.name, description, code).run();

    const house = await env.DB.prepare(
      'SELECT * FROM houses WHERE id = ?'
    ).bind(houseId).first();

    return new Response(JSON.stringify(house), { status: 201 });
  } catch (error) {
    console.error('Create house error:', error);
    return new Response('Failed to create house', { status: 500 });
  }
});

// GET /api/houses/:id - Get specific house
router.get('/api/houses/:id', async (req: any, env: Env) => {
  try {
    const userId = await verifyAuth(req, env);
    if (!userId) return new Response('Unauthorized', { status: 401 });

    const house = await env.DB.prepare(
      'SELECT * FROM houses WHERE id = ? AND user_id = ?'
    ).bind(req.params.id, userId).first();

    if (!house) {
      return new Response('House not found', { status: 404 });
    }

    return new Response(JSON.stringify(house));
  } catch (error) {
    console.error('Get house error:', error);
    return new Response('Failed to fetch house', { status: 500 });
  }
});

// PUT /api/houses/:id - Update house
router.put('/api/houses/:id', async (req: any, env: Env) => {
  try {
    const userId = await verifyAuth(req, env);
    if (!userId) return new Response('Unauthorized', { status: 401 });

    const body = await req.json();

    // Verify ownership
    const house = await env.DB.prepare(
      'SELECT * FROM houses WHERE id = ? AND user_id = ?'
    ).bind(req.params.id, userId).first();

    if (!house) {
      return new Response('House not found', { status: 404 });
    }

    // Update
    await env.DB.prepare(
      'UPDATE houses SET name = ?, description = ?, code = ?, updated_at = datetime("now") WHERE id = ?'
    ).bind(
      body.name || house.name,
      body.description || house.description,
      body.code !== undefined ? body.code : house.code,
      req.params.id
    ).run();

    const updated = await env.DB.prepare(
      'SELECT * FROM houses WHERE id = ?'
    ).bind(req.params.id).first();

    return new Response(JSON.stringify(updated));
  } catch (error) {
    console.error('Update house error:', error);
    return new Response('Failed to update house', { status: 500 });
  }
});

// DELETE /api/houses/:id - Delete house
router.delete('/api/houses/:id', async (req: any, env: Env) => {
  try {
    const userId = await verifyAuth(req, env);
    if (!userId) return new Response('Unauthorized', { status: 401 });

    const house = await env.DB.prepare(
      'SELECT * FROM houses WHERE id = ? AND user_id = ?'
    ).bind(req.params.id, userId).first();

    if (!house) {
      return new Response('House not found', { status: 404 });
    }

    await env.DB.prepare('DELETE FROM houses WHERE id = ?').bind(req.params.id).run();

    return new Response(JSON.stringify({ message: 'Deleted' }));
  } catch (error) {
    console.error('Delete house error:', error);
    return new Response('Failed to delete house', { status: 500 });
  }
});

// 404
router.all('*', () => new Response('Not Found', { status: 404 }));

export default router;
```

### 6. Install Dependencies

```bash
npm install itty-router zod
npm install -D typescript @types/node
```

### 7. Development

```bash
# Start local development
wrangler dev

# API will be available at http://localhost:8787
```

### 8. Deployment

```bash
# Deploy to Cloudflare
wrangler publish --env production
```

## Environment Variables

Set in Cloudflare Dashboard or via `wrangler.toml`:

```toml
[env.production]
vars = { API_URL = "https://your-api.workers.dev" }
```

## Frontend Setup

Set the API URL in your React app:

```bash
# .env.local
REACT_APP_API_URL=https://your-api.workers.dev
```

## Database Backups

```bash
# Backup database
wrangler d1 export housing-editor --remote > backup.sql

# Restore
wrangler d1 execute housing-editor --remote < backup.sql
```

## Monitoring

View logs with:

```bash
wrangler tail --env production
```

## Security Best Practices

1. **Use proper hashing** - Swap SHA-256 with bcrypt or Argon2
2. **Set JWT_SECRET** as environment variable
3. **Enable CORS** only for your domain
4. **Rate limit** auth endpoints
5. **Use HTTPS only**
6. **Validate all inputs**

## Example API Calls

### Register
```bash
curl -X POST http://localhost:8787/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"123456","name":"John"}'
```

### Login
```bash
curl -X POST http://localhost:8787/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"123456"}'
```

### Create House
```bash
curl -X POST http://localhost:8787/api/houses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name":"My House","description":"My awesome house","code":""}'
```

## Troubleshooting

**Database connection error:**
- Verify `database_id` in wrangler.toml

**Auth token invalid:**
- Check token hasn't expired (7-day limit)

**CORS issues:**
- Add proper CORS headers to responses

---

For more help, see:
- Cloudflare Workers: https://developers.cloudflare.com/workers/
- Cloudflare D1: https://developers.cloudflare.com/d1/
- Wrangler CLI: https://developers.cloudflare.com/workers/wrangler/
