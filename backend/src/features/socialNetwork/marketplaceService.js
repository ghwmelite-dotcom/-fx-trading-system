/**
 * Marketplace Service
 * Manages the strategy/EA marketplace
 */

/**
 * Create a new strategy listing
 */
export async function createStrategyListing(sellerId, strategyData, env) {
  // Validate required fields
  if (!strategyData.strategyName || !strategyData.description ||
      !strategyData.strategyType || !strategyData.price) {
    return { error: 'Missing required fields' };
  }

  const result = await env.DB.prepare(`
    INSERT INTO strategy_marketplace (
      seller_id, strategy_name, description, strategy_type,
      file_url, documentation_url, screenshots, video_url,
      price, currency, license_type,
      backtest_results, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_review')
  `).bind(
    sellerId,
    strategyData.strategyName,
    strategyData.description,
    strategyData.strategyType,
    strategyData.fileUrl || null,
    strategyData.documentationUrl || null,
    JSON.stringify(strategyData.screenshots || []),
    strategyData.videoUrl || null,
    strategyData.price,
    strategyData.currency || 'USD',
    strategyData.licenseType || 'lifetime',
    strategyData.backtestResults ? JSON.stringify(strategyData.backtestResults) : null
  ).run();

  return {
    success: true,
    strategyId: result.meta.last_row_id,
    message: 'Strategy submitted for review'
  };
}

/**
 * Get marketplace listings
 */
export async function getMarketplaceListings(filters, limit, offset, env) {
  let conditions = ["status = 'active'"];
  const params = [];

  if (filters) {
    if (filters.strategyType) {
      conditions.push('strategy_type = ?');
      params.push(filters.strategyType);
    }

    if (filters.minPrice !== undefined) {
      conditions.push('price >= ?');
      params.push(filters.minPrice);
    }

    if (filters.maxPrice !== undefined) {
      conditions.push('price <= ?');
      params.push(filters.maxPrice);
    }

    if (filters.minRating) {
      conditions.push('average_rating >= ?');
      params.push(filters.minRating);
    }
  }

  params.push(limit || 20, offset || 0);

  const query = `
    SELECT
      sm.*,
      up.display_name as seller_name,
      up.avatar_url as seller_avatar,
      up.is_verified as seller_verified
    FROM strategy_marketplace sm
    JOIN user_profiles up ON sm.seller_id = up.user_id
    WHERE ${conditions.join(' AND ')}
    ORDER BY sm.total_sales DESC, sm.average_rating DESC
    LIMIT ? OFFSET ?
  `;

  const result = await env.DB.prepare(query).bind(...params).all();

  return result.results.map(s => ({
    ...s,
    screenshots: s.screenshots ? JSON.parse(s.screenshots) : [],
    backtestResults: s.backtest_results ? JSON.parse(s.backtest_results) : null
  }));
}

/**
 * Get strategy details
 */
export async function getStrategyDetails(strategyId, viewerId, env) {
  const strategy = await env.DB.prepare(`
    SELECT
      sm.*,
      up.display_name as seller_name,
      up.avatar_url as seller_avatar,
      up.is_verified as seller_verified,
      up.public_win_rate as seller_win_rate
    FROM strategy_marketplace sm
    JOIN user_profiles up ON sm.seller_id = up.user_id
    WHERE sm.id = ?
  `).bind(strategyId).first();

  if (!strategy) {
    return null;
  }

  // Check if viewer has purchased
  let hasPurchased = false;
  if (viewerId) {
    const purchase = await env.DB.prepare(`
      SELECT id FROM marketplace_purchases
      WHERE buyer_id = ? AND strategy_id = ? AND status = 'active'
    `).bind(viewerId, strategyId).first();
    hasPurchased = !!purchase;
  }

  // Get reviews
  const reviews = await env.DB.prepare(`
    SELECT
      mp.rating,
      mp.review_text,
      mp.reviewed_at,
      up.display_name,
      up.avatar_url
    FROM marketplace_purchases mp
    JOIN user_profiles up ON mp.buyer_id = up.user_id
    WHERE mp.strategy_id = ?
    AND mp.rating IS NOT NULL
    ORDER BY mp.reviewed_at DESC
    LIMIT 10
  `).bind(strategyId).all();

  return {
    ...strategy,
    screenshots: strategy.screenshots ? JSON.parse(strategy.screenshots) : [],
    backtestResults: strategy.backtest_results ? JSON.parse(strategy.backtest_results) : null,
    hasPurchased,
    reviews: reviews.results
  };
}

/**
 * Purchase a strategy
 */
