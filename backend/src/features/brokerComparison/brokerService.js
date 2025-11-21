/**
 * Broker Service
 * Manages broker data, reviews, and user broker connections
 */

/**
 * Get all brokers with optional filters
 */
export async function getAllBrokers(filters, env) {
  let conditions = ['is_active = 1'];
  const params = [];

  if (filters) {
    if (filters.regulated !== undefined) {
      conditions.push('is_regulated = ?');
      params.push(filters.regulated ? 1 : 0);
    }

    if (filters.minRating) {
      conditions.push('overall_rating >= ?');
      params.push(filters.minRating);
    }

    if (filters.maxSpread) {
      conditions.push('eurusd_spread_avg <= ?');
      params.push(filters.maxSpread);
    }

    if (filters.platform) {
      conditions.push("platforms LIKE ?");
      params.push(`%"${filters.platform}"%`);
    }

    if (filters.country) {
      conditions.push('country = ?');
      params.push(filters.country);
    }
  }

  const query = `
    SELECT
      id, name, logo_url, country, founded_year,
      is_regulated, regulators,
      min_deposit, max_leverage,
      eurusd_spread_avg, gbpusd_spread_avg,
      commission_type, commission_per_lot,
      execution_type, avg_execution_speed_ms,
      platforms, has_mobile_app, has_demo_account,
      swap_free_available,
      overall_rating, user_rating_avg, user_reviews_count,
      referral_link, affiliate_program
    FROM brokers
    WHERE ${conditions.join(' AND ')}
    ORDER BY overall_rating DESC
  `;

  const result = await env.DB.prepare(query).bind(...params).all();

  return result.results.map(broker => ({
    ...broker,
    regulators: broker.regulators ? JSON.parse(broker.regulators) : [],
    platforms: broker.platforms ? JSON.parse(broker.platforms) : []
  }));
}

/**
 * Get broker by ID
 */
export async function getBrokerById(brokerId, env) {
  const broker = await env.DB.prepare(`
    SELECT * FROM brokers WHERE id = ?
  `).bind(brokerId).first();

  if (!broker) return null;

  // Parse JSON fields
  return {
    ...broker,
    regulators: broker.regulators ? JSON.parse(broker.regulators) : [],
    platforms: broker.platforms ? JSON.parse(broker.platforms) : [],
    depositMethods: broker.deposit_methods ? JSON.parse(broker.deposit_methods) : [],
    withdrawalMethods: broker.withdrawal_methods ? JSON.parse(broker.withdrawal_methods) : [],
    supportChannels: broker.support_channels ? JSON.parse(broker.support_channels) : [],
    supportLanguages: broker.support_languages ? JSON.parse(broker.support_languages) : [],
    accountTypes: broker.account_types ? JSON.parse(broker.account_types) : []
  };
}

/**
 * Link user's broker account
 */
