-- Psychology Scoring System
-- Tracks trading behavior patterns and emotional states to prevent costly mistakes

-- User Psychology Profiles
CREATE TABLE IF NOT EXISTS psychology_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,

  -- Current Mental State
  current_score INTEGER DEFAULT 100, -- 0-100 scale
  last_score_update DATETIME DEFAULT (datetime('now')),

  -- Trading Discipline Metrics
  revenge_trading_risk INTEGER DEFAULT 0, -- 0-100
  overtrading_risk INTEGER DEFAULT 0,
  risk_discipline_score INTEGER DEFAULT 100,
  consistency_score INTEGER DEFAULT 100,

  -- Behavior Patterns
  avg_position_size REAL DEFAULT 0,
  avg_trades_per_day REAL DEFAULT 0,
  avg_trading_hours TEXT, -- JSON: {"start": "09:00", "end": "17:00"}
  preferred_pairs TEXT, -- JSON: ["EURUSD", "GBPUSD"]

  -- Emotional Indicators
  tilt_threshold REAL DEFAULT 3.0, -- Consecutive losses before tilt
  cooldown_period INTEGER DEFAULT 120, -- Minutes to wait after tilt
  last_tilt_detected DATETIME,

  -- Achievements & Milestones
  longest_discipline_streak INTEGER DEFAULT 0,
  current_discipline_streak INTEGER DEFAULT 0,
  total_alerts_heeded INTEGER DEFAULT 0,
  total_alerts_ignored INTEGER DEFAULT 0,

  created_at DATETIME DEFAULT (datetime('now')),
  updated_at DATETIME DEFAULT (datetime('now')),

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Psychology Alerts
CREATE TABLE IF NOT EXISTS psychology_alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,

  -- Alert Details
  alert_type TEXT NOT NULL, -- 'revenge_trading', 'overtrading', 'oversized_position', 'outside_hours', 'tilt_detected'
  severity TEXT NOT NULL, -- 'low', 'medium', 'high', 'critical'
  title TEXT NOT NULL,
  message TEXT NOT NULL,

  -- Context
  trigger_data TEXT, -- JSON: Details about what triggered this alert
  recommended_action TEXT,

  -- User Response
  status TEXT DEFAULT 'pending', -- 'pending', 'viewed', 'acknowledged', 'dismissed', 'heeded'
  user_response TEXT, -- User's note about how they handled it
  response_at DATETIME,

  -- Trade Association
  related_trade_id INTEGER,
  prevented_trade INTEGER DEFAULT 0, -- 1 if user didn't trade after alert

  created_at DATETIME DEFAULT (datetime('now')),
  expires_at DATETIME, -- Alert relevance window

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (related_trade_id) REFERENCES trades(id) ON DELETE SET NULL
);

-- Psychology Events Log
CREATE TABLE IF NOT EXISTS psychology_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,

  -- Event Details
  event_type TEXT NOT NULL, -- 'pattern_detected', 'score_change', 'milestone_achieved', 'streak_broken'
  event_data TEXT NOT NULL, -- JSON with event details
  impact_score INTEGER, -- -50 to +50 (how much this affected overall score)

  -- Timestamps
  created_at DATETIME DEFAULT (datetime('now')),

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Psychology Insights (AI-generated)
CREATE TABLE IF NOT EXISTS psychology_insights (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,

  -- Insight Details
  insight_type TEXT NOT NULL, -- 'pattern', 'suggestion', 'warning', 'achievement'
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  confidence REAL DEFAULT 0.0, -- 0.0 to 1.0

  -- AI Source
  generated_by TEXT, -- 'rule_engine', 'ml_model', 'ai_coach'
  ai_model TEXT, -- Which AI model generated this

  -- Metadata
  supporting_data TEXT, -- JSON: Evidence for this insight
  action_items TEXT, -- JSON: Suggested actions

  -- User Interaction
  is_read INTEGER DEFAULT 0,
  is_useful INTEGER, -- User feedback: 1=helpful, 0=not helpful, NULL=no feedback
  user_notes TEXT,

  created_at DATETIME DEFAULT (datetime('now')),
  expires_at DATETIME, -- Insights can become outdated

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Trading Rules & Boundaries (User-defined)
CREATE TABLE IF NOT EXISTS trading_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,

  -- Rule Definition
  rule_name TEXT NOT NULL,
  rule_type TEXT NOT NULL, -- 'max_trades_per_day', 'max_position_size', 'trading_hours', 'max_daily_loss', 'pair_restriction'
  rule_value TEXT NOT NULL, -- JSON: Depends on rule_type

  -- Enforcement
  is_active INTEGER DEFAULT 1,
  enforcement_level TEXT DEFAULT 'warning', -- 'warning', 'prevent', 'log_only'

  -- Violations
  total_violations INTEGER DEFAULT 0,
  last_violation DATETIME,

  created_at DATETIME DEFAULT (datetime('now')),
  updated_at DATETIME DEFAULT (datetime('now')),

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_psychology_profiles_user ON psychology_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_psychology_alerts_user ON psychology_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_psychology_alerts_status ON psychology_alerts(status);
CREATE INDEX IF NOT EXISTS idx_psychology_alerts_created ON psychology_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_psychology_events_user ON psychology_events(user_id);
CREATE INDEX IF NOT EXISTS idx_psychology_events_created ON psychology_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_psychology_insights_user ON psychology_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_psychology_insights_unread ON psychology_insights(is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trading_rules_user ON trading_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_trading_rules_active ON trading_rules(is_active);
