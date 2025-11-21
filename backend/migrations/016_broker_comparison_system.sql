-- Broker Comparison & Cost Optimizer
-- Helps users find the most cost-effective brokers based on their trading style

-- Brokers Database
CREATE TABLE IF NOT EXISTS brokers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- Basic Info
  name TEXT NOT NULL UNIQUE,
  official_website TEXT,
  logo_url TEXT,
  country TEXT,
  founded_year INTEGER,

  -- Regulation
  is_regulated INTEGER DEFAULT 0,
  regulators TEXT, -- JSON array: ["FCA", "CySEC"]
  regulation_details TEXT,

  -- Account Types (JSON array of objects)
  account_types TEXT,

  -- Trading Conditions
  min_deposit REAL,
  max_leverage TEXT, -- e.g., "1:500"
  platforms TEXT, -- JSON: ["MT4", "MT5", "cTrader"]

  -- Fees & Costs (per major pair, in pips)
  eurusd_spread_avg REAL,
  gbpusd_spread_avg REAL,
  usdjpy_spread_avg REAL,
  audusd_spread_avg REAL,
  usdcad_spread_avg REAL,

  -- Commission Structure
  commission_type TEXT, -- 'spread', 'commission', 'both'
  commission_per_lot REAL,
  commission_currency TEXT DEFAULT 'USD',

  -- Swap/Rollover (overnight fees)
  swap_free_available INTEGER DEFAULT 0,
  typical_swap_long REAL, -- Average across pairs
  typical_swap_short REAL,

  -- Execution
  execution_type TEXT, -- 'market', 'instant', 'ecn', 'stp'
  avg_execution_speed_ms REAL,
  slippage_rating REAL, -- 1-5 scale

  -- Withdrawal & Deposits
  deposit_methods TEXT, -- JSON: ["card", "wire", "crypto"]
  withdrawal_methods TEXT,
  withdrawal_fee REAL,
  withdrawal_processing_days INTEGER,

  -- Customer Support
  support_channels TEXT, -- JSON: ["email", "chat", "phone"]
  support_languages TEXT, -- JSON
  support_rating REAL, -- 1-5 stars

  -- Platform Features
  has_mobile_app INTEGER DEFAULT 1,
  has_demo_account INTEGER DEFAULT 1,
  has_negative_balance_protection INTEGER DEFAULT 1,
  has_segregated_accounts INTEGER DEFAULT 1,

  -- Affiliate Info
  affiliate_program INTEGER DEFAULT 0,
  affiliate_commission_rate REAL,
  referral_link TEXT, -- Our affiliate link

  -- Stats & Ratings
  overall_rating REAL, -- 1-5 stars (our calculation)
  user_reviews_count INTEGER DEFAULT 0,
  user_rating_avg REAL,

  -- Status
  is_active INTEGER DEFAULT 1,
  last_data_update DATETIME,

  created_at DATETIME DEFAULT (datetime('now')),
  updated_at DATETIME DEFAULT (datetime('now'))
);

-- User Broker Connections
CREATE TABLE IF NOT EXISTS user_brokers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  broker_id INTEGER NOT NULL,

  -- Account Info
  account_number TEXT,
  account_type TEXT,
  server_name TEXT,
  leverage TEXT,

  -- Status
  is_active INTEGER DEFAULT 1,
  is_primary INTEGER DEFAULT 0,

  -- Stats (calculated from user's trades)
  total_trades INTEGER DEFAULT 0,
  total_volume_lots REAL DEFAULT 0,
  total_commissions_paid REAL DEFAULT 0,
  total_spread_cost REAL DEFAULT 0,
  total_swap_cost REAL DEFAULT 0,
  estimated_total_cost REAL DEFAULT 0,

  -- Last sync
  last_trade_date DATETIME,

  created_at DATETIME DEFAULT (datetime('now')),
  updated_at DATETIME DEFAULT (datetime('now')),

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (broker_id) REFERENCES brokers(id) ON DELETE CASCADE,
  UNIQUE(user_id, broker_id)
);

