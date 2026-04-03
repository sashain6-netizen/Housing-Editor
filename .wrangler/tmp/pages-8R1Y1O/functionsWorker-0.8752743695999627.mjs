var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// api/auth/login.js
async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const text = await request.text();
    const body = JSON.parse(text);
    const { email, password } = body;
    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Missing email or password" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
    const user = await env.DB.prepare(
      "SELECT * FROM users WHERE email = ?"
    ).bind(email.toLowerCase()).first();
    if (!user) {
      return new Response(JSON.stringify({ error: "Invalid credentials" }), {
        status: 401,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
    const passwordValid = await verifyPassword(password, user.password_hash);
    if (!passwordValid) {
      return new Response(JSON.stringify({ error: "Invalid credentials" }), {
        status: 401,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
    return new Response(JSON.stringify({
      success: true,
      user: { id: user.id, email: user.email, name: user.name },
      message: "Login successful"
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  } catch (error) {
    console.error("Login error:", error);
    return new Response(JSON.stringify({ error: "Login failed: " + error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
}
__name(onRequestPost, "onRequestPost");
async function verifyPassword(password, hash) {
  try {
    const [saltB64, hashHex] = hash.split(":");
    const salt = new Uint8Array([...atob(saltB64)].map((c) => c.charCodeAt(0)));
    const encoder = new TextEncoder();
    const data = encoder.encode(password + btoa(String.fromCharCode(...salt)));
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const calculatedHash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    return calculatedHash === hashHex;
  } catch (error) {
    return false;
  }
}
__name(verifyPassword, "verifyPassword");

// api/auth/me.js
async function onRequestGet(context) {
  const { request, env } = context;
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
    return new Response(JSON.stringify({
      success: true,
      message: "User is authenticated"
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  } catch (error) {
    console.error("Auth check error:", error);
    return new Response(JSON.stringify({ error: "Auth check failed: " + error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
}
__name(onRequestGet, "onRequestGet");

// api/auth/register.js
async function onRequestPost2(context) {
  const { request, env } = context;
  try {
    const text = await request.text();
    const body = JSON.parse(text);
    const { email, password, name } = body;
    if (!email || !password || !name) {
      return new Response(JSON.stringify({ error: "Missing required fields: email, password, name" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
    if (password.length < 8) {
      return new Response(JSON.stringify({ error: "Password must be at least 8 characters" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: "Invalid email format" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
    const existing = await env.DB.prepare(
      "SELECT id FROM users WHERE email = ?"
    ).bind(email.toLowerCase()).first();
    if (existing) {
      return new Response(JSON.stringify({ error: "Email already registered" }), {
        status: 409,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
    const userId = crypto.randomUUID();
    const passwordHash = await hashPassword(password);
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await env.DB.prepare(
      "INSERT INTO users (id, email, password_hash, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)"
    ).bind(userId, email.toLowerCase(), passwordHash, name, now, now).run();
    return new Response(JSON.stringify({
      success: true,
      user: { id: userId, email: email.toLowerCase(), name },
      message: "User registered successfully"
    }), {
      status: 201,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  } catch (error) {
    console.error("Register error:", error);
    return new Response(JSON.stringify({ error: "Registration failed: " + error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
}
__name(onRequestPost2, "onRequestPost");
async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const encoder = new TextEncoder();
  const data = encoder.encode(password + btoa(String.fromCharCode(...salt)));
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return btoa([...salt].map((b) => String.fromCharCode(b)).join("")) + ":" + hashHex;
}
__name(hashPassword, "hashPassword");

// api/health.js
async function onRequestGet2(context) {
  return new Response(JSON.stringify({
    success: true,
    message: "API is healthy",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  }), {
    status: 200,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
  });
}
__name(onRequestGet2, "onRequestGet");

// api/test.js
async function onRequest(request, env, ctx) {
  return new Response(JSON.stringify({ message: "Functions are working!" }), {
    headers: { "Content-Type": "application/json" }
  });
}
__name(onRequest, "onRequest");

// ../node_modules/uuid/dist/stringify.js
var byteToHex = [];
for (let i = 0; i < 256; ++i) {
  byteToHex.push((i + 256).toString(16).slice(1));
}
function unsafeStringify(arr, offset = 0) {
  return (byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + "-" + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + "-" + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + "-" + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + "-" + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]]).toLowerCase();
}
__name(unsafeStringify, "unsafeStringify");

// ../node_modules/uuid/dist/rng.js
var getRandomValues;
var rnds8 = new Uint8Array(16);
function rng() {
  if (!getRandomValues) {
    if (typeof crypto === "undefined" || !crypto.getRandomValues) {
      throw new Error("crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported");
    }
    getRandomValues = crypto.getRandomValues.bind(crypto);
  }
  return getRandomValues(rnds8);
}
__name(rng, "rng");

// ../node_modules/uuid/dist/native.js
var randomUUID = typeof crypto !== "undefined" && crypto.randomUUID && crypto.randomUUID.bind(crypto);
var native_default = { randomUUID };

// ../node_modules/uuid/dist/v4.js
function _v4(options, buf, offset) {
  options = options || {};
  const rnds = options.random ?? options.rng?.() ?? rng();
  if (rnds.length < 16) {
    throw new Error("Random bytes length must be >= 16");
  }
  rnds[6] = rnds[6] & 15 | 64;
  rnds[8] = rnds[8] & 63 | 128;
  if (buf) {
    offset = offset || 0;
    if (offset < 0 || offset + 16 > buf.length) {
      throw new RangeError(`UUID byte range ${offset}:${offset + 15} is out of buffer bounds`);
    }
    for (let i = 0; i < 16; ++i) {
      buf[offset + i] = rnds[i];
    }
    return buf;
  }
  return unsafeStringify(rnds);
}
__name(_v4, "_v4");
function v4(options, buf, offset) {
  if (native_default.randomUUID && !buf && !options) {
    return native_default.randomUUID();
  }
  return _v4(options, buf, offset);
}
__name(v4, "v4");
var v4_default = v4;

// api/index.js
async function signJWT(payload, secret) {
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(payload));
  const message = `${encodedHeader}.${encodedPayload}`;
  const signature = await hmacSign(message, secret);
  return `${message}.${signature}`;
}
__name(signJWT, "signJWT");
async function verifyJWT(token, secret) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [encodedHeader, encodedPayload, signature] = parts;
    const message = `${encodedHeader}.${encodedPayload}`;
    const expectedSignature = await hmacSign(message, secret);
    if (signature !== expectedSignature) return null;
    const payload = JSON.parse(atob(encodedPayload));
    if (payload.exp < Math.floor(Date.now() / 1e3)) return null;
    return payload;
  } catch (error) {
    console.error("JWT verification error:", error);
    return null;
  }
}
__name(verifyJWT, "verifyJWT");
async function hmacSign(message, secret) {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(message);
  const key = await crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, messageData);
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}
__name(hmacSign, "hmacSign");
async function hashPassword2(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const encoder = new TextEncoder();
  const data = encoder.encode(password + btoa(String.fromCharCode(...salt)));
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return btoa([...salt].map((b) => String.fromCharCode(b)).join("")) + ":" + hashHex;
}
__name(hashPassword2, "hashPassword");
async function verifyPassword2(password, hash) {
  try {
    const [saltB64, hashHex] = hash.split(":");
    const salt = new Uint8Array([...atob(saltB64)].map((c) => c.charCodeAt(0)));
    const encoder = new TextEncoder();
    const data = encoder.encode(password + btoa(String.fromCharCode(...salt)));
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const calculatedHash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    return calculatedHash === hashHex;
  } catch (error) {
    return false;
  }
}
__name(verifyPassword2, "verifyPassword");
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json"
  };
}
__name(corsHeaders, "corsHeaders");
function corsResponse(data, status = 200) {
  return new Response(
    typeof data === "string" ? data : JSON.stringify(data),
    { status, headers: corsHeaders() }
  );
}
__name(corsResponse, "corsResponse");
async function authenticateRequest(request, env) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.substring(7);
  const payload = await verifyJWT(token, env.JWT_SECRET);
  if (!payload) {
    return null;
  }
  try {
    const session = await env.DB.prepare(
      'SELECT user_id FROM sessions WHERE token_hash = ? AND expires_at > datetime("now")'
    ).bind(hashToken(token)).first();
    if (!session) {
      return null;
    }
    return payload.userId;
  } catch (error) {
    console.error("Session check error:", error);
    return null;
  }
}
__name(authenticateRequest, "authenticateRequest");
function hashToken(token) {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  return Array.from(new Uint8Array(data)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(hashToken, "hashToken");
async function handleRequest(request, env, ctx) {
  let url;
  try {
    url = new URL(request.url);
  } catch (error) {
    const requestUrl = request.url || "http://localhost:8788";
    url = new URL(requestUrl);
  }
  const path = url.pathname;
  const method = request.method;
  if (method === "OPTIONS") {
    return corsResponse("OK");
  }
  try {
    if (path === "/api/auth/register" && method === "POST") {
      return await handleRegister(request, env);
    }
    if (path === "/api/auth/login" && method === "POST") {
      return await handleLogin(request, env);
    }
    if (path === "/api/auth/me" && method === "GET") {
      return await handleAuthMe(request, env);
    }
    if (path === "/api/auth/logout" && method === "POST") {
      return await handleLogout(request, env);
    }
    if (path === "/api/houses" && method === "GET") {
      return await handleGetHouses(request, env);
    }
    if (path === "/api/houses" && method === "POST") {
      return await handleCreateHouse(request, env);
    }
    if (path.startsWith("/api/houses/") && method === "GET") {
      return await handleGetHouse(request, env);
    }
    if (path.startsWith("/api/houses/") && method === "PUT") {
      return await handleUpdateHouse(request, env);
    }
    if (path.startsWith("/api/houses/") && method === "DELETE") {
      return await handleDeleteHouse(request, env);
    }
    if (path === "/api/health") {
      return corsResponse({
        success: true,
        message: "API is healthy",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
    return corsResponse({ error: "Not Found" }, 404);
  } catch (error) {
    console.error("API Error:", error);
    return corsResponse({ error: "Internal server error" }, 500);
  }
}
__name(handleRequest, "handleRequest");
async function handleRegister(request, env) {
  try {
    let body;
    try {
      const text = await request.text();
      body = JSON.parse(text);
    } catch (parseError) {
      return corsResponse({ error: "Invalid JSON in request body" }, 400);
    }
    const { email, password, name } = body;
    if (!email || !password || !name) {
      return corsResponse({ error: "Missing required fields: email, password, name" }, 400);
    }
    if (password.length < 8) {
      return corsResponse({ error: "Password must be at least 8 characters" }, 400);
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return corsResponse({ error: "Invalid email format" }, 400);
    }
    const existing = await env.DB.prepare(
      "SELECT id FROM users WHERE email = ?"
    ).bind(email.toLowerCase()).first();
    if (existing) {
      return corsResponse({ error: "Email already registered" }, 409);
    }
    const userId = v4_default();
    const passwordHash = await hashPassword2(password);
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await env.DB.prepare(
      "INSERT INTO users (id, email, password_hash, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)"
    ).bind(userId, email.toLowerCase(), passwordHash, name, now, now).run();
    const expiresIn = 7 * 24 * 60 * 60;
    const iat = Math.floor(Date.now() / 1e3);
    const exp = iat + expiresIn;
    const token = await signJWT(
      { userId, email: email.toLowerCase(), iat, exp },
      env.JWT_SECRET
    );
    const tokenHash = hashToken(token);
    const sessionId = v4_default();
    const expiresAt = new Date(exp * 1e3).toISOString();
    const ip = request.headers.get("cf-connecting-ip") || "unknown";
    const userAgent = request.headers.get("user-agent") || "";
    await env.DB.prepare(
      "INSERT INTO sessions (id, user_id, token_hash, ip_address, user_agent, expires_at, created_at, last_used_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(sessionId, userId, tokenHash, ip, userAgent, expiresAt, now, now).run();
    await env.KV.put(`session:${tokenHash}`, JSON.stringify({ userId, exp }), { expirationTtl: expiresIn });
    return corsResponse({
      success: true,
      user: { id: userId, email: email.toLowerCase(), name },
      token,
      expiresIn
    }, 201);
  } catch (error) {
    console.error("Register error:", error);
    return corsResponse({ error: "Registration failed: " + error.message }, 500);
  }
}
__name(handleRegister, "handleRegister");
async function handleLogin(request, env) {
  try {
    let body;
    try {
      const text = await request.text();
      body = JSON.parse(text);
    } catch (parseError) {
      return corsResponse({ error: "Invalid JSON in request body" }, 400);
    }
    const { email, password } = body;
    if (!email || !password) {
      return corsResponse({ error: "Missing email or password" }, 400);
    }
    const user = await env.DB.prepare(
      "SELECT * FROM users WHERE email = ?"
    ).bind(email.toLowerCase()).first();
    if (!user) {
      return corsResponse({ error: "Invalid credentials" }, 401);
    }
    const passwordValid = await verifyPassword2(password, user.password_hash);
    if (!passwordValid) {
      return corsResponse({ error: "Invalid credentials" }, 401);
    }
    const expiresIn = 30 * 24 * 60 * 60;
    const iat = Math.floor(Date.now() / 1e3);
    const exp = iat + expiresIn;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const token = await signJWT(
      { userId: user.id, email: user.email, iat, exp },
      env.JWT_SECRET
    );
    const tokenHash = hashToken(token);
    const sessionId = v4_default();
    const expiresAt = new Date(exp * 1e3).toISOString();
    const ip = request.headers.get("cf-connecting-ip") || "unknown";
    const userAgent = request.headers.get("user-agent") || "";
    await env.DB.prepare(
      "INSERT INTO sessions (id, user_id, token_hash, ip_address, user_agent, expires_at, created_at, last_used_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(sessionId, user.id, tokenHash, ip, userAgent, expiresAt, now, now).run();
    await env.KV.put(`session:${tokenHash}`, JSON.stringify({ userId: user.id, exp }), { expirationTtl: expiresIn });
    return corsResponse({
      success: true,
      user: { id: user.id, email: user.email, name: user.name },
      token,
      expiresIn
    });
  } catch (error) {
    console.error("Login error:", error);
    return corsResponse({ error: "Login failed: " + error.message }, 500);
  }
}
__name(handleLogin, "handleLogin");
async function handleAuthMe(request, env) {
  try {
    const userId = await authenticateRequest(request, env);
    if (!userId) return corsResponse({ error: "Unauthorized" }, 401);
    const user = await env.DB.prepare(
      "SELECT id, email, name, profile_image_url, created_at FROM users WHERE id = ?"
    ).bind(userId).first();
    if (!user) return corsResponse({ error: "User not found" }, 404);
    return corsResponse({ success: true, user });
  } catch (error) {
    console.error("Auth check error:", error);
    return corsResponse({ error: "Auth check failed: " + error.message }, 500);
  }
}
__name(handleAuthMe, "handleAuthMe");
async function handleLogout(request, env) {
  try {
    const userId = await authenticateRequest(request, env);
    if (!userId) return corsResponse({ error: "Unauthorized" }, 401);
    const authHeader = request.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const tokenHash = hashToken(token);
      await env.DB.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(tokenHash).run();
      await env.KV.delete(`session:${tokenHash}`);
    }
    return corsResponse({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    return corsResponse({ error: "Logout failed: " + error.message }, 500);
  }
}
__name(handleLogout, "handleLogout");
async function handleGetHouses(request, env) {
  try {
    const userId = await authenticateRequest(request, env);
    if (!userId) return corsResponse({ error: "Unauthorized" }, 401);
    const result = await env.DB.prepare(
      "SELECT * FROM houses WHERE user_id = ? ORDER BY updated_at DESC LIMIT 100"
    ).bind(userId).all();
    return corsResponse({
      success: true,
      houses: result.results || []
    });
  } catch (error) {
    console.error("Fetch houses error:", error);
    return corsResponse({ error: "Failed to fetch houses: " + error.message }, 500);
  }
}
__name(handleGetHouses, "handleGetHouses");
async function handleCreateHouse(request, env) {
  try {
    const userId = await authenticateRequest(request, env);
    if (!userId) return corsResponse({ error: "Unauthorized" }, 401);
    let body;
    try {
      const text = await request.text();
      body = JSON.parse(text);
    } catch (parseError) {
      return corsResponse({ error: "Invalid JSON in request body" }, 400);
    }
    const { name, description, code } = body;
    if (!name) return corsResponse({ error: "House name is required" }, 400);
    if (name.length > 100) return corsResponse({ error: "House name is too long" }, 400);
    const houseId = v4_default();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await env.DB.prepare(
      "INSERT INTO houses (id, user_id, name, description, code, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).bind(houseId, userId, name, description || "", code || "", now, now).run();
    const house = await env.DB.prepare(
      "SELECT * FROM houses WHERE id = ?"
    ).bind(houseId).first();
    const logId = v4_default();
    await env.DB.prepare(
      "INSERT INTO activity_log (id, user_id, house_id, action, created_at) VALUES (?, ?, ?, ?, ?)"
    ).bind(logId, userId, houseId, "created", now).run();
    return corsResponse({
      success: true,
      house
    }, 201);
  } catch (error) {
    console.error("Create house error:", error);
    return corsResponse({ error: "Failed to create house: " + error.message }, 500);
  }
}
__name(handleCreateHouse, "handleCreateHouse");
async function handleGetHouse(request, env) {
  try {
    const userId = await authenticateRequest(request, env);
    if (!userId) return corsResponse({ error: "Unauthorized" }, 401);
    const url = new URL(request.url);
    const houseId = url.pathname.split("/").pop();
    if (!houseId) return corsResponse({ error: "House ID is required" }, 400);
    const house = await env.DB.prepare(
      "SELECT * FROM houses WHERE id = ? AND user_id = ?"
    ).bind(houseId, userId).first();
    if (!house) return corsResponse({ error: "House not found" }, 404);
    return corsResponse({
      success: true,
      house
    });
  } catch (error) {
    console.error("Get house error:", error);
    return corsResponse({ error: "Failed to fetch house: " + error.message }, 500);
  }
}
__name(handleGetHouse, "handleGetHouse");
async function handleUpdateHouse(request, env) {
  try {
    const userId = await authenticateRequest(request, env);
    if (!userId) return corsResponse({ error: "Unauthorized" }, 401);
    const url = new URL(request.url);
    const houseId = url.pathname.split("/").pop();
    if (!houseId) return corsResponse({ error: "House ID is required" }, 400);
    let body;
    try {
      const text = await request.text();
      body = JSON.parse(text);
    } catch (parseError) {
      return corsResponse({ error: "Invalid JSON in request body" }, 400);
    }
    const { name, description, code } = body;
    const house = await env.DB.prepare(
      "SELECT * FROM houses WHERE id = ? AND user_id = ?"
    ).bind(houseId, userId).first();
    if (!house) return corsResponse({ error: "House not found" }, 404);
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await env.DB.prepare(
      "UPDATE houses SET name = COALESCE(?, name), description = COALESCE(?, description), code = COALESCE(?, code), updated_at = ? WHERE id = ?"
    ).bind(name, description, code, now, houseId).run();
    const updated = await env.DB.prepare(
      "SELECT * FROM houses WHERE id = ?"
    ).bind(houseId).first();
    const logId = v4_default();
    await env.DB.prepare(
      "INSERT INTO activity_log (id, user_id, house_id, action, created_at) VALUES (?, ?, ?, ?, ?)"
    ).bind(logId, userId, houseId, "updated", now).run();
    return corsResponse({
      success: true,
      house: updated
    });
  } catch (error) {
    console.error("Update house error:", error);
    return corsResponse({ error: "Failed to update house: " + error.message }, 500);
  }
}
__name(handleUpdateHouse, "handleUpdateHouse");
async function handleDeleteHouse(request, env) {
  try {
    const userId = await authenticateRequest(request, env);
    if (!userId) return corsResponse({ error: "Unauthorized" }, 401);
    const url = new URL(request.url);
    const houseId = url.pathname.split("/").pop();
    if (!houseId) return corsResponse({ error: "House ID is required" }, 400);
    const house = await env.DB.prepare(
      "SELECT * FROM houses WHERE id = ? AND user_id = ?"
    ).bind(houseId, userId).first();
    if (!house) return corsResponse({ error: "House not found" }, 404);
    await env.DB.prepare("DELETE FROM houses WHERE id = ?").bind(houseId).run();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const logId = v4_default();
    await env.DB.prepare(
      "INSERT INTO activity_log (id, user_id, action, created_at) VALUES (?, ?, ?, ?)"
    ).bind(logId, userId, "deleted_house", now).run();
    return corsResponse({
      success: true,
      message: "House deleted successfully"
    });
  } catch (error) {
    console.error("Delete house error:", error);
    return corsResponse({ error: "Failed to delete house: " + error.message }, 500);
  }
}
__name(handleDeleteHouse, "handleDeleteHouse");
async function onRequest2(request, env, ctx) {
  return handleRequest(request, env, ctx);
}
__name(onRequest2, "onRequest");

// ../.wrangler/tmp/pages-8R1Y1O/functionsRoutes-0.9183494132481699.mjs
var routes = [
  {
    routePath: "/api/auth/login",
    mountPath: "/api/auth",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost]
  },
  {
    routePath: "/api/auth/me",
    mountPath: "/api/auth",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet]
  },
  {
    routePath: "/api/auth/register",
    mountPath: "/api/auth",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost2]
  },
  {
    routePath: "/api/health",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet2]
  },
  {
    routePath: "/api/test",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest]
  },
  {
    routePath: "/api",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest2]
  }
];

// ../../../Users/sasha/AppData/Roaming/npm/node_modules/wrangler/node_modules/path-to-regexp/dist.es2015/index.js
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count--;
          if (count === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");

// ../../../Users/sasha/AppData/Roaming/npm/node_modules/wrangler/templates/pages-template-worker.ts
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: /* @__PURE__ */ __name(() => {
            isFailOpen = true;
          }, "passThroughOnException")
        };
        const response = await handler(context);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error) {
      if (isFailOpen) {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");

// ../../../Users/sasha/AppData/Roaming/npm/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../../Users/sasha/AppData/Roaming/npm/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// ../.wrangler/tmp/bundle-eDta6m/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = pages_template_worker_default;

// ../../../Users/sasha/AppData/Roaming/npm/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// ../.wrangler/tmp/bundle-eDta6m/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=functionsWorker-0.8752743695999627.mjs.map
