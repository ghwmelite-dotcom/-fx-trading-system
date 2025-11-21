/**
 * Following Service
 * Manages follow/copy relationships between traders
 */

/**
 * Follow a user
 */
export async function followUser(followerId, targetUserId, env) {
  if (followerId === targetUserId) {
    return { error: 'Cannot follow yourself' };
  }

  // Check if target user allows followers
  const targetProfile = await env.DB.prepare(`
    SELECT * FROM user_profiles
    WHERE user_id = ? AND is_public = 1 AND allow_followers = 1
  `).bind(targetUserId).first();

  if (!targetProfile) {
    return { error: 'User does not allow followers or profile is not public' };
  }

  // Check if already following
  const existing = await env.DB.prepare(`
    SELECT * FROM social_connections
    WHERE follower_id = ? AND following_id = ?
  `).bind(followerId, targetUserId).first();

  if (existing) {
    if (existing.connection_type === 'block') {
      return { error: 'You have blocked this user' };
    }
    return { error: 'Already following this user' };
  }

  // Create connection
  await env.DB.prepare(`
    INSERT INTO social_connections (follower_id, following_id, connection_type)
    VALUES (?, ?, 'follow')
  `).bind(followerId, targetUserId).run();

  // Update counts
  await updateFollowCounts(followerId, targetUserId, env);

  // Create notification
  await createSocialNotification(
    targetUserId,
    'new_follower',
    'New Follower',
    'Someone started following you',
    followerId,
    env
  );

  return { success: true };
}

/**
 * Unfollow a user
 */
export async function unfollowUser(followerId, targetUserId, env) {
  await env.DB.prepare(`
    DELETE FROM social_connections
    WHERE follower_id = ? AND following_id = ?
    AND connection_type IN ('follow', 'copy')
  `).bind(followerId, targetUserId).run();

  // Update counts
  await updateFollowCounts(followerId, targetUserId, env);

  return { success: true };
}

/**
 * Start copying a trader
 */
export async function startCopying(followerId, targetUserId, copySettings, env) {
  if (followerId === targetUserId) {
    return { error: 'Cannot copy yourself' };
  }

  // Check if target allows copying
  const targetProfile = await env.DB.prepare(`
    SELECT * FROM user_profiles
    WHERE user_id = ? AND is_public = 1 AND allow_copying = 1
  `).bind(targetUserId).first();

  if (!targetProfile) {
    return { error: 'User does not allow copy trading' };
  }

  // Check existing connection
  const existing = await env.DB.prepare(`
    SELECT * FROM social_connections
    WHERE follower_id = ? AND following_id = ?
  `).bind(followerId, targetUserId).first();

  if (existing && existing.is_copying_active === 1) {
    return { error: 'Already copying this trader' };
  }

  // Validate copy settings
  const validatedSettings = {
    lotMultiplier: copySettings.lotMultiplier || 1.0,
    maxRisk: copySettings.maxRisk || 2.0, // Max % per trade
    pairsToCopy: copySettings.pairsToCopy || [], // Empty = all pairs
    maxOpenPositions: copySettings.maxOpenPositions || 5
  };

  if (existing) {
    // Update existing connection to copy
    await env.DB.prepare(`
      UPDATE social_connections
      SET connection_type = 'copy',
          copy_settings = ?,
          is_copying_active = 1
      WHERE follower_id = ? AND following_id = ?
    `).bind(
      JSON.stringify(validatedSettings),
      followerId,
      targetUserId
    ).run();
  } else {
    // Create new copy connection
    await env.DB.prepare(`
      INSERT INTO social_connections (
        follower_id, following_id, connection_type,
        copy_settings, is_copying_active
      ) VALUES (?, ?, 'copy', ?, 1)
    `).bind(
      followerId,
      targetUserId,
      JSON.stringify(validatedSettings)
    ).run();
  }

  // Update copier count
  await updateCopierCount(targetUserId, env);

  // Create notification
  await createSocialNotification(
    targetUserId,
    'new_copier',
    'New Copier',
    'Someone started copying your trades',
    followerId,
    env
  );

  return { success: true, settings: validatedSettings };
}

/**
 * Stop copying a trader
 */
export async function stopCopying(followerId, targetUserId, env) {
  await env.DB.prepare(`
    UPDATE social_connections
    SET connection_type = 'follow',
        is_copying_active = 0
    WHERE follower_id = ? AND following_id = ?
  `).bind(followerId, targetUserId).run();

  // Update copier count
  await updateCopierCount(targetUserId, env);

  return { success: true };
}

/**
 * Update copy settings
 */
export async function updateCopySettings(followerId, targetUserId, newSettings, env) {
  const existing = await env.DB.prepare(`
    SELECT copy_settings FROM social_connections
    WHERE follower_id = ? AND following_id = ?
    AND connection_type = 'copy'
  `).bind(followerId, targetUserId).first();

  if (!existing) {
    return { error: 'Not copying this trader' };
  }

  const currentSettings = existing.copy_settings ? JSON.parse(existing.copy_settings) : {};
  const updatedSettings = { ...currentSettings, ...newSettings };

  await env.DB.prepare(`
    UPDATE social_connections
    SET copy_settings = ?
    WHERE follower_id = ? AND following_id = ?
  `).bind(
    JSON.stringify(updatedSettings),
    followerId,
    targetUserId
  ).run();

  return { success: true, settings: updatedSettings };
}

/**
 * Get followers list
 */
