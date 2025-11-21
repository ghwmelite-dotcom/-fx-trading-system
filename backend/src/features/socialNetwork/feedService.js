/**
 * Feed Service
 * Manages the social trade feed, likes, and comments
 */

/**
 * Share a trade to the feed
 */
export async function shareTrade(userId, tradeId, shareData, env) {
  // Check if trade belongs to user
  const trade = await env.DB.prepare(`
    SELECT * FROM trades WHERE id = ? AND user_id = ?
  `).bind(tradeId, userId).first();

  if (!trade) {
    return { error: 'Trade not found or does not belong to you' };
  }

  // Check if already shared
  const existing = await env.DB.prepare(`
    SELECT * FROM shared_trades WHERE user_id = ? AND trade_id = ?
  `).bind(userId, tradeId).first();

  if (existing) {
    return { error: 'Trade already shared' };
  }

  // Create shared trade
  const result = await env.DB.prepare(`
    INSERT INTO shared_trades (
      user_id, trade_id, share_type, caption, hashtags,
      include_entry, include_exit, include_profit, include_analysis
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    userId,
    tradeId,
    shareData.shareType || 'public',
    shareData.caption || '',
    JSON.stringify(shareData.hashtags || []),
    shareData.includeEntry ?? 1,
    shareData.includeExit ?? 1,
    shareData.includeProfit ?? 0,
    shareData.includeAnalysis ?? 1
  ).run();

  return {
    success: true,
    sharedTradeId: result.meta.last_row_id
  };
}

/**
 * Get public feed
 */
export async function getPublicFeed(viewerId, limit, offset, env) {
  const result = await env.DB.prepare(`
    SELECT
      st.id as shared_trade_id,
      st.user_id,
      st.caption,
      st.hashtags,
      st.likes_count,
      st.comments_count,
      st.copies_count,
      st.created_at as shared_at,
      st.include_entry,
      st.include_exit,
      st.include_profit,
      t.symbol,
      t.type,
      t.lots,
      t.open_price,
      t.close_price,
      t.open_time,
      t.close_time,
      t.profit,
      t.pips,
      t.notes,
      up.display_name,
      up.avatar_url,
      up.is_verified,
      up.public_win_rate
    FROM shared_trades st
    JOIN trades t ON st.trade_id = t.id
    JOIN user_profiles up ON st.user_id = up.user_id
    WHERE st.share_type = 'public'
    AND st.is_archived = 0
    AND up.is_public = 1
    ORDER BY st.created_at DESC
    LIMIT ? OFFSET ?
  `).bind(limit || 20, offset || 0).all();

  // Check if viewer has liked each trade
  const sharedTrades = await Promise.all(result.results.map(async (trade) => {
    let hasLiked = false;

    if (viewerId) {
      const like = await env.DB.prepare(`
        SELECT id FROM trade_likes
        WHERE shared_trade_id = ? AND user_id = ?
      `).bind(trade.shared_trade_id, viewerId).first();

      hasLiked = !!like;
    }

    // Apply privacy settings
    const tradeData = {
      ...trade,
      hashtags: trade.hashtags ? JSON.parse(trade.hashtags) : [],
      hasLiked,
      openPrice: trade.include_entry ? trade.open_price : null,
      closePrice: trade.include_exit ? trade.close_price : null,
      profit: trade.include_profit ? trade.profit : null,
      pips: trade.pips // Always show pips as it's relative
    };

    return tradeData;
  }));

  return sharedTrades;
}

/**
 * Get following feed (trades from people user follows)
 */
export async function getFollowingFeed(userId, limit, offset, env) {
  const result = await env.DB.prepare(`
    SELECT
      st.id as shared_trade_id,
      st.user_id,
      st.caption,
      st.hashtags,
      st.likes_count,
      st.comments_count,
      st.created_at as shared_at,
      t.symbol,
      t.type,
      t.lots,
      t.profit,
      t.pips,
      up.display_name,
      up.avatar_url,
      up.is_verified
    FROM shared_trades st
    JOIN trades t ON st.trade_id = t.id
    JOIN user_profiles up ON st.user_id = up.user_id
    JOIN social_connections sc ON st.user_id = sc.following_id
    WHERE sc.follower_id = ?
    AND sc.connection_type IN ('follow', 'copy')
    AND st.share_type IN ('public', 'followers_only')
    AND st.is_archived = 0
    ORDER BY st.created_at DESC
    LIMIT ? OFFSET ?
  `).bind(userId, limit || 20, offset || 0).all();

  return result.results.map(t => ({
    ...t,
    hashtags: t.hashtags ? JSON.parse(t.hashtags) : []
  }));
}

/**
 * Like a shared trade
 */
export async function likeTrade(userId, sharedTradeId, env) {
  // Check if already liked
  const existing = await env.DB.prepare(`
    SELECT id FROM trade_likes
    WHERE shared_trade_id = ? AND user_id = ?
  `).bind(sharedTradeId, userId).first();

  if (existing) {
    return { error: 'Already liked' };
  }

  // Create like
  await env.DB.prepare(`
    INSERT INTO trade_likes (shared_trade_id, user_id)
    VALUES (?, ?)
  `).bind(sharedTradeId, userId).run();

  // Update count
  await env.DB.prepare(`
    UPDATE shared_trades
    SET likes_count = likes_count + 1
    WHERE id = ?
  `).bind(sharedTradeId).run();

  // Get trade owner for notification
  const trade = await env.DB.prepare(`
    SELECT user_id FROM shared_trades WHERE id = ?
  `).bind(sharedTradeId).first();

  if (trade && trade.user_id !== userId) {
    await env.DB.prepare(`
      INSERT INTO social_notifications (
        user_id, type, title, message, related_user_id, related_trade_id
      ) VALUES (?, 'trade_liked', 'Trade Liked', 'Someone liked your trade', ?, ?)
    `).bind(trade.user_id, userId, sharedTradeId).run();
  }

  return { success: true };
}

/**
 * Unlike a shared trade
 */
export async function unlikeTrade(userId, sharedTradeId, env) {
  await env.DB.prepare(`
    DELETE FROM trade_likes
    WHERE shared_trade_id = ? AND user_id = ?
  `).bind(sharedTradeId, userId).run();

  // Update count
  await env.DB.prepare(`
    UPDATE shared_trades
    SET likes_count = MAX(0, likes_count - 1)
    WHERE id = ?
  `).bind(sharedTradeId).run();

  return { success: true };
}

/**
 * Add comment to shared trade
 */
export async function addComment(userId, sharedTradeId, commentText, parentCommentId, env) {
  if (!commentText || commentText.trim().length === 0) {
    return { error: 'Comment cannot be empty' };
  }

  const result = await env.DB.prepare(`
    INSERT INTO trade_comments (
      shared_trade_id, user_id, comment_text, parent_comment_id
    ) VALUES (?, ?, ?, ?)
  `).bind(
    sharedTradeId,
    userId,
    commentText.trim(),
    parentCommentId || null
  ).run();

  // Update count
  await env.DB.prepare(`
    UPDATE shared_trades
    SET comments_count = comments_count + 1
    WHERE id = ?
  `).bind(sharedTradeId).run();

  // Notification to trade owner
  const trade = await env.DB.prepare(`
    SELECT user_id FROM shared_trades WHERE id = ?
  `).bind(sharedTradeId).first();

  if (trade && trade.user_id !== userId) {
    await env.DB.prepare(`
      INSERT INTO social_notifications (
        user_id, type, title, message, related_user_id, related_trade_id, related_comment_id
      ) VALUES (?, 'trade_commented', 'New Comment', 'Someone commented on your trade', ?, ?, ?)
    `).bind(trade.user_id, userId, sharedTradeId, result.meta.last_row_id).run();
  }

  return {
    success: true,
    commentId: result.meta.last_row_id
  };
}

/**
 * Get comments for a shared trade
 */
export async function getComments(sharedTradeId, limit, offset, env) {
  const result = await env.DB.prepare(`
    SELECT
      tc.id,
      tc.user_id,
      tc.comment_text,
      tc.parent_comment_id,
      tc.likes_count,
      tc.is_edited,
      tc.created_at,
      up.display_name,
      up.avatar_url,
      up.is_verified
    FROM trade_comments tc
    JOIN user_profiles up ON tc.user_id = up.user_id
    WHERE tc.shared_trade_id = ?
    AND tc.is_deleted = 0
    ORDER BY tc.created_at ASC
    LIMIT ? OFFSET ?
  `).bind(sharedTradeId, limit || 50, offset || 0).all();

  return result.results;
}

/**
 * Delete comment
 */
export async function deleteComment(userId, commentId, env) {
  await env.DB.prepare(`
    UPDATE trade_comments
    SET is_deleted = 1, deleted_at = datetime('now')
    WHERE id = ? AND user_id = ?
  `).bind(commentId, userId).run();

  return { success: true };
}

/**
 * Get shared trade details
 */
export async function getSharedTradeDetails(sharedTradeId, viewerId, env) {
  const trade = await env.DB.prepare(`
    SELECT
      st.*,
      t.symbol,
      t.type,
      t.lots,
      t.open_price,
      t.close_price,
      t.open_time,
      t.close_time,
      t.profit,
      t.pips,
      t.notes,
      up.display_name,
      up.avatar_url,
      up.is_verified,
      up.public_win_rate
    FROM shared_trades st
    JOIN trades t ON st.trade_id = t.id
    JOIN user_profiles up ON st.user_id = up.user_id
    WHERE st.id = ?
  `).bind(sharedTradeId).first();

  if (!trade) {
    return null;
  }

  // Check like status
  let hasLiked = false;
  if (viewerId) {
    const like = await env.DB.prepare(`
      SELECT id FROM trade_likes WHERE shared_trade_id = ? AND user_id = ?
    `).bind(sharedTradeId, viewerId).first();
    hasLiked = !!like;
  }

  // Get recent comments
  const comments = await getComments(sharedTradeId, 10, 0, env);

  return {
    ...trade,
    hashtags: trade.hashtags ? JSON.parse(trade.hashtags) : [],
    hasLiked,
    comments
  };
}

/**
 * Delete shared trade
 */
export async function deleteSharedTrade(userId, sharedTradeId, env) {
  await env.DB.prepare(`
    DELETE FROM shared_trades
    WHERE id = ? AND user_id = ?
  `).bind(sharedTradeId, userId).run();

  return { success: true };
}

/**
 * Search feed by hashtag
 */
export async function searchByHashtag(hashtag, limit, offset, env) {
  const searchTerm = hashtag.startsWith('#') ? hashtag : `#${hashtag}`;

  const result = await env.DB.prepare(`
    SELECT
      st.id as shared_trade_id,
      st.user_id,
      st.caption,
      st.hashtags,
      st.likes_count,
      st.comments_count,
      st.created_at as shared_at,
      t.symbol,
      t.type,
      t.profit,
      t.pips,
      up.display_name,
      up.avatar_url
    FROM shared_trades st
    JOIN trades t ON st.trade_id = t.id
    JOIN user_profiles up ON st.user_id = up.user_id
    WHERE st.share_type = 'public'
    AND st.hashtags LIKE ?
    AND st.is_archived = 0
    ORDER BY st.created_at DESC
    LIMIT ? OFFSET ?
  `).bind(`%"${searchTerm}"%`, limit || 20, offset || 0).all();

  return result.results.map(t => ({
    ...t,
    hashtags: t.hashtags ? JSON.parse(t.hashtags) : []
  }));
}

/**
 * Get trending hashtags
 */
export async function getTrendingHashtags(limit, env) {
  // This is a simplified version - in production you'd want a more sophisticated trending algorithm
  const result = await env.DB.prepare(`
    SELECT hashtags
    FROM shared_trades
    WHERE share_type = 'public'
    AND datetime(created_at) >= datetime('now', '-7 days')
  `).all();

  const hashtagCounts = {};

  result.results.forEach(row => {
    if (row.hashtags) {
      const tags = JSON.parse(row.hashtags);
      tags.forEach(tag => {
        hashtagCounts[tag] = (hashtagCounts[tag] || 0) + 1;
      });
    }
  });

  return Object.entries(hashtagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit || 10)
    .map(([tag, count]) => ({ tag, count }));
}
