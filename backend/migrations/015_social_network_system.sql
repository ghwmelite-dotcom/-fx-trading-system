-- Social Trading Network
-- Community features: following, copying, sharing, marketplace

-- User Public Profiles
CREATE TABLE IF NOT EXISTS user_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,

  -- Public Info
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  country TEXT,
  trading_since DATE,

  -- Trading Style
  trading_style TEXT, -- 'scalper', 'day_trader', 'swing_trader', 'position_trader'
  preferred_pairs TEXT, -- JSON array
  risk_tolerance TEXT, -- 'conservative', 'moderate', 'aggressive'

  -- Visibility Settings
  is_public INTEGER DEFAULT 0, -- Show profile in community
  show_trades INTEGER DEFAULT 0, -- Allow others to see trades
  allow_copying INTEGER DEFAULT 0, -- Enable trade copying
  allow_followers INTEGER DEFAULT 1,

  -- Verification
  is_verified INTEGER DEFAULT 0, -- Platform verified
  verification_level TEXT, -- 'email', 'kyc', 'pro_trader'
  verification_date DATETIME,

  -- Stats (public-facing)
  public_win_rate REAL,
  public_profit_factor REAL,
  public_total_trades INTEGER DEFAULT 0,
  public_roi REAL,
  last_stats_update DATETIME,

  -- Social Stats
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  copiers_count INTEGER DEFAULT 0,

  created_at DATETIME DEFAULT (datetime('now')),
  updated_at DATETIME DEFAULT (datetime('now')),

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Social Connections (Follow system)
CREATE TABLE IF NOT EXISTS social_connections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  follower_id INTEGER NOT NULL,
  following_id INTEGER NOT NULL,

  -- Connection Type
  connection_type TEXT DEFAULT 'follow', -- 'follow', 'copy', 'block'

  -- Copying Settings (if connection_type = 'copy')
  copy_settings TEXT, -- JSON: {lot_multiplier, max_risk, pairs_to_copy}
  is_copying_active INTEGER DEFAULT 0,

  -- Stats
  copy_performance TEXT, -- JSON: Performance while copying this user
  total_trades_copied INTEGER DEFAULT 0,

  created_at DATETIME DEFAULT (datetime('now')),

  FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(follower_id, following_id)
);

-- Shared Trades (Public trade feed)
CREATE TABLE IF NOT EXISTS shared_trades (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  trade_id INTEGER NOT NULL,

  -- Sharing Settings
  share_type TEXT DEFAULT 'public', -- 'public', 'followers_only', 'copiers_only'
  include_entry REAL DEFAULT 1, -- Show entry price
  include_exit REAL DEFAULT 1, -- Show exit price
  include_profit REAL DEFAULT 0, -- Show exact profit amount
  include_analysis INTEGER DEFAULT 1, -- Show notes/analysis

  -- Post Details
  caption TEXT,
  hashtags TEXT, -- JSON array

  -- Engagement
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  copies_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,

  -- Metadata
  is_pinned INTEGER DEFAULT 0,
  is_archived INTEGER DEFAULT 0,

  created_at DATETIME DEFAULT (datetime('now')),

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (trade_id) REFERENCES trades(id) ON DELETE CASCADE,
  UNIQUE(user_id, trade_id)
);

-- Trade Likes
CREATE TABLE IF NOT EXISTS trade_likes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shared_trade_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,

  created_at DATETIME DEFAULT (datetime('now')),

  FOREIGN KEY (shared_trade_id) REFERENCES shared_trades(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(shared_trade_id, user_id)
);

-- Trade Comments
CREATE TABLE IF NOT EXISTS trade_comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shared_trade_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,

  comment_text TEXT NOT NULL,
  parent_comment_id INTEGER, -- For replies

  -- Engagement
  likes_count INTEGER DEFAULT 0,

  -- Moderation
  is_edited INTEGER DEFAULT 0,
  edited_at DATETIME,
  is_deleted INTEGER DEFAULT 0,
  deleted_at DATETIME,

  created_at DATETIME DEFAULT (datetime('now')),

  FOREIGN KEY (shared_trade_id) REFERENCES shared_trades(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_comment_id) REFERENCES trade_comments(id) ON DELETE CASCADE
);

