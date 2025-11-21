/**
 * Leaderboard Service
 * Manages trading performance rankings
 */

/**
 * Get current leaderboard
 */
export async function getLeaderboard(periodType, limit, env) {
  // Get date range based on period type
  const { start, end } = getDateRange(periodType);

  // Try to get cached leaderboard
  const cached = await env.DB.prepare(`
    SELECT * FROM leaderboards
    WHERE period_type = ?
    AND period_start = ?
    AND period_end = ?
  `).bind(periodType, start, end).first();

  if (cached) {
    return {
      periodType,
      periodStart: start,
      periodEnd: end,
      rankings: JSON.parse(cached.rankings),
      generatedAt: cached.generated_at
    };
  }

  // Generate fresh leaderboard
  return await generateLeaderboard(periodType, start, end, limit, env);
}

/**
 * Generate leaderboard from trade data
 */
async function generateLeaderboard(periodType, start, end, limit, env) {
  const query = `
    SELECT
      t.user_id,
      up.display_name,
      up.avatar_url,
      up.is_verified,
      up.country,
      up.trading_style,
      COUNT(*) as total_trades,
      SUM(t.profit) as total_profit,
      SUM(CASE WHEN t.profit > 0 THEN 1 ELSE 0 END) as wins,
      SUM(CASE WHEN t.profit > 0 THEN t.profit ELSE 0 END) as gross_profit,
      ABS(SUM(CASE WHEN t.profit < 0 THEN t.profit ELSE 0 END)) as gross_loss
    FROM trades t
    JOIN user_profiles up ON t.user_id = up.user_id
    WHERE up.is_public = 1
    AND up.show_trades = 1
    AND datetime(t.close_time) >= datetime(?)
    AND datetime(t.close_time) <= datetime(?)
    GROUP BY t.user_id
    HAVING total_trades >= 5
    ORDER BY total_profit DESC
    LIMIT ?
  `;

  const result = await env.DB.prepare(query)
    .bind(start, end, limit || 100)
    .all();

  const rankings = result.results.map((r, index) => ({
    rank: index + 1,
    userId: r.user_id,
    displayName: r.display_name,
    avatarUrl: r.avatar_url,
    isVerified: r.is_verified === 1,
    country: r.country,
    tradingStyle: r.trading_style,
    stats: {
      totalTrades: r.total_trades,
      totalProfit: parseFloat(r.total_profit?.toFixed(2) || 0),
      winRate: r.total_trades > 0
        ? parseFloat(((r.wins / r.total_trades) * 100).toFixed(2))
        : 0,
      profitFactor: r.gross_loss > 0
        ? parseFloat((r.gross_profit / r.gross_loss).toFixed(2))
        : 0
    }
  }));

  // Cache the leaderboard
  await env.DB.prepare(`
    INSERT OR REPLACE INTO leaderboards (
      period_type, period_start, period_end, rankings
    ) VALUES (?, ?, ?, ?)
  `).bind(periodType, start, end, JSON.stringify(rankings)).run();

  return {
    periodType,
    periodStart: start,
    periodEnd: end,
    rankings,
    generatedAt: new Date().toISOString()
  };
}

/**
 * Get user's rank
 */
export async function getUserRank(userId, periodType, env) {
  const leaderboard = await getLeaderboard(periodType, 1000, env);

  const userRanking = leaderboard.rankings.find(r => r.userId === userId);

  if (!userRanking) {
    return {
      rank: null,
      message: 'Not ranked. Need at least 5 public trades.',
      periodType
    };
  }

  return {
    rank: userRanking.rank,
    outOf: leaderboard.rankings.length,
    stats: userRanking.stats,
    periodType
  };
}

/**
 * Get leaderboard by metric
 */
