/**
 * Social Network API Routes
 */

import {
  getOrCreateProfile,
  getPublicProfile,
  updateProfile,
  updatePublicStats,
  searchProfiles,
  getVerifiedTraders,
  requestVerification
} from './profileService.js';

import {
  followUser,
  unfollowUser,
  startCopying,
  stopCopying,
  updateCopySettings,
  getFollowers,
  getFollowing,
  getCopiers,
  blockUser,
  unblockUser
} from './followingService.js';

import {
  shareTrade,
  getPublicFeed,
  getFollowingFeed,
  likeTrade,
  unlikeTrade,
  addComment,
  getComments,
  deleteComment,
  getSharedTradeDetails,
  deleteSharedTrade,
  searchByHashtag,
  getTrendingHashtags
} from './feedService.js';

import {
  createStrategyListing,
  getMarketplaceListings,
  getStrategyDetails,
  purchaseStrategy,
  getPurchasedStrategies,
  getSellerStrategies,
  submitStrategyReview,
  updateStrategyListing,
  getTopSellers
} from './marketplaceService.js';

import {
  getLeaderboard,
  getUserRank,
  getLeaderboardByMetric,
  getTopGainers,
  getMostConsistent,
  getMostActive,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getUnreadNotificationCount
} from './leaderboardService.js';

/**
 * Register all social network routes
 */
