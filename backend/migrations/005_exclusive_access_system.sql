-- Exclusive Access System (100 User Limit)
-- Migration: 005_exclusive_access_system.sql

-- Platform limits configuration
CREATE TABLE IF NOT EXISTS platform_limits (
  id INTEGER PRIMARY KEY DEFAULT 1,
  max_users INTEGER DEFAULT 100,
  current_users INTEGER DEFAULT 0,
  waitlist_enabled BOOLEAN DEFAULT 1,
  invitations_enabled BOOLEAN DEFAULT 1,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  CHECK (id = 1)  -- Only one row allowed
);

-- Insert default limits
INSERT OR IGNORE INTO platform_limits (id, max_users, current_users, waitlist_enabled, invitations_enabled)
VALUES (1, 100, 0, 1, 1);

-- Waitlist table
CREATE TABLE IF NOT EXISTS waitlist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  reason TEXT,
  experience_years TEXT,
  account_size TEXT,
  priority INTEGER DEFAULT 0,
  status TEXT DEFAULT 'waiting',  -- 'waiting', 'approved', 'invited', 'registered', 'rejected'
  referral_code TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  approved_at TEXT,
  invited_at TEXT,
  registered_at TEXT
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_status ON waitlist(status);

-- Invitation codes table
CREATE TABLE IF NOT EXISTS invitation_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  created_by INTEGER,  -- user_id who created it
  used_by INTEGER,     -- user_id who used it
  max_uses INTEGER DEFAULT 1,
  current_uses INTEGER DEFAULT 0,
  expires_at TEXT,
  status TEXT DEFAULT 'active',  -- 'active', 'used', 'expired'
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  used_at TEXT,
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (used_by) REFERENCES users(id)
);

-- Index for invitation codes
CREATE INDEX IF NOT EXISTS idx_invitation_code ON invitation_codes(code);
CREATE INDEX IF NOT EXISTS idx_invitation_created_by ON invitation_codes(created_by);

-- Add columns to users table for exclusive features
-- Note: SQLite doesn't support ALTER TABLE ADD COLUMN IF NOT EXISTS in older versions
-- We'll handle this with a safer approach

-- User exclusive features table (to avoid ALTER TABLE issues)
CREATE TABLE IF NOT EXISTS user_exclusive_features (
  user_id INTEGER PRIMARY KEY,
  user_number INTEGER UNIQUE,  -- Their spot number (1-100)
  early_access BOOLEAN DEFAULT 1,
  access_tier INTEGER DEFAULT 1,  -- 1=Founding, 2=Early, 3=Beta, 4=Standard
  invited_by INTEGER,  -- user_id who invited them
  invitation_code_used TEXT,
  referral_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (invited_by) REFERENCES users(id)
);

-- Index for user numbers
CREATE INDEX IF NOT EXISTS idx_user_number ON user_exclusive_features(user_number);

-- Referral tracking table
CREATE TABLE IF NOT EXISTS referrals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  referrer_id INTEGER NOT NULL,
  referred_id INTEGER NOT NULL,
  referral_code TEXT,
  status TEXT DEFAULT 'pending',  -- 'pending', 'completed'
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT,
  FOREIGN KEY (referrer_id) REFERENCES users(id),
  FOREIGN KEY (referred_id) REFERENCES users(id)
);

-- User invitations tracking
CREATE TABLE IF NOT EXISTS user_invitations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  code TEXT NOT NULL,
  max_uses INTEGER DEFAULT 3,
  current_uses INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Waitlist notifications log
CREATE TABLE IF NOT EXISTS waitlist_notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  waitlist_id INTEGER NOT NULL,
  notification_type TEXT NOT NULL,  -- 'approved', 'invited', 'reminder'
  sent_at TEXT DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'sent',  -- 'sent', 'failed', 'opened', 'clicked'
  FOREIGN KEY (waitlist_id) REFERENCES waitlist(id)
);

-- Access tier definitions (for reference)
-- Tier 1 (1-25): Founding Members - Lifetime free, 5 invitation codes, special badge
-- Tier 2 (26-75): Early Adopters - 50% off forever, 3 invitation codes, early badge
-- Tier 3 (76-100): Beta Testers - Free for 1 year, 2 invitation codes, beta badge
-- Tier 4 (101+): Waitlist - Standard pricing when available

-- Function to get current user count (will be used in application logic)
-- This is a view for easy querying
CREATE VIEW IF NOT EXISTS user_stats AS
SELECT
  (SELECT COUNT(*) FROM users) as total_users,
  (SELECT max_users FROM platform_limits WHERE id = 1) as max_users,
  (SELECT COUNT(*) FROM users) as spots_taken,
  (SELECT max_users - COUNT(*) FROM platform_limits, users WHERE platform_limits.id = 1) as spots_remaining,
  (SELECT COUNT(*) FROM waitlist WHERE status = 'waiting') as waitlist_size;

-- Trigger to update current_users count
CREATE TRIGGER IF NOT EXISTS update_user_count_on_insert
AFTER INSERT ON users
BEGIN
  UPDATE platform_limits
  SET current_users = (SELECT COUNT(*) FROM users),
      updated_at = CURRENT_TIMESTAMP
  WHERE id = 1;
END;

CREATE TRIGGER IF NOT EXISTS update_user_count_on_delete
AFTER DELETE ON users
BEGIN
  UPDATE platform_limits
  SET current_users = (SELECT COUNT(*) FROM users),
      updated_at = CURRENT_TIMESTAMP
  WHERE id = 1;
END;

-- Sample data for testing (comment out in production)
-- INSERT INTO waitlist (email, name, reason, experience_years, priority) VALUES
-- ('test1@example.com', 'John Trader', 'Professional trader with 5 years experience', '5+', 10),
-- ('test2@example.com', 'Jane Investor', 'Looking to improve my trading psychology', '3-5', 5);