export async function getLeaderboardByMetric(metric, periodType, limit, env) {
  const { start, end } = getDateRange(periodType);

  let orderBy;
  switch (metric) {
    case 'profit':
      orderBy = 'total_profit DESC';
      break;
    case 'win_rate':
      orderBy = 'win_rate DESC';
      break;
    case 'profit_factor':
      orderBy = 'profit_factor DESC';
      break;
    case 'trades':
      orderBy = 'total_trades DESC';
      break;
    case 'roi':
      orderBy = 'roi DESC';
      break;
    default:
      orderBy = 'total_profit DESC';
  }

  const query = `
    WITH trader_stats AS (
      SELECT
        t.user_id,
        up.display_name,
        up.avatar_url,
        up.is_verified,
        COUNT(*) as total_trades,
        SUM(t.profit) as total_profit,
        (SUM(CASE WHEN t.profit > 0 THEN 1 ELSE 0 END) * 100.0 / COUNT(*)) as win_rate,
        CASE
          WHEN ABS(SUM(CASE WHEN t.profit < 0 THEN t.profit ELSE 0 END)) > 0
          THEN SUM(CASE WHEN t.profit > 0 THEN t.profit ELSE 0 END) /
               ABS(SUM(CASE WHEN t.profit < 0 THEN t.profit ELSE 0 END))
          ELSE 0
        END as profit_factor,
        (SUM(t.profit) / 10000.0 * 100) as roi
      FROM trades t
      JOIN user_profiles up ON t.user_id = up.user_id
      WHERE up.is_public = 1
      AND up.show_trades = 1
      AND datetime(t.close_time) >= datetime('${start}')
      AND datetime(t.close_time) <= datetime('${end}')
      GROUP BY t.user_id
      HAVING total_trades >= 5
    )
    SELECT * FROM trader_stats
    ORDER BY ${orderBy}
    LIMIT ${limit || 50}
  `;

  const result = await env.DB.prepare(query).all();

  return {
    metric,
    periodType,
    rankings: result.results.map((r, index) => ({
      rank: index + 1,
      userId: r.user_id,
      displayName: r.display_name,
      avatarUrl: r.avatar_url,
      isVerified: r.is_verified === 1,
      value: getMetricValue(r, metric),
      stats: {
        totalTrades: r.total_trades,
        totalProfit: parseFloat(r.total_profit?.toFixed(2) || 0),
        winRate: parseFloat(r.win_rate?.toFixed(2) || 0),
        profitFactor: parseFloat(r.profit_factor?.toFixed(2) || 0),
        roi: parseFloat(r.roi?.toFixed(2) || 0)
      }
    }))
  };
}

/**
 * Get metric value for display
 */
function getMetricValue(row, metric) {
  switch (metric) {
    case 'profit':
      return `$${row.total_profit?.toFixed(2) || 0}`;
    case 'win_rate':
      return `${row.win_rate?.toFixed(1) || 0}%`;
    case 'profit_factor':
      return row.profit_factor?.toFixed(2) || '0';
    case 'trades':
      return row.total_trades.toString();
    case 'roi':
      return `${row.roi?.toFixed(1) || 0}%`;
    default:
      return row.total_profit?.toFixed(2) || 0;
  }
}

/**
 * Get date range for period type
 */
function getDateRange(periodType) {
  const now = new Date();
  let start, end;

  end = now.toISOString().split('T')[0];

  switch (periodType) {
    case 'daily':
      start = end;
      break;

    case 'weekly':
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      start = weekStart.toISOString().split('T')[0];
      break;

    case 'monthly':
      start = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString().split('T')[0];
      break;

    case 'all_time':
      start = '2020-01-01';
      break;

    default:
      start = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString().split('T')[0];
  }

  return { start, end };
}

/**
 * Get top gainers (biggest profit increase)
 */
export async function getTopGainers(periodType, limit, env) {
  return await getLeaderboardByMetric('profit', periodType, limit, env);
}

/**
 * Get most consistent traders (highest win rate with min trades)
 */
export async function getMostConsistent(periodType, limit, env) {
  return await getLeaderboardByMetric('win_rate', periodType, limit, env);
}

/**
 * Get most active traders
 */
export async function getMostActive(periodType, limit, env) {
  return await getLeaderboardByMetric('trades', periodType, limit, env);
}

/**
 * Get notifications for user
 */
export async function getNotifications(userId, limit, env) {
  const result = await env.DB.prepare(`
    SELECT * FROM social_notifications
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `).bind(userId, limit || 20).all();

  return result.results;
}

/**
 * Mark notification as read
 */
export async function markNotificationRead(userId, notificationId, env) {
  await env.DB.prepare(`
    UPDATE social_notifications
    SET is_read = 1, read_at = datetime('now')
    WHERE id = ? AND user_id = ?
  `).bind(notificationId, userId).run();

  return { success: true };
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsRead(userId, env) {
  await env.DB.prepare(`
    UPDATE social_notifications
    SET is_read = 1, read_at = datetime('now')
    WHERE user_id = ? AND is_read = 0
  `).bind(userId).run();

  return { success: true };
}

/**
 * Get unread notification count
 */
export async function getUnreadNotificationCount(userId, env) {
  const result = await env.DB.prepare(`
    SELECT COUNT(*) as count FROM social_notifications
    WHERE user_id = ? AND is_read = 0
  `).bind(userId).first();

  return result.count || 0;
}
