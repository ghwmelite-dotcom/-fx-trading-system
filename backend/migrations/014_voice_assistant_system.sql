-- Voice Assistant System
-- Natural language interface for trading analytics and control

-- Voice Commands Log
CREATE TABLE IF NOT EXISTS voice_commands (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,

  -- Command Input
  raw_transcript TEXT NOT NULL, -- What user said
  language TEXT DEFAULT 'en-US',
  audio_duration REAL, -- Seconds

  -- Processing
  processed_command TEXT, -- Cleaned/normalized version
  intent TEXT, -- 'query_trades', 'show_analytics', 'calculate', 'log_trade', 'get_advice'
  entities TEXT, -- JSON: Extracted entities (dates, pairs, amounts)
  confidence REAL, -- 0.0 to 1.0

  -- Execution
  status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'success', 'error', 'ambiguous'
  sql_query TEXT, -- Generated SQL (if applicable)
  api_endpoint TEXT, -- API called (if applicable)
  result_data TEXT, -- JSON: Query result or action outcome

  -- Response
  response_text TEXT, -- What assistant said back
  response_type TEXT, -- 'voice', 'text', 'visualization', 'mixed'
  response_audio_url TEXT, -- TTS audio (if generated)

  -- Performance
  processing_time_ms INTEGER,
  tokens_used INTEGER, -- AI API tokens

  -- Metadata
  device_type TEXT, -- 'mobile', 'desktop', 'tablet'
  user_agent TEXT,
  ip_address TEXT,

  created_at DATETIME DEFAULT (datetime('now')),

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Voice Assistant Settings
CREATE TABLE IF NOT EXISTS voice_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,

  -- Preferences
  is_enabled INTEGER DEFAULT 1,
  wake_word TEXT DEFAULT 'hey assistant', -- Custom wake word
  language TEXT DEFAULT 'en-US',
  voice_gender TEXT DEFAULT 'neutral', -- 'male', 'female', 'neutral'
  speech_rate REAL DEFAULT 1.0, -- 0.5 to 2.0

  -- Privacy
  store_audio INTEGER DEFAULT 0, -- Save audio recordings
  allow_cloud_processing INTEGER DEFAULT 1, -- Use cloud AI vs local only
  anonymize_queries INTEGER DEFAULT 0,

  -- Features
  auto_execute INTEGER DEFAULT 0, -- Execute commands without confirmation
  proactive_alerts INTEGER DEFAULT 1, -- Assistant can initiate conversations
  context_awareness INTEGER DEFAULT 1, -- Remember recent conversation

  -- Usage Limits (for free tier)
  daily_command_limit INTEGER DEFAULT 100,
  commands_today INTEGER DEFAULT 0,
  last_reset_date DATE DEFAULT (date('now')),

  -- Stats
  total_commands INTEGER DEFAULT 0,
  successful_commands INTEGER DEFAULT 0,
  favorite_commands TEXT, -- JSON: Most used commands

  created_at DATETIME DEFAULT (datetime('now')),
  updated_at DATETIME DEFAULT (datetime('now')),

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Custom Voice Commands (User-defined shortcuts)
CREATE TABLE IF NOT EXISTS custom_voice_commands (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,

  -- Command Definition
  trigger_phrase TEXT NOT NULL, -- e.g., "show my best day"
  action_type TEXT NOT NULL, -- 'query', 'calculation', 'navigation', 'multi_step'
  action_config TEXT NOT NULL, -- JSON: What to execute

  -- Metadata
  usage_count INTEGER DEFAULT 0,
  last_used DATETIME,
  is_active INTEGER DEFAULT 1,

  created_at DATETIME DEFAULT (datetime('now')),

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Voice Assistant Context (Conversation memory)
CREATE TABLE IF NOT EXISTS voice_context (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  session_id TEXT NOT NULL, -- Groups related commands

  -- Context Data
  context_type TEXT NOT NULL, -- 'trade_filter', 'date_range', 'pair_focus', 'analysis_mode'
  context_value TEXT NOT NULL, -- JSON: The actual context
  expires_at DATETIME,

  created_at DATETIME DEFAULT (datetime('now')),

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Voice Assistant Feedback
CREATE TABLE IF NOT EXISTS voice_feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  command_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,

  -- Feedback
  was_helpful INTEGER, -- 1=yes, 0=no
  accuracy_rating INTEGER, -- 1-5 stars
  feedback_text TEXT,
  issue_type TEXT, -- 'misunderstood', 'wrong_result', 'too_slow', 'other'

  created_at DATETIME DEFAULT (datetime('now')),

  FOREIGN KEY (command_id) REFERENCES voice_commands(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_voice_commands_user ON voice_commands(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_commands_created ON voice_commands(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_voice_commands_intent ON voice_commands(intent);
CREATE INDEX IF NOT EXISTS idx_voice_commands_status ON voice_commands(status);
CREATE INDEX IF NOT EXISTS idx_voice_settings_user ON voice_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_voice_commands_user ON custom_voice_commands(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_voice_commands_active ON custom_voice_commands(is_active);
CREATE INDEX IF NOT EXISTS idx_voice_context_user ON voice_context(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_context_session ON voice_context(session_id);
CREATE INDEX IF NOT EXISTS idx_voice_feedback_command ON voice_feedback(command_id);
