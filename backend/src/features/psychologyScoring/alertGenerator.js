/**
 * Alert Generator
 * Generates real-time psychology alerts based on detected patterns
 */

/**
 * Generate alerts from detected patterns
 */
export async function generateAlertsFromPatterns(userId, patterns, env) {
  const alerts = [];

  for (const pattern of patterns) {
    // Check if similar alert already exists and is still active
    const existingAlert = await env.DB.prepare(`
      SELECT * FROM psychology_alerts
      WHERE user_id = ?
      AND alert_type = ?
      AND status IN ('pending', 'viewed')
      AND datetime(expires_at) > datetime('now')
      ORDER BY created_at DESC
      LIMIT 1
    `).bind(userId, pattern.type).first();

    // Don't create duplicate alerts within 24 hours
    if (existingAlert) {
      const hoursSince = (Date.now() - new Date(existingAlert.created_at)) / (1000 * 60 * 60);
      if (hoursSince < 24) continue;
    }

    // Generate alert based on pattern type
    const alert = await createAlertFromPattern(userId, pattern, env);
    if (alert) alerts.push(alert);
  }

  return alerts;
}

/**
 * Create alert from pattern
 */
async function createAlertFromPattern(userId, pattern, env) {
  const alertData = buildAlertData(pattern);

  // Set expiration based on severity
  const expiresAt = new Date();
  switch (pattern.severity) {
    case 'critical':
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours
      break;
    case 'high':
      expiresAt.setHours(expiresAt.getHours() + 12); // 12 hours
      break;
    default:
      expiresAt.setHours(expiresAt.getHours() + 6); // 6 hours
  }

  const result = await env.DB.prepare(`
    INSERT INTO psychology_alerts (
      user_id,
      alert_type,
      severity,
      title,
      message,
      trigger_data,
      recommended_action,
      expires_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    userId,
    pattern.type,
    pattern.severity,
    alertData.title,
    alertData.message,
    JSON.stringify(pattern.data || pattern.instances || {}),
    pattern.recommendation,
    expiresAt.toISOString()
  ).run();

  // Log event
  await env.DB.prepare(`
    INSERT INTO psychology_events (user_id, event_type, event_data)
    VALUES (?, ?, ?)
  `).bind(
    userId,
    'pattern_detected',
    JSON.stringify({ pattern_type: pattern.type, severity: pattern.severity })
  ).run();

  return {
    id: result.meta.last_row_id,
    type: pattern.type,
    severity: pattern.severity,
    title: alertData.title,
    message: alertData.message,
    recommendation: pattern.recommendation
  };
}

/**
 * Build alert title and message based on pattern
 */
function buildAlertData(pattern) {
  switch (pattern.type) {
    case 'revenge_trading':
      return {
        title: '🚨 Revenge Trading Detected',
        message: pattern.description + '. Trading immediately after losses is emotionally driven and often leads to bigger losses.'
      };

    case 'overtrading':
      return {
        title: '⚠️ Overtrading Alert',
        message: pattern.description + '. You\'re taking too many trades. Focus on quality setups, not quantity.'
      };

    case 'tilt_detected':
      return {
        title: '🛑 TILT ALERT - Stop Trading',
        message: pattern.description + '. You\'re emotionally compromised. Stop trading NOW.'
      };

    case 'oversized_positions':
      return {
        title: '⚠️ Risk Management Violation',
        message: pattern.description + '. You\'re risking too much per trade.'
      };

    case 'outside_trading_hours':
      return {
        title: '🕐 Trading Outside Your Schedule',
        message: pattern.description + '. Stick to your planned trading hours.'
      };

    case 'martingale_behavior':
      return {
        title: '🚨 CRITICAL: Martingale Detected',
        message: pattern.description + '. This is extremely dangerous and will blow your account.'
      };

    default:
      return {
        title: '⚠️ Trading Pattern Alert',
        message: pattern.description
      };
  }
}

/**
 * Get active alerts for user
 */
export async function getActiveAlerts(userId, env) {
  const alerts = await env.DB.prepare(`
    SELECT * FROM psychology_alerts
    WHERE user_id = ?
    AND status IN ('pending', 'viewed')
    AND datetime(expires_at) > datetime('now')
    ORDER BY created_at DESC
  `).bind(userId).all();

  return alerts.results;
}

/**
 * Mark alert as viewed
 */
export async function markAlertAsViewed(alertId, userId, env) {
  await env.DB.prepare(`
    UPDATE psychology_alerts
    SET status = 'viewed'
    WHERE id = ? AND user_id = ?
  `).bind(alertId, userId).run();

  return { success: true };
}

/**
 * Respond to alert (acknowledged or dismissed)
 */
export async function respondToAlert(alertId, userId, response, userNote, env) {
  const validResponses = ['acknowledged', 'dismissed', 'heeded'];

  if (!validResponses.includes(response)) {
    throw new Error('Invalid response type');
  }

  await env.DB.prepare(`
    UPDATE psychology_alerts
    SET status = ?,
        user_response = ?,
        response_at = datetime('now')
    WHERE id = ? AND user_id = ?
  `).bind(response, userNote || '', alertId, userId).run();

  // Update profile stats
  if (response === 'heeded') {
    await env.DB.prepare(`
      UPDATE psychology_profiles
      SET total_alerts_heeded = total_alerts_heeded + 1,
          current_discipline_streak = current_discipline_streak + 1
      WHERE user_id = ?
    `).bind(userId).run();

    // Log achievement
    await env.DB.prepare(`
      INSERT INTO psychology_events (user_id, event_type, event_data, impact_score)
      VALUES (?, ?, ?, ?)
    `).bind(
      userId,
      'milestone_achieved',
      JSON.stringify({ type: 'alert_heeded', alert_id: alertId }),
      10
    ).run();
  } else if (response === 'dismissed') {
    await env.DB.prepare(`
      UPDATE psychology_profiles
      SET total_alerts_ignored = total_alerts_ignored + 1,
          current_discipline_streak = 0
      WHERE user_id = ?
    `).bind(userId).run();

    // Log event
    await env.DB.prepare(`
      INSERT INTO psychology_events (user_id, event_type, event_data, impact_score)
      VALUES (?, ?, ?, ?)
    `).bind(
      userId,
      'streak_broken',
      JSON.stringify({ type: 'alert_dismissed', alert_id: alertId }),
      -5
    ).run();
  }

  return { success: true };
}

/**
 * Dismiss all alerts for user
 */
export async function dismissAllAlerts(userId, env) {
  await env.DB.prepare(`
    UPDATE psychology_alerts
    SET status = 'dismissed',
        response_at = datetime('now')
    WHERE user_id = ?
    AND status IN ('pending', 'viewed')
  `).bind(userId).run();

  return { success: true };
}

/**
 * Get alert statistics
 */
export async function getAlertStatistics(userId, env) {
  const stats = await env.DB.prepare(`
    SELECT
      COUNT(*) as total_alerts,
      SUM(CASE WHEN status = 'heeded' THEN 1 ELSE 0 END) as heeded_count,
      SUM(CASE WHEN status = 'dismissed' THEN 1 ELSE 0 END) as dismissed_count,
      SUM(CASE WHEN status IN ('pending', 'viewed') THEN 1 ELSE 0 END) as active_count
    FROM psychology_alerts
    WHERE user_id = ?
    AND datetime(created_at) >= datetime('now', '-30 days')
  `).bind(userId).first();

  const profile = await env.DB.prepare(`
    SELECT
      current_discipline_streak,
      longest_discipline_streak,
      total_alerts_heeded,
      total_alerts_ignored
    FROM psychology_profiles
    WHERE user_id = ?
  `).bind(userId).first();

  return {
    last30Days: {
      totalAlerts: stats.total_alerts || 0,
      heededCount: stats.heeded_count || 0,
      dismissedCount: stats.dismissed_count || 0,
      activeCount: stats.active_count || 0,
      heededRate: stats.total_alerts > 0
        ? ((stats.heeded_count / stats.total_alerts) * 100).toFixed(1)
        : '0.0'
    },
    allTime: {
      currentStreak: profile?.current_discipline_streak || 0,
      longestStreak: profile?.longest_discipline_streak || 0,
      totalHeeded: profile?.total_alerts_heeded || 0,
      totalIgnored: profile?.total_alerts_ignored || 0
    }
  };
}

/**
 * Create custom alert (manual trigger by user or system)
 */
export async function createCustomAlert(userId, alertType, severity, title, message, recommendation, env) {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 12);

  const result = await env.DB.prepare(`
    INSERT INTO psychology_alerts (
      user_id,
      alert_type,
      severity,
      title,
      message,
      recommended_action,
      expires_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(
    userId,
    alertType,
    severity,
    title,
    message,
    recommendation,
    expiresAt.toISOString()
  ).run();

  return {
    id: result.meta.last_row_id,
    type: alertType,
    severity,
    title,
    message,
    recommendation
  };
}
