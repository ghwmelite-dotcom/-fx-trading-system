-- ============================================
-- APPLICATION SYSTEM FOR CURATED ACCESS
-- First 25 spots require admin approval
-- ============================================

-- Applications table
CREATE TABLE IF NOT EXISTS applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  experience_years TEXT,
  account_size TEXT,
  trading_style TEXT,
  why_you TEXT,
  proof_url TEXT,
  referral_source TEXT,
  priority INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  invitation_code TEXT UNIQUE,
  reviewed_at DATETIME,
  reviewed_by INTEGER,
  expires_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_priority ON applications(priority DESC);
CREATE INDEX IF NOT EXISTS idx_applications_created ON applications(created_at DESC);

-- Admin notes for applications
CREATE TABLE IF NOT EXISTS application_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  application_id INTEGER NOT NULL,
  admin_id INTEGER NOT NULL,
  note TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (application_id) REFERENCES applications(id)
);

-- Track application views by admins
CREATE TABLE IF NOT EXISTS application_views (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  application_id INTEGER NOT NULL,
  admin_id INTEGER NOT NULL,
  viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (application_id) REFERENCES applications(id)
);
