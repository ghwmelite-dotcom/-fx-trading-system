/**
 * Profile Service
 * Manages public trader profiles
 */

/**
 * Get or create user profile
 */
export async function getOrCreateProfile(userId, env) {
  let profile = await env.DB.prepare(`
    SELECT * FROM user_profiles WHERE user_id = ?
  `).bind(userId).first();

  if (!profile) {
    // Create default profile
    await env.DB.prepare(`
      INSERT INTO user_profiles (user_id) VALUES (?)
    `).bind(userId).run();

    profile = await env.DB.prepare(`
      SELECT * FROM user_profiles WHERE user_id = ?
    `).bind(userId).first();
  }

  // Parse JSON fields
  return {
    ...profile,
    preferredPairs: profile.preferred_pairs ? JSON.parse(profile.preferred_pairs) : []
  };
}

/**
 * Get public profile by user ID
 */
export async function getPublicProfile(userId, viewerId, env) {
  const profile = await env.DB.prepare(`
    SELECT
      up.*,
      u.email
    FROM user_profiles up
    JOIN users u ON up.user_id = u.id
    WHERE up.user_id = ? AND up.is_public = 1
  `).bind(userId).first();

  if (!profile) {
    return null;
  }

  // Check if viewer is following
  let isFollowing = false;
  let isCopying = false;

  if (viewerId && viewerId !== userId) {
    const connection = await env.DB.prepare(`
      SELECT * FROM social_connections
      WHERE follower_id = ? AND following_id = ?
    `).bind(viewerId, userId).first();

    if (connection) {
      isFollowing = true;
      isCopying = connection.connection_type === 'copy' && connection.is_copying_active === 1;
    }
  }

  return {
    userId: profile.user_id,
    displayName: profile.display_name || maskEmail(profile.email),
    bio: profile.bio,
    avatarUrl: profile.avatar_url,
    country: profile.country,
    tradingSince: profile.trading_since,
    tradingStyle: profile.trading_style,
    riskTolerance: profile.risk_tolerance,
    isVerified: profile.is_verified === 1,
    verificationLevel: profile.verification_level,
    stats: {
      winRate: profile.public_win_rate,
      profitFactor: profile.public_profit_factor,
      totalTrades: profile.public_total_trades,
      roi: profile.public_roi
    },
    social: {
      followersCount: profile.followers_count,
      followingCount: profile.following_count,
      copiersCount: profile.copiers_count
    },
    preferences: {
      showTrades: profile.show_trades === 1,
      allowCopying: profile.allow_copying === 1
    },
    isFollowing,
    isCopying
  };
}

/**
 * Update user profile
 */
export async function updateProfile(userId, updates, env) {
  const allowedFields = [
    'display_name', 'bio', 'avatar_url', 'country', 'trading_since',
    'trading_style', 'preferred_pairs', 'risk_tolerance',
    'is_public', 'show_trades', 'allow_copying', 'allow_followers'
  ];

  const updateParts = [];
  const values = [];

  for (const [key, value] of Object.entries(updates)) {
    const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase(); // camelCase to snake_case

    if (allowedFields.includes(dbKey)) {
      updateParts.push(`${dbKey} = ?`);

      if (Array.isArray(value)) {
        values.push(JSON.stringify(value));
      } else {
        values.push(value);
      }
    }
  }

  if (updateParts.length === 0) {
    return { error: 'No valid fields to update' };
  }

  values.push(userId);

  await env.DB.prepare(`
    UPDATE user_profiles
    SET ${updateParts.join(', ')}, updated_at = datetime('now')
    WHERE user_id = ?
  `).bind(...values).run();

  return { success: true };
}

/**
 * Update public stats from trades
 */
export async function updatePublicStats(userId, env) {
  // Calculate stats from trades
  const stats = await env.DB.prepare(`
    SELECT
      COUNT(*) as total_trades,
      SUM(CASE WHEN profit > 0 THEN 1 ELSE 0 END) as wins,
      SUM(CASE WHEN profit > 0 THEN profit ELSE 0 END) as gross_profit,
      ABS(SUM(CASE WHEN profit < 0 THEN profit ELSE 0 END)) as gross_loss,
      SUM(profit) as net_profit
    FROM trades
    WHERE user_id = ?
  `).bind(userId).first();

  if (!stats || stats.total_trades === 0) {
    return;
  }

  const winRate = (stats.wins / stats.total_trades) * 100;
  const profitFactor = stats.gross_loss > 0 ? stats.gross_profit / stats.gross_loss : 0;

  // Get initial balance for ROI calculation
  const firstTrade = await env.DB.prepare(`
    SELECT balance, profit FROM trades
    WHERE user_id = ?
    ORDER BY close_time ASC
    LIMIT 1
  `).bind(userId).first();

  const initialBalance = firstTrade ? (firstTrade.balance - firstTrade.profit) : 10000;
  const roi = (stats.net_profit / initialBalance) * 100;

  await env.DB.prepare(`
    UPDATE user_profiles
    SET public_win_rate = ?,
        public_profit_factor = ?,
        public_total_trades = ?,
        public_roi = ?,
        last_stats_update = datetime('now')
    WHERE user_id = ?
  `).bind(
    parseFloat(winRate.toFixed(2)),
    parseFloat(profitFactor.toFixed(2)),
    stats.total_trades,
    parseFloat(roi.toFixed(2)),
    userId
  ).run();
}

/**
 * Search public profiles
 */
export async function searchProfiles(query, limit, env) {
  const result = await env.DB.prepare(`
    SELECT
      up.user_id,
      up.display_name,
      up.avatar_url,
      up.country,
      up.trading_style,
      up.is_verified,
      up.public_win_rate,
      up.public_roi,
      up.followers_count
    FROM user_profiles up
    WHERE up.is_public = 1
    AND (
      up.display_name LIKE ?
      OR up.country LIKE ?
      OR up.trading_style LIKE ?
    )
    ORDER BY up.followers_count DESC
    LIMIT ?
  `).bind(`%${query}%`, `%${query}%`, `%${query}%`, limit || 20).all();

  return result.results;
}

/**
 * Get verified traders
 */
export async function getVerifiedTraders(limit, env) {
  const result = await env.DB.prepare(`
    SELECT
      up.user_id,
      up.display_name,
      up.avatar_url,
      up.country,
      up.trading_style,
      up.verification_level,
      up.public_win_rate,
      up.public_profit_factor,
      up.public_roi,
      up.followers_count,
      up.copiers_count
    FROM user_profiles up
    WHERE up.is_public = 1 AND up.is_verified = 1
    ORDER BY up.followers_count DESC
    LIMIT ?
  `).bind(limit || 20).all();

  return result.results;
}

/**
 * Mask email for display name
 */
function maskEmail(email) {
  if (!email) return 'Trader';
  const [local] = email.split('@');
  return local.substring(0, 3) + '***';
}

/**
 * Request verification
 */
export async function requestVerification(userId, verificationType, env) {
  // In a real app, this would trigger a verification process
  // For now, just mark as pending

  await env.DB.prepare(`
    UPDATE user_profiles
    SET verification_level = 'pending',
        updated_at = datetime('now')
    WHERE user_id = ?
  `).bind(userId).run();

  return {
    success: true,
    message: 'Verification request submitted'
  };
}