export function registerSocialRoutes(routes) {
  // ================== PROFILE ROUTES ==================

  // Get my profile
  routes.push({
    method: 'GET',
    pattern: /^\/api\/social\/profile$/,
    handler: async (request, env, userId) => {
      try {
        const profile = await getOrCreateProfile(userId, env);
        return jsonResponse({ success: true, profile });
      } catch (error) {
        return errorResponse('Failed to fetch profile', error);
      }
    }
  });

  // Update my profile
  routes.push({
    method: 'PUT',
    pattern: /^\/api\/social\/profile$/,
    handler: async (request, env, userId) => {
      try {
        const body = await request.json();
        const result = await updateProfile(userId, body, env);

        if (result.error) {
          return jsonResponse({ success: false, error: result.error }, 400);
        }

        return jsonResponse({ success: true, message: 'Profile updated' });
      } catch (error) {
        return errorResponse('Failed to update profile', error);
      }
    }
  });

  // Get public profile
  routes.push({
    method: 'GET',
    pattern: /^\/api\/social\/profile\/(\d+)$/,
    handler: async (request, env, userId, matches) => {
      try {
        const targetUserId = parseInt(matches[1]);
        const profile = await getPublicProfile(targetUserId, userId, env);

        if (!profile) {
          return jsonResponse({ error: 'Profile not found or not public' }, 404);
        }

        return jsonResponse({ success: true, profile });
      } catch (error) {
        return errorResponse('Failed to fetch profile', error);
      }
    }
  });

  // Search profiles
  routes.push({
    method: 'GET',
    pattern: /^\/api\/social\/profiles\/search$/,
    handler: async (request, env, userId) => {
      try {
        const url = new URL(request.url);
        const query = url.searchParams.get('q') || '';
        const limit = parseInt(url.searchParams.get('limit')) || 20;

        const profiles = await searchProfiles(query, limit, env);
        return jsonResponse({ success: true, profiles, count: profiles.length });
      } catch (error) {
        return errorResponse('Search failed', error);
      }
    }
  });

  // Get verified traders
  routes.push({
    method: 'GET',
    pattern: /^\/api\/social\/verified-traders$/,
    handler: async (request, env, userId) => {
      try {
        const url = new URL(request.url);
        const limit = parseInt(url.searchParams.get('limit')) || 20;

        const traders = await getVerifiedTraders(limit, env);
        return jsonResponse({ success: true, traders });
      } catch (error) {
        return errorResponse('Failed to fetch verified traders', error);
      }
    }
  });

  // ================== FOLLOW ROUTES ==================

  // Follow user
  routes.push({
    method: 'POST',
    pattern: /^\/api\/social\/follow\/(\d+)$/,
    handler: async (request, env, userId, matches) => {
      try {
        const targetUserId = parseInt(matches[1]);
        const result = await followUser(userId, targetUserId, env);

        if (result.error) {
          return jsonResponse({ success: false, error: result.error }, 400);
        }

        return jsonResponse({ success: true, message: 'Now following' });
      } catch (error) {
        return errorResponse('Failed to follow user', error);
      }
    }
  });

  // Unfollow user
  routes.push({
    method: 'DELETE',
    pattern: /^\/api\/social\/follow\/(\d+)$/,
    handler: async (request, env, userId, matches) => {
      try {
        const targetUserId = parseInt(matches[1]);
        await unfollowUser(userId, targetUserId, env);
        return jsonResponse({ success: true, message: 'Unfollowed' });
      } catch (error) {
        return errorResponse('Failed to unfollow user', error);
      }
    }
  });

  // Start copying
  routes.push({
    method: 'POST',
    pattern: /^\/api\/social\/copy\/(\d+)$/,
    handler: async (request, env, userId, matches) => {
      try {
        const targetUserId = parseInt(matches[1]);
        const body = await request.json();

        const result = await startCopying(userId, targetUserId, body, env);

        if (result.error) {
          return jsonResponse({ success: false, error: result.error }, 400);
        }

        return jsonResponse({
          success: true,
          message: 'Now copying trades',
          settings: result.settings
        });
      } catch (error) {
        return errorResponse('Failed to start copying', error);
      }
    }
  });

  // Stop copying
  routes.push({
    method: 'DELETE',
    pattern: /^\/api\/social\/copy\/(\d+)$/,
    handler: async (request, env, userId, matches) => {
      try {
        const targetUserId = parseInt(matches[1]);
        await stopCopying(userId, targetUserId, env);
        return jsonResponse({ success: true, message: 'Stopped copying' });
      } catch (error) {
        return errorResponse('Failed to stop copying', error);
      }
    }
  });

  // Get followers
  routes.push({
    method: 'GET',
    pattern: /^\/api\/social\/followers$/,
    handler: async (request, env, userId) => {
      try {
        const url = new URL(request.url);
        const limit = parseInt(url.searchParams.get('limit')) || 20;
        const offset = parseInt(url.searchParams.get('offset')) || 0;

        const followers = await getFollowers(userId, limit, offset, env);
        return jsonResponse({ success: true, followers, count: followers.length });
      } catch (error) {
        return errorResponse('Failed to fetch followers', error);
      }
    }
  });

  // Get following
  routes.push({
    method: 'GET',
    pattern: /^\/api\/social\/following$/,
    handler: async (request, env, userId) => {
      try {
        const url = new URL(request.url);
        const limit = parseInt(url.searchParams.get('limit')) || 20;
        const offset = parseInt(url.searchParams.get('offset')) || 0;

        const following = await getFollowing(userId, limit, offset, env);
        return jsonResponse({ success: true, following, count: following.length });
      } catch (error) {
        return errorResponse('Failed to fetch following', error);
      }
    }
  });

  // ================== FEED ROUTES ==================

  // Get public feed
  routes.push({
    method: 'GET',
    pattern: /^\/api\/social\/feed$/,
    handler: async (request, env, userId) => {
      try {
        const url = new URL(request.url);
        const limit = parseInt(url.searchParams.get('limit')) || 20;
        const offset = parseInt(url.searchParams.get('offset')) || 0;

        const feed = await getPublicFeed(userId, limit, offset, env);
        return jsonResponse({ success: true, feed, count: feed.length });
      } catch (error) {
        return errorResponse('Failed to fetch feed', error);
      }
    }
  });

  // Get following feed
  routes.push({
    method: 'GET',
    pattern: /^\/api\/social\/feed\/following$/,
    handler: async (request, env, userId) => {
      try {
        const url = new URL(request.url);
        const limit = parseInt(url.searchParams.get('limit')) || 20;
        const offset = parseInt(url.searchParams.get('offset')) || 0;

        const feed = await getFollowingFeed(userId, limit, offset, env);
        return jsonResponse({ success: true, feed, count: feed.length });
      } catch (error) {
        return errorResponse('Failed to fetch feed', error);
      }
    }
  });

  // Share trade
  routes.push({
    method: 'POST',
    pattern: /^\/api\/social\/share-trade\/(\d+)$/,
    handler: async (request, env, userId, matches) => {
      try {
        const tradeId = parseInt(matches[1]);
        const body = await request.json();

        const result = await shareTrade(userId, tradeId, body, env);

        if (result.error) {
          return jsonResponse({ success: false, error: result.error }, 400);
        }

        return jsonResponse({ success: true, ...result });
      } catch (error) {
        return errorResponse('Failed to share trade', error);
      }
    }
  });

  // Like trade
  routes.push({
    method: 'POST',
    pattern: /^\/api\/social\/like\/(\d+)$/,
    handler: async (request, env, userId, matches) => {
      try {
        const sharedTradeId = parseInt(matches[1]);
        const result = await likeTrade(userId, sharedTradeId, env);

        if (result.error) {
          return jsonResponse({ success: false, error: result.error }, 400);
        }

        return jsonResponse({ success: true });
      } catch (error) {
        return errorResponse('Failed to like trade', error);
      }
    }
  });

  // Unlike trade
  routes.push({
    method: 'DELETE',
    pattern: /^\/api\/social\/like\/(\d+)$/,
    handler: async (request, env, userId, matches) => {
      try {
        const sharedTradeId = parseInt(matches[1]);
        await unlikeTrade(userId, sharedTradeId, env);
        return jsonResponse({ success: true });
      } catch (error) {
        return errorResponse('Failed to unlike trade', error);
      }
    }
  });

  // Add comment
  routes.push({
    method: 'POST',
    pattern: /^\/api\/social\/comment\/(\d+)$/,
    handler: async (request, env, userId, matches) => {
      try {
        const sharedTradeId = parseInt(matches[1]);
        const body = await request.json();

        const result = await addComment(
          userId,
          sharedTradeId,
          body.text,
          body.parentCommentId,
          env
        );

        if (result.error) {
          return jsonResponse({ success: false, error: result.error }, 400);
        }

        return jsonResponse({ success: true, ...result });
      } catch (error) {
        return errorResponse('Failed to add comment', error);
      }
    }
  });

  // Get comments
  routes.push({
    method: 'GET',
    pattern: /^\/api\/social\/comments\/(\d+)$/,
    handler: async (request, env, userId, matches) => {
      try {
        const sharedTradeId = parseInt(matches[1]);
        const url = new URL(request.url);
        const limit = parseInt(url.searchParams.get('limit')) || 50;
        const offset = parseInt(url.searchParams.get('offset')) || 0;

        const comments = await getComments(sharedTradeId, limit, offset, env);
        return jsonResponse({ success: true, comments, count: comments.length });
      } catch (error) {
        return errorResponse('Failed to fetch comments', error);
      }
    }
  });

  // ================== MARKETPLACE ROUTES ==================

  // Get marketplace listings
  routes.push({
    method: 'GET',
    pattern: /^\/api\/social\/marketplace$/,
    handler: async (request, env, userId) => {
      try {
        const url = new URL(request.url);
        const filters = {
          strategyType: url.searchParams.get('type'),
          minPrice: url.searchParams.get('minPrice')
            ? parseFloat(url.searchParams.get('minPrice'))
            : undefined,
          maxPrice: url.searchParams.get('maxPrice')
            ? parseFloat(url.searchParams.get('maxPrice'))
            : undefined,
          minRating: url.searchParams.get('minRating')
            ? parseFloat(url.searchParams.get('minRating'))
            : undefined
        };

        const limit = parseInt(url.searchParams.get('limit')) || 20;
        const offset = parseInt(url.searchParams.get('offset')) || 0;

        const listings = await getMarketplaceListings(filters, limit, offset, env);
        return jsonResponse({ success: true, listings, count: listings.length });
      } catch (error) {
        return errorResponse('Failed to fetch marketplace', error);
      }
    }
  });

  // Get strategy details
  routes.push({
    method: 'GET',
    pattern: /^\/api\/social\/marketplace\/(\d+)$/,
    handler: async (request, env, userId, matches) => {
      try {
        const strategyId = parseInt(matches[1]);
        const strategy = await getStrategyDetails(strategyId, userId, env);

        if (!strategy) {
          return jsonResponse({ error: 'Strategy not found' }, 404);
        }

        return jsonResponse({ success: true, strategy });
      } catch (error) {
        return errorResponse('Failed to fetch strategy', error);
      }
    }
  });

  // Create strategy listing
  routes.push({
    method: 'POST',
    pattern: /^\/api\/social\/marketplace$/,
    handler: async (request, env, userId) => {
      try {
        const body = await request.json();
        const result = await createStrategyListing(userId, body, env);

        if (result.error) {
          return jsonResponse({ success: false, error: result.error }, 400);
        }

        return jsonResponse({ success: true, ...result });
      } catch (error) {
        return errorResponse('Failed to create listing', error);
      }
    }
  });

  // Purchase strategy
  routes.push({
    method: 'POST',
    pattern: /^\/api\/social\/marketplace\/(\d+)\/purchase$/,
    handler: async (request, env, userId, matches) => {
      try {
        const strategyId = parseInt(matches[1]);
        const body = await request.json();

        const result = await purchaseStrategy(userId, strategyId, body, env);

        if (result.error) {
          return jsonResponse({ success: false, error: result.error }, 400);
        }

        return jsonResponse({ success: true, ...result });
      } catch (error) {
        return errorResponse('Failed to purchase', error);
      }
    }
  });

  // Get my purchases
  routes.push({
    method: 'GET',
    pattern: /^\/api\/social\/marketplace\/purchases$/,
    handler: async (request, env, userId) => {
      try {
        const purchases = await getPurchasedStrategies(userId, env);
        return jsonResponse({ success: true, purchases, count: purchases.length });
      } catch (error) {
        return errorResponse('Failed to fetch purchases', error);
      }
    }
  });

  // ================== LEADERBOARD ROUTES ==================

  // Get leaderboard
  routes.push({
    method: 'GET',
    pattern: /^\/api\/social\/leaderboard$/,
    handler: async (request, env, userId) => {
      try {
        const url = new URL(request.url);
        const period = url.searchParams.get('period') || 'monthly';
        const limit = parseInt(url.searchParams.get('limit')) || 50;

        const leaderboard = await getLeaderboard(period, limit, env);
        return jsonResponse({ success: true, ...leaderboard });
      } catch (error) {
        return errorResponse('Failed to fetch leaderboard', error);
      }
    }
  });

  // Get my rank
  routes.push({
    method: 'GET',
    pattern: /^\/api\/social\/leaderboard\/my-rank$/,
    handler: async (request, env, userId) => {
      try {
        const url = new URL(request.url);
        const period = url.searchParams.get('period') || 'monthly';

        const rank = await getUserRank(userId, period, env);
        return jsonResponse({ success: true, ...rank });
      } catch (error) {
        return errorResponse('Failed to fetch rank', error);
      }
    }
  });

  // ================== NOTIFICATION ROUTES ==================

  // Get notifications
  routes.push({
    method: 'GET',
    pattern: /^\/api\/social\/notifications$/,
    handler: async (request, env, userId) => {
      try {
        const url = new URL(request.url);
        const limit = parseInt(url.searchParams.get('limit')) || 20;

        const notifications = await getNotifications(userId, limit, env);
        const unreadCount = await getUnreadNotificationCount(userId, env);

        return jsonResponse({
          success: true,
          notifications,
          unreadCount
        });
      } catch (error) {
        return errorResponse('Failed to fetch notifications', error);
      }
    }
  });

  // Mark notification as read
  routes.push({
    method: 'POST',
    pattern: /^\/api\/social\/notifications\/(\d+)\/read$/,
    handler: async (request, env, userId, matches) => {
      try {
        const notificationId = parseInt(matches[1]);
        await markNotificationRead(userId, notificationId, env);
        return jsonResponse({ success: true });
      } catch (error) {
        return errorResponse('Failed to mark as read', error);
      }
    }
  });

  // Mark all notifications as read
  routes.push({
    method: 'POST',
    pattern: /^\/api\/social\/notifications\/read-all$/,
    handler: async (request, env, userId) => {
      try {
        await markAllNotificationsRead(userId, env);
        return jsonResponse({ success: true });
      } catch (error) {
        return errorResponse('Failed to mark all as read', error);
      }
    }
  });
}

// Helper functions
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

function errorResponse(message, error, status = 500) {
  return new Response(JSON.stringify({
    error: message,
    details: error?.message
  }), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}