export async function getFollowers(userId, limit, offset, env) {
  const result = await env.DB.prepare(`
    SELECT
      sc.follower_id,
      sc.connection_type,
      sc.is_copying_active,
      sc.created_at,
      up.display_name,
      up.avatar_url,
      up.public_win_rate,
      up.followers_count
    FROM social_connections sc
    JOIN user_profiles up ON sc.follower_id = up.user_id
    WHERE sc.following_id = ?
    AND sc.connection_type IN ('follow', 'copy')
    ORDER BY sc.created_at DESC
    LIMIT ? OFFSET ?
  `).bind(userId, limit || 20, offset || 0).all();

  return result.results;
}

/**
 * Get following list
 */
export async function getFollowing(userId, limit, offset, env) {
  const result = await env.DB.prepare(`
    SELECT
      sc.following_id,
      sc.connection_type,
      sc.is_copying_active,
      sc.copy_settings,
      sc.copy_performance,
      sc.total_trades_copied,
      sc.created_at,
      up.display_name,
      up.avatar_url,
      up.public_win_rate,
      up.public_profit_factor,
      up.followers_count
    FROM social_connections sc
    JOIN user_profiles up ON sc.following_id = up.user_id
    WHERE sc.follower_id = ?
    AND sc.connection_type IN ('follow', 'copy')
    ORDER BY sc.created_at DESC
    LIMIT ? OFFSET ?
  `).bind(userId, limit || 20, offset || 0).all();

  return result.results.map(r => ({
    ...r,
    copySettings: r.copy_settings ? JSON.parse(r.copy_settings) : null,
    copyPerformance: r.copy_performance ? JSON.parse(r.copy_performance) : null
  }));
}

/**
 * Get copiers of a trader
 */
export async function getCopiers(userId, env) {
  const result = await env.DB.prepare(`
    SELECT
      sc.follower_id,
      sc.copy_settings,
      sc.total_trades_copied,
      sc.created_at,
      up.display_name,
      up.avatar_url
    FROM social_connections sc
    JOIN user_profiles up ON sc.follower_id = up.user_id
    WHERE sc.following_id = ?
    AND sc.connection_type = 'copy'
    AND sc.is_copying_active = 1
    ORDER BY sc.created_at DESC
  `).bind(userId).all();

  return result.results;
}

/**
 * Block a user
 */
export async function blockUser(userId, targetUserId, env) {
  // Remove any existing connection
  await env.DB.prepare(`
    DELETE FROM social_connections
    WHERE (follower_id = ? AND following_id = ?)
    OR (follower_id = ? AND following_id = ?)
  `).bind(userId, targetUserId, targetUserId, userId).run();

  // Create block
  await env.DB.prepare(`
    INSERT INTO social_connections (follower_id, following_id, connection_type)
    VALUES (?, ?, 'block')
  `).bind(userId, targetUserId).run();

  // Update counts
  await updateFollowCounts(userId, targetUserId, env);

  return { success: true };
}

/**
 * Unblock a user
 */
export async function unblockUser(userId, targetUserId, env) {
  await env.DB.prepare(`
    DELETE FROM social_connections
    WHERE follower_id = ? AND following_id = ?
    AND connection_type = 'block'
  `).bind(userId, targetUserId).run();

  return { success: true };
}

/**
 * Helper: Update follow counts
 */
async function updateFollowCounts(followerId, followingId, env) {
  // Update follower's following_count
  const followingCount = await env.DB.prepare(`
    SELECT COUNT(*) as count FROM social_connections
    WHERE follower_id = ? AND connection_type IN ('follow', 'copy')
  `).bind(followerId).first();

  await env.DB.prepare(`
    UPDATE user_profiles SET following_count = ? WHERE user_id = ?
  `).bind(followingCount.count, followerId).run();

  // Update following's followers_count
  const followersCount = await env.DB.prepare(`
    SELECT COUNT(*) as count FROM social_connections
    WHERE following_id = ? AND connection_type IN ('follow', 'copy')
  `).bind(followingId).first();

  await env.DB.prepare(`
    UPDATE user_profiles SET followers_count = ? WHERE user_id = ?
  `).bind(followersCount.count, followingId).run();
}

/**
 * Helper: Update copier count
 */
async function updateCopierCount(userId, env) {
  const count = await env.DB.prepare(`
    SELECT COUNT(*) as count FROM social_connections
    WHERE following_id = ?
    AND connection_type = 'copy'
    AND is_copying_active = 1
  `).bind(userId).first();

  await env.DB.prepare(`
    UPDATE user_profiles SET copiers_count = ? WHERE user_id = ?
  `).bind(count.count, userId).run();
}

/**
 * Helper: Create social notification
 */
async function createSocialNotification(userId, type, title, message, relatedUserId, env) {
  await env.DB.prepare(`
    INSERT INTO social_notifications (
      user_id, type, title, message, related_user_id
    ) VALUES (?, ?, ?, ?, ?)
  `).bind(userId, type, title, message, relatedUserId).run();
}

/**
 * Record copied trade
 */
export async function recordCopiedTrade(followerId, targetUserId, tradeProfit, env) {
  // Update copy performance stats
  const connection = await env.DB.prepare(`
    SELECT copy_performance, total_trades_copied FROM social_connections
    WHERE follower_id = ? AND following_id = ?
    AND connection_type = 'copy'
  `).bind(followerId, targetUserId).first();

  if (!connection) return;

  const performance = connection.copy_performance
    ? JSON.parse(connection.copy_performance)
    : { totalProfit: 0, wins: 0, losses: 0 };

  performance.totalProfit += tradeProfit;
  if (tradeProfit > 0) performance.wins++;
  else performance.losses++;

  await env.DB.prepare(`
    UPDATE social_connections
    SET copy_performance = ?,
        total_trades_copied = total_trades_copied + 1
    WHERE follower_id = ? AND following_id = ?
  `).bind(
    JSON.stringify(performance),
    followerId,
    targetUserId
  ).run();
}