export async function linkUserBroker(userId, brokerId, accountData, env) {
  // Check if already linked
  const existing = await env.DB.prepare(`
    SELECT * FROM user_brokers
    WHERE user_id = ? AND broker_id = ?
  `).bind(userId, brokerId).first();

  if (existing) {
    // Update existing
    await env.DB.prepare(`
      UPDATE user_brokers
      SET account_number = ?,
          account_type = ?,
          server_name = ?,
          leverage = ?,
          is_active = 1,
          updated_at = datetime('now')
      WHERE user_id = ? AND broker_id = ?
    `).bind(
      accountData.accountNumber || existing.account_number,
      accountData.accountType || existing.account_type,
      accountData.serverName || existing.server_name,
      accountData.leverage || existing.leverage,
      userId,
      brokerId
    ).run();

    return { updated: true };
  }

  // If this is the first broker, make it primary
  const existingBrokers = await env.DB.prepare(`
    SELECT COUNT(*) as count FROM user_brokers WHERE user_id = ?
  `).bind(userId).first();

  const isPrimary = existingBrokers.count === 0 ? 1 : 0;

  await env.DB.prepare(`
    INSERT INTO user_brokers (
      user_id, broker_id, account_number, account_type,
      server_name, leverage, is_primary
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(
    userId,
    brokerId,
    accountData.accountNumber || null,
    accountData.accountType || null,
    accountData.serverName || null,
    accountData.leverage || null,
    isPrimary
  ).run();

  return { created: true, isPrimary: !!isPrimary };
}

/**
 * Get user's linked brokers
 */
export async function getUserBrokers(userId, env) {
  const result = await env.DB.prepare(`
    SELECT
      ub.*,
      b.name as broker_name,
      b.logo_url,
      b.eurusd_spread_avg,
      b.commission_per_lot
    FROM user_brokers ub
    JOIN brokers b ON ub.broker_id = b.id
    WHERE ub.user_id = ?
    ORDER BY ub.is_primary DESC, ub.created_at DESC
  `).bind(userId).all();

  return result.results;
}

/**
 * Set primary broker
 */
export async function setPrimaryBroker(userId, brokerId, env) {
  // Unset all primaries
  await env.DB.prepare(`
    UPDATE user_brokers
    SET is_primary = 0
    WHERE user_id = ?
  `).bind(userId).run();

  // Set new primary
  await env.DB.prepare(`
    UPDATE user_brokers
    SET is_primary = 1
    WHERE user_id = ? AND broker_id = ?
  `).bind(userId, brokerId).run();

  return { success: true };
}

/**
 * Submit broker review
 */
export async function submitBrokerReview(userId, brokerId, reviewData, env) {
  // Check if user already reviewed this broker
  const existing = await env.DB.prepare(`
    SELECT * FROM broker_reviews
    WHERE user_id = ? AND broker_id = ?
  `).bind(userId, brokerId).first();

  if (existing) {
    return {
      error: 'You have already reviewed this broker',
      existingReviewId: existing.id
    };
  }

  // Check if user has this broker linked (for verification)
  const userBroker = await env.DB.prepare(`
    SELECT * FROM user_brokers
    WHERE user_id = ? AND broker_id = ?
  `).bind(userId, brokerId).first();

  const isVerified = userBroker ? 1 : 0;

  const result = await env.DB.prepare(`
    INSERT INTO broker_reviews (
      user_id, broker_id, rating, title, review_text,
      spread_rating, execution_rating, support_rating,
      platform_rating, withdrawal_rating,
      is_verified_customer, user_trading_volume
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    userId,
    brokerId,
    reviewData.rating,
    reviewData.title || null,
    reviewData.reviewText,
    reviewData.spreadRating || null,
    reviewData.executionRating || null,
    reviewData.supportRating || null,
    reviewData.platformRating || null,
    reviewData.withdrawalRating || null,
    isVerified,
    reviewData.tradingVolume || null
  ).run();

  // Update broker review stats
  await updateBrokerReviewStats(brokerId, env);

  return {
    reviewId: result.meta.last_row_id,
    isVerified: !!isVerified
  };
}

/**
 * Get reviews for a broker
 */
export async function getBrokerReviews(brokerId, options, env) {
  const limit = options?.limit || 20;
  const offset = options?.offset || 0;

  const reviews = await env.DB.prepare(`
    SELECT
      br.*,
      u.email as reviewer_email
    FROM broker_reviews br
    LEFT JOIN users u ON br.user_id = u.id
    WHERE br.broker_id = ? AND br.is_approved = 1
    ORDER BY br.is_verified_customer DESC, br.helpful_votes DESC, br.created_at DESC
    LIMIT ? OFFSET ?
  `).bind(brokerId, limit, offset).all();

  // Mask emails
  const maskedReviews = reviews.results.map(review => ({
    ...review,
    reviewerEmail: review.reviewer_email
      ? maskEmail(review.reviewer_email)
      : 'Anonymous'
  }));

  // Get aggregate stats
  const stats = await env.DB.prepare(`
    SELECT
      COUNT(*) as total_reviews,
      AVG(rating) as avg_rating,
      AVG(spread_rating) as avg_spread_rating,
      AVG(execution_rating) as avg_execution_rating,
      AVG(support_rating) as avg_support_rating
    FROM broker_reviews
    WHERE broker_id = ? AND is_approved = 1
  `).bind(brokerId).first();

  return {
    reviews: maskedReviews,
    stats: {
      totalReviews: stats.total_reviews,
      avgRating: stats.avg_rating?.toFixed(1) || '0.0',
      avgSpreadRating: stats.avg_spread_rating?.toFixed(1) || '0.0',
      avgExecutionRating: stats.avg_execution_rating?.toFixed(1) || '0.0',
      avgSupportRating: stats.avg_support_rating?.toFixed(1) || '0.0'
    }
  };
}

/**
 * Vote on review helpfulness
 */
export async function voteOnReview(userId, reviewId, isHelpful, env) {
  const field = isHelpful ? 'helpful_votes' : 'unhelpful_votes';

  await env.DB.prepare(`
    UPDATE broker_reviews
    SET ${field} = ${field} + 1
    WHERE id = ?
  `).bind(reviewId).run();

  return { success: true };
}

/**
 * Update broker review stats
 */
async function updateBrokerReviewStats(brokerId, env) {
  const stats = await env.DB.prepare(`
    SELECT
      COUNT(*) as count,
      AVG(rating) as avg_rating
    FROM broker_reviews
    WHERE broker_id = ? AND is_approved = 1
  `).bind(brokerId).first();

  await env.DB.prepare(`
    UPDATE brokers
    SET user_reviews_count = ?,
        user_rating_avg = ?,
        last_data_update = datetime('now')
    WHERE id = ?
  `).bind(
    stats.count,
    stats.avg_rating,
    brokerId
  ).run();
}

/**
 * Mask email for privacy
 */
function maskEmail(email) {
  const [local, domain] = email.split('@');
  if (local.length <= 2) return '***@' + domain;
  return local.substring(0, 2) + '***@' + domain;
}

/**
 * Track affiliate click
 */
export async function trackAffiliateClick(userId, brokerId, env) {
  // Log to comparisons table
  await env.DB.prepare(`
    UPDATE broker_comparisons
    SET user_clicked_affiliate_link = 1
    WHERE user_id = ?
    AND broker_ids LIKE ?
    ORDER BY created_at DESC
    LIMIT 1
  `).bind(userId, `%${brokerId}%`).run();

  return { tracked: true };
}

/**
 * Search brokers by name
 */
export async function searchBrokers(query, limit, env) {
  const result = await env.DB.prepare(`
    SELECT id, name, logo_url, country, overall_rating
    FROM brokers
    WHERE is_active = 1
    AND (name LIKE ? OR country LIKE ?)
    ORDER BY overall_rating DESC
    LIMIT ?
  `).bind(`%${query}%`, `%${query}%`, limit || 10).all();

  return result.results;
}

/**
 * Get popular brokers
 */
export async function getPopularBrokers(limit, env) {
  const result = await env.DB.prepare(`
    SELECT
      id, name, logo_url, country,
      overall_rating, user_reviews_count,
      eurusd_spread_avg, is_regulated
    FROM brokers
    WHERE is_active = 1
    ORDER BY user_reviews_count DESC, overall_rating DESC
    LIMIT ?
  `).bind(limit || 10).all();

  return result.results;
}