-- Strategy Marketplace
CREATE TABLE IF NOT EXISTS strategy_marketplace (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  seller_id INTEGER NOT NULL,

  -- Strategy Details
  strategy_name TEXT NOT NULL,
  description TEXT NOT NULL,
  strategy_type TEXT NOT NULL, -- 'ea', 'indicator', 'template', 'signals'

  -- Files & Content
  file_url TEXT, -- EA/indicator file (stored in R2)
  documentation_url TEXT,
  screenshots TEXT, -- JSON array of URLs
  video_url TEXT,

  -- Pricing
  price REAL NOT NULL,
  currency TEXT DEFAULT 'USD',
  license_type TEXT DEFAULT 'lifetime', -- 'lifetime', 'monthly', 'yearly'

  -- Performance (if EA/strategy)
  backtest_results TEXT, -- JSON: Key metrics
  verified_performance INTEGER DEFAULT 0,

  -- Sales
  total_sales INTEGER DEFAULT 0,
  revenue_generated REAL DEFAULT 0,
  average_rating REAL DEFAULT 0,
  reviews_count INTEGER DEFAULT 0,

  -- Status
  status TEXT DEFAULT 'draft', -- 'draft', 'pending_review', 'active', 'suspended'
  approval_date DATETIME,

  created_at DATETIME DEFAULT (datetime('now')),
  updated_at DATETIME DEFAULT (datetime('now')),

  FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Marketplace Purchases
CREATE TABLE IF NOT EXISTS marketplace_purchases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  buyer_id INTEGER NOT NULL,
  strategy_id INTEGER NOT NULL,

  -- Transaction
  amount_paid REAL NOT NULL,
  currency TEXT DEFAULT 'USD',
  payment_method TEXT,
  transaction_id TEXT,

  -- License
  license_key TEXT UNIQUE,
  expires_at DATETIME, -- NULL for lifetime

  -- Status
  status TEXT DEFAULT 'active', -- 'active', 'refunded', 'expired', 'revoked'

  -- Satisfaction
  rating INTEGER, -- 1-5 stars
  review_text TEXT,
  reviewed_at DATETIME,

  created_at DATETIME DEFAULT (datetime('now')),

  FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (strategy_id) REFERENCES strategy_marketplace(id) ON DELETE CASCADE
);

-- Leaderboards
CREATE TABLE IF NOT EXISTS leaderboards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- Period
  period_type TEXT NOT NULL, -- 'daily', 'weekly', 'monthly', 'all_time'
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Rankings (JSON array of user stats)
  rankings TEXT NOT NULL,

  -- Metadata
  generated_at DATETIME DEFAULT (datetime('now')),

  UNIQUE(period_type, period_start)
);

-- Social Notifications
CREATE TABLE IF NOT EXISTS social_notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,

  -- Notification Type
  type TEXT NOT NULL, -- 'new_follower', 'trade_liked', 'trade_commented', 'trade_copied', 'mentioned', 'milestone'
  title TEXT NOT NULL,
  message TEXT NOT NULL,

  -- Related Entities
  related_user_id INTEGER, -- Who triggered this notification
  related_trade_id INTEGER,
  related_comment_id INTEGER,

  -- Status
  is_read INTEGER DEFAULT 0,
  read_at DATETIME,

  created_at DATETIME DEFAULT (datetime('now')),

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (related_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_user ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_public ON user_profiles(is_public, is_verified);
CREATE INDEX IF NOT EXISTS idx_social_connections_follower ON social_connections(follower_id);
CREATE INDEX IF NOT EXISTS idx_social_connections_following ON social_connections(following_id);
CREATE INDEX IF NOT EXISTS idx_social_connections_type ON social_connections(connection_type);
CREATE INDEX IF NOT EXISTS idx_shared_trades_user ON shared_trades(user_id);
CREATE INDEX IF NOT EXISTS idx_shared_trades_created ON shared_trades(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trade_likes_shared_trade ON trade_likes(shared_trade_id);
CREATE INDEX IF NOT EXISTS idx_trade_likes_user ON trade_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_trade_comments_shared_trade ON trade_comments(shared_trade_id);
CREATE INDEX IF NOT EXISTS idx_trade_comments_user ON trade_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_strategy_marketplace_seller ON strategy_marketplace(seller_id);
CREATE INDEX IF NOT EXISTS idx_strategy_marketplace_status ON strategy_marketplace(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_purchases_buyer ON marketplace_purchases(buyer_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_purchases_strategy ON marketplace_purchases(strategy_id);
CREATE INDEX IF NOT EXISTS idx_leaderboards_period ON leaderboards(period_type, period_start);
CREATE INDEX IF NOT EXISTS idx_social_notifications_user ON social_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_social_notifications_unread ON social_notifications(is_read, created_at DESC);
