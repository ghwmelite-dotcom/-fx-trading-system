-- Create platform_settings table for storing customizable platform configurations
CREATE TABLE IF NOT EXISTS platform_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT,
  setting_type TEXT DEFAULT 'string', -- 'string', 'boolean', 'number', 'json', 'image'
  description TEXT,
  updated_by INTEGER,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_settings_key ON platform_settings(setting_key);

-- Insert default platform settings
INSERT INTO platform_settings (setting_key, setting_value, setting_type, description)
VALUES
  ('platform_name', 'FX Trading Dashboard', 'string', 'Platform name displayed in header and title'),
  ('logo_url', NULL, 'image', 'Platform logo image URL (stored in R2)'),
  ('favicon_url', NULL, 'image', 'Platform favicon URL (stored in R2)'),
  ('theme_mode', 'dark', 'string', 'Default theme mode (dark or light)'),
  ('primary_color', '#8b5cf6', 'string', 'Primary brand color (purple)'),
  ('allow_user_registration', '0', 'boolean', 'Allow users to self-register'),
  ('require_email_verification', '1', 'boolean', 'Require email verification for new users'),
  ('session_timeout_hours', '24', 'number', 'JWT token expiration in hours');