export async function purchaseStrategy(buyerId, strategyId, paymentData, env) {
  // Get strategy
  const strategy = await env.DB.prepare(`
    SELECT * FROM strategy_marketplace WHERE id = ? AND status = 'active'
  `).bind(strategyId).first();

  if (!strategy) {
    return { error: 'Strategy not found or not available' };
  }

  if (strategy.seller_id === buyerId) {
    return { error: 'Cannot purchase your own strategy' };
  }

  // Check if already purchased
  const existing = await env.DB.prepare(`
    SELECT * FROM marketplace_purchases
    WHERE buyer_id = ? AND strategy_id = ? AND status = 'active'
  `).bind(buyerId, strategyId).first();

  if (existing) {
    return { error: 'Already purchased' };
  }

  // Generate license key
  const licenseKey = generateLicenseKey();

  // Calculate expiry
  let expiresAt = null;
  if (strategy.license_type === 'monthly') {
    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + 1);
    expiresAt = expiry.toISOString();
  } else if (strategy.license_type === 'yearly') {
    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 1);
    expiresAt = expiry.toISOString();
  }

  // Create purchase record
  const result = await env.DB.prepare(`
    INSERT INTO marketplace_purchases (
      buyer_id, strategy_id, amount_paid, currency,
      payment_method, transaction_id, license_key, expires_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    buyerId,
    strategyId,
    strategy.price,
    strategy.currency,
    paymentData.paymentMethod || 'card',
    paymentData.transactionId || null,
    licenseKey,
    expiresAt
  ).run();

  // Update strategy stats
  const platformCommission = strategy.price * 0.20; // 20% commission
  const sellerRevenue = strategy.price - platformCommission;

  await env.DB.prepare(`
    UPDATE strategy_marketplace
    SET total_sales = total_sales + 1,
        revenue_generated = revenue_generated + ?
    WHERE id = ?
  `).bind(sellerRevenue, strategyId).run();

  // Notify seller
  await env.DB.prepare(`
    INSERT INTO social_notifications (
      user_id, type, title, message
    ) VALUES (?, 'strategy_sold', 'Strategy Sold!', 'Someone purchased your strategy')
  `).bind(strategy.seller_id).run();

  return {
    success: true,
    purchaseId: result.meta.last_row_id,
    licenseKey,
    fileUrl: strategy.file_url,
    expiresAt
  };
}

/**
 * Get user's purchased strategies
 */
export async function getPurchasedStrategies(userId, env) {
  const result = await env.DB.prepare(`
    SELECT
      mp.*,
      sm.strategy_name,
      sm.strategy_type,
      sm.file_url,
      sm.documentation_url,
      up.display_name as seller_name
    FROM marketplace_purchases mp
    JOIN strategy_marketplace sm ON mp.strategy_id = sm.id
    JOIN user_profiles up ON sm.seller_id = up.user_id
    WHERE mp.buyer_id = ?
    AND mp.status = 'active'
    ORDER BY mp.created_at DESC
  `).bind(userId).all();

  return result.results;
}

/**
 * Get seller's strategies
 */
export async function getSellerStrategies(sellerId, env) {
  const result = await env.DB.prepare(`
    SELECT * FROM strategy_marketplace
    WHERE seller_id = ?
    ORDER BY created_at DESC
  `).bind(sellerId).all();

  return result.results.map(s => ({
    ...s,
    screenshots: s.screenshots ? JSON.parse(s.screenshots) : [],
    backtestResults: s.backtest_results ? JSON.parse(s.backtest_results) : null
  }));
}

/**
 * Submit review for purchased strategy
 */
export async function submitStrategyReview(userId, strategyId, rating, reviewText, env) {
  const purchase = await env.DB.prepare(`
    SELECT * FROM marketplace_purchases
    WHERE buyer_id = ? AND strategy_id = ? AND status = 'active'
  `).bind(userId, strategyId).first();

  if (!purchase) {
    return { error: 'Must purchase strategy to review' };
  }

  if (purchase.rating) {
    return { error: 'Already reviewed' };
  }

  await env.DB.prepare(`
    UPDATE marketplace_purchases
    SET rating = ?, review_text = ?, reviewed_at = datetime('now')
    WHERE id = ?
  `).bind(rating, reviewText, purchase.id).run();

  // Update average rating
  const stats = await env.DB.prepare(`
    SELECT AVG(rating) as avg_rating, COUNT(*) as count
    FROM marketplace_purchases
    WHERE strategy_id = ? AND rating IS NOT NULL
  `).bind(strategyId).first();

  await env.DB.prepare(`
    UPDATE strategy_marketplace
    SET average_rating = ?, reviews_count = ?
    WHERE id = ?
  `).bind(stats.avg_rating, stats.count, strategyId).run();

  return { success: true };
}

/**
 * Update strategy listing
 */
export async function updateStrategyListing(sellerId, strategyId, updates, env) {
  // Verify ownership
  const strategy = await env.DB.prepare(`
    SELECT * FROM strategy_marketplace WHERE id = ? AND seller_id = ?
  `).bind(strategyId, sellerId).first();

  if (!strategy) {
    return { error: 'Strategy not found or not owned by you' };
  }

  const allowedFields = [
    'strategy_name', 'description', 'file_url', 'documentation_url',
    'screenshots', 'video_url', 'price', 'backtest_results'
  ];

  const updateParts = [];
  const values = [];

  for (const [key, value] of Object.entries(updates)) {
    const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();

    if (allowedFields.includes(dbKey)) {
      updateParts.push(`${dbKey} = ?`);
      values.push(typeof value === 'object' ? JSON.stringify(value) : value);
    }
  }

  if (updateParts.length === 0) {
    return { error: 'No valid fields to update' };
  }

  values.push(strategyId);

  await env.DB.prepare(`
    UPDATE strategy_marketplace
    SET ${updateParts.join(', ')}, updated_at = datetime('now')
    WHERE id = ?
  `).bind(...values).run();

  return { success: true };
}

/**
 * Generate license key
 */
function generateLicenseKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let key = '';

  for (let i = 0; i < 4; i++) {
    if (i > 0) key += '-';
    for (let j = 0; j < 4; j++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  }

  return key;
}

/**
 * Get top sellers
 */
export async function getTopSellers(limit, env) {
  const result = await env.DB.prepare(`
    SELECT
      up.user_id,
      up.display_name,
      up.avatar_url,
      up.is_verified,
      COUNT(sm.id) as strategies_count,
      SUM(sm.total_sales) as total_sales,
      AVG(sm.average_rating) as avg_rating
    FROM user_profiles up
    JOIN strategy_marketplace sm ON up.user_id = sm.seller_id
    WHERE sm.status = 'active'
    GROUP BY up.user_id
    ORDER BY total_sales DESC
    LIMIT ?
  `).bind(limit || 10).all();

  return result.results;
}
