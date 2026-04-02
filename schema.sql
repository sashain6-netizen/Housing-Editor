-- ============================================================
-- Housing Editor Database Schema
-- Cloudflare D1 (SQLite-compatible)
-- ============================================================

-- ============================================================
-- Users Table
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  profile_image_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- Houses Table
-- ============================================================
CREATE TABLE IF NOT EXISTS houses (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  code TEXT DEFAULT '',
  thumbnail_url TEXT,
  is_public INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- Sessions Table (for JWT token tracking)
-- ============================================================
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token_hash TEXT UNIQUE NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- House Collaborators Table (for future multi-user support)
-- ============================================================
CREATE TABLE IF NOT EXISTS house_collaborators (
  id TEXT PRIMARY KEY,
  house_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  permission_level TEXT CHECK(permission_level IN ('view', 'edit', 'admin')) DEFAULT 'view',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (house_id) REFERENCES houses(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(house_id, user_id)
);

-- ============================================================
-- Activity Log Table (for auditing)
-- ============================================================
CREATE TABLE IF NOT EXISTS activity_log (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  house_id TEXT,
  action TEXT NOT NULL,
  details TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (house_id) REFERENCES houses(id) ON DELETE SET NULL
);

-- ============================================================
-- Indexes for Performance
-- ============================================================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_houses_user_id ON houses(user_id);
CREATE INDEX idx_houses_is_public ON houses(is_public);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token_hash ON sessions(token_hash);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX idx_collaborators_house_id ON house_collaborators(house_id);
CREATE INDEX idx_collaborators_user_id ON house_collaborators(user_id);
CREATE INDEX idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX idx_activity_log_house_id ON activity_log(house_id);
CREATE INDEX idx_activity_log_created_at ON activity_log(created_at);
