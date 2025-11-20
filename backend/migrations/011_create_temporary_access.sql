-- Migration: Create temporary_access table for time-limited admin access
-- Purpose: Enable admins to generate temporary access tokens with configurable expiration times

CREATE TABLE IF NOT EXISTS temporary_access (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  access_token TEXT UNIQUE NOT NULL,
  access_code TEXT UNIQUE NOT NULL, -- Human-readable code for easier sharing
  created_by_user_id INTEGER NOT NULL,
  granted_to_email TEXT, -- Optional: restrict to specific email
  granted_to_user_id INTEGER, -- Set when token is used
  access_level TEXT NOT NULL DEFAULT 'admin', -- 'admin' or 'read_only'
  duration_minutes INTEGER NOT NULL, -- 30, 60, 120, etc.
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  used_at DATETIME,
  last_activity_at DATETIME,
  is_active INTEGER NOT NULL DEFAULT 1,
  is_used INTEGER NOT NULL DEFAULT 0,
  ip_address TEXT, -- IP that used the token
  user_agent TEXT, -- Browser/client info
  notes TEXT, -- Admin notes about why this access was granted
  revoked_at DATETIME,
  revoked_by_user_id INTEGER,
  FOREIGN KEY (created_by_user_id) REFERENCES users(id),
  FOREIGN KEY (granted_to_user_id) REFERENCES users(id),
  FOREIGN KEY (revoked_by_user_id) REFERENCES users(id)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_temporary_access_token ON temporary_access(access_token);
CREATE INDEX IF NOT EXISTS idx_temporary_access_code ON temporary_access(access_code);
CREATE INDEX IF NOT EXISTS idx_temporary_access_expires ON temporary_access(expires_at);
CREATE INDEX IF NOT EXISTS idx_temporary_access_created_by ON temporary_access(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_temporary_access_active ON temporary_access(is_active, expires_at);

-- Audit log for tracking temporary access events
INSERT INTO audit_logs (user_id, action, details)
VALUES (NULL, 'MIGRATION', 'Created temporary_access table for time-limited admin access');