-- Broker Cost Calculations (Per-user analysis)
CREATE TABLE IF NOT EXISTS broker_cost_analysis (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  broker_id INTEGER, -- NULL means "your current broker"

  -- Analysis Period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  analysis_type TEXT DEFAULT 'historical', -- 'historical', 'projection'

  -- Trading Profile Used (from user's actual data)
  trading_profile TEXT, -- JSON: {avg_trades_per_day, avg_lot_size, preferred_pairs, avg_hold_time}

  -- Cost Breakdown
  spread_cost REAL DEFAULT 0,
  commission_cost REAL DEFAULT 0,
  swap_cost REAL DEFAULT 0,
  other_fees REAL DEFAULT 0,
  total_cost REAL DEFAULT 0,

  -- Per Trade Averages
  avg_cost_per_trade REAL,
  avg_cost_per_lot REAL,

  -- Comparison (if comparing to another broker)
  compared_to_broker_id INTEGER,
  potential_savings REAL, -- How much user could save
  savings_percentage REAL,

  -- Recommendations
  is_recommended INTEGER DEFAULT 0,
  recommendation_reason TEXT,

  generated_at DATETIME DEFAULT (datetime('now')),

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (broker_id) REFERENCES brokers(id) ON DELETE CASCADE,
  FOREIGN KEY (compared_to_broker_id) REFERENCES brokers(id) ON DELETE SET NULL
);

-- Broker Reviews (User-submitted)
CREATE TABLE IF NOT EXISTS broker_reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  broker_id INTEGER NOT NULL,

  -- Review Content
  rating INTEGER NOT NULL, -- 1-5 stars
  title TEXT,
  review_text TEXT NOT NULL,

  -- Rating Categories
  spread_rating INTEGER, -- 1-5
  execution_rating INTEGER,
  support_rating INTEGER,
  platform_rating INTEGER,
  withdrawal_rating INTEGER,

  -- Verification
  is_verified_customer INTEGER DEFAULT 0, -- We verified they actually use this broker
  verification_date DATETIME,

  -- Trading Volume (for context)
  user_trading_volume TEXT, -- 'beginner', 'intermediate', 'advanced', 'professional'

  -- Moderation
  is_approved INTEGER DEFAULT 0,
  is_flagged INTEGER DEFAULT 0,
  moderator_notes TEXT,

  -- Engagement
  helpful_votes INTEGER DEFAULT 0,
  unhelpful_votes INTEGER DEFAULT 0,

  created_at DATETIME DEFAULT (datetime('now')),
  updated_at DATETIME DEFAULT (datetime('now')),

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (broker_id) REFERENCES brokers(id) ON DELETE CASCADE
);

-- Broker Comparison Sessions (Track what users are comparing)
CREATE TABLE IF NOT EXISTS broker_comparisons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,

  -- Brokers Being Compared
  broker_ids TEXT NOT NULL, -- JSON array of broker IDs

  -- User's Criteria Weights
  criteria_weights TEXT, -- JSON: {spread: 0.4, commission: 0.3, regulation: 0.2, support: 0.1}

  -- Result
  recommended_broker_id INTEGER,
  comparison_result TEXT, -- JSON: Full comparison matrix

  -- Actions Taken
  user_clicked_affiliate_link INTEGER DEFAULT 0,
  user_opened_account INTEGER DEFAULT 0,

  created_at DATETIME DEFAULT (datetime('now')),

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (recommended_broker_id) REFERENCES brokers(id) ON DELETE SET NULL
);

-- Real-time Spread Monitoring (Optional - for live spreads)
CREATE TABLE IF NOT EXISTS broker_live_spreads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  broker_id INTEGER NOT NULL,

  -- Pair & Spread
  symbol TEXT NOT NULL,
  current_spread REAL NOT NULL,
  ask_price REAL,
  bid_price REAL,

  -- Session
  session TEXT, -- 'asian', 'european', 'american', 'overlap'

  -- Stats
  daily_avg_spread REAL,
  daily_min_spread REAL,
  daily_max_spread REAL,

  captured_at DATETIME DEFAULT (datetime('now')),

  FOREIGN KEY (broker_id) REFERENCES brokers(id) ON DELETE CASCADE
);

-- Broker Alerts (Price alerts for cost optimization)
CREATE TABLE IF NOT EXISTS broker_alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,

  -- Alert Condition
  alert_type TEXT NOT NULL, -- 'better_broker_found', 'spread_improvement', 'commission_change', 'savings_opportunity'
  title TEXT NOT NULL,
  message TEXT NOT NULL,

  -- Related Data
  broker_id INTEGER,
  potential_savings REAL,
  recommendation_data TEXT, -- JSON

  -- Status
  is_read INTEGER DEFAULT 0,
  read_at DATETIME,
  dismissed INTEGER DEFAULT 0,

  created_at DATETIME DEFAULT (datetime('now')),

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (broker_id) REFERENCES brokers(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_brokers_active ON brokers(is_active);
CREATE INDEX IF NOT EXISTS idx_brokers_rating ON brokers(overall_rating DESC);
CREATE INDEX IF NOT EXISTS idx_user_brokers_user ON user_brokers(user_id);
CREATE INDEX IF NOT EXISTS idx_user_brokers_broker ON user_brokers(broker_id);
CREATE INDEX IF NOT EXISTS idx_user_brokers_active ON user_brokers(is_active);
CREATE INDEX IF NOT EXISTS idx_broker_cost_analysis_user ON broker_cost_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_broker_cost_analysis_period ON broker_cost_analysis(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_broker_reviews_broker ON broker_reviews(broker_id);
CREATE INDEX IF NOT EXISTS idx_broker_reviews_approved ON broker_reviews(is_approved);
CREATE INDEX IF NOT EXISTS idx_broker_reviews_rating ON broker_reviews(rating DESC);
CREATE INDEX IF NOT EXISTS idx_broker_comparisons_user ON broker_comparisons(user_id);
CREATE INDEX IF NOT EXISTS idx_broker_live_spreads_broker ON broker_live_spreads(broker_id);
CREATE INDEX IF NOT EXISTS idx_broker_live_spreads_symbol ON broker_live_spreads(symbol);
CREATE INDEX IF NOT EXISTS idx_broker_live_spreads_captured ON broker_live_spreads(captured_at DESC);
CREATE INDEX IF NOT EXISTS idx_broker_alerts_user ON broker_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_broker_alerts_unread ON broker_alerts(is_read, created_at DESC);
