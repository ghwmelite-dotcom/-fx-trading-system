import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, Trophy, TrendingUp, Heart, MessageCircle, Share2, Copy,
  Star, UserPlus, UserMinus, Shield, Globe, Clock, DollarSign,
  Award, Filter, Search, ChevronRight, RefreshCw, Bell, Settings,
  Eye, EyeOff, BarChart3, Zap, Crown, ShoppingBag, ExternalLink,
  ThumbsUp, Send, MoreHorizontal, CheckCircle, AlertCircle
} from 'lucide-react';

const SocialNetworkDashboard = ({ apiUrl, authToken, currentUserId }) => {
  const [activeTab, setActiveTab] = useState('leaderboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Leaderboard state
  const [leaderboard, setLeaderboard] = useState([]);
  const [leaderboardPeriod, setLeaderboardPeriod] = useState('monthly');
  const [leaderboardMetric, setLeaderboardMetric] = useState('profit');

  // Profile state
  const [myProfile, setMyProfile] = useState(null);
  const [viewingProfile, setViewingProfile] = useState(null);

  // Feed state
  const [feed, setFeed] = useState([]);
  const [feedType, setFeedType] = useState('following');

  // Following state
  const [following, setFollowing] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [copyTraders, setCopyTraders] = useState([]);

  // Marketplace state
  const [strategies, setStrategies] = useState([]);

  // Notifications
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await fetch(
        `${apiUrl}/api/social/leaderboard?period=${leaderboardPeriod}&metric=${leaderboardMetric}`,
        { headers: { 'Authorization': `Bearer ${authToken}` } }
      );
      const data = await res.json();
      if (data.success) {
        setLeaderboard(data.rankings || []);
      }
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    }
  }, [apiUrl, authToken, leaderboardPeriod, leaderboardMetric]);

  const fetchMyProfile = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/api/social/profile`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (data.success) {
        setMyProfile(data.profile);
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    }
  }, [apiUrl, authToken]);

  const fetchFeed = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/api/social/feed?type=${feedType}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (data.success) {
        setFeed(data.posts || []);
      }
    } catch (err) {
      console.error('Failed to fetch feed:', err);
    }
  }, [apiUrl, authToken, feedType]);

  const fetchFollowing = useCallback(async () => {
    try {
      const [followingRes, followersRes, copyRes] = await Promise.all([
        fetch(`${apiUrl}/api/social/following`, { headers: { 'Authorization': `Bearer ${authToken}` } }),
        fetch(`${apiUrl}/api/social/followers`, { headers: { 'Authorization': `Bearer ${authToken}` } }),
        fetch(`${apiUrl}/api/social/copy-traders`, { headers: { 'Authorization': `Bearer ${authToken}` } })
      ]);

      const [followingData, followersData, copyData] = await Promise.all([
        followingRes.json(),
        followersRes.json(),
        copyRes.json()
      ]);

      if (followingData.success) setFollowing(followingData.following || []);
      if (followersData.success) setFollowers(followersData.followers || []);
      if (copyData.success) setCopyTraders(copyData.traders || []);
    } catch (err) {
      console.error('Failed to fetch following data:', err);
    }
  }, [apiUrl, authToken]);

  const fetchStrategies = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/api/social/marketplace/strategies`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (data.success) {
        setStrategies(data.strategies || []);
      }
    } catch (err) {
      console.error('Failed to fetch strategies:', err);
    }
  }, [apiUrl, authToken]);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/api/social/notifications`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unread_count || 0);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  }, [apiUrl, authToken]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchLeaderboard(),
      fetchMyProfile(),
      fetchFeed(),
      fetchFollowing(),
      fetchStrategies(),
      fetchNotifications()
    ]).finally(() => setLoading(false));
  }, [fetchLeaderboard, fetchMyProfile, fetchFeed, fetchFollowing, fetchStrategies, fetchNotifications]);

  useEffect(() => {
    if (activeTab === 'leaderboard') fetchLeaderboard();
    if (activeTab === 'feed') fetchFeed();
  }, [activeTab, fetchLeaderboard, fetchFeed]);

  const followUser = async (userId) => {
    try {
      await fetch(`${apiUrl}/api/social/follow`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_user_id: userId })
      });
      fetchFollowing();
    } catch (err) {
      console.error('Failed to follow user:', err);
    }
  };

  const unfollowUser = async (userId) => {
    try {
      await fetch(`${apiUrl}/api/social/unfollow`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_user_id: userId })
      });
      fetchFollowing();
    } catch (err) {
      console.error('Failed to unfollow user:', err);
    }
  };

  const likePost = async (postId) => {
    try {
      await fetch(`${apiUrl}/api/social/posts/${postId}/like`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      fetchFeed();
    } catch (err) {
      console.error('Failed to like post:', err);
    }
  };

  const startCopyTrading = async (traderId, settings) => {
    try {
      await fetch(`${apiUrl}/api/social/copy-trading/start`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ trader_id: traderId, ...settings })
      });
      fetchFollowing();
    } catch (err) {
      setError('Failed to start copy trading');
    }
  };

  const isFollowing = (userId) => following.some(f => f.user_id === userId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/20 rounded-lg">
            <Users className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Social Trading</h2>
            <p className="text-sm text-slate-400">Connect, follow, and learn from other traders</p>
          </div>
        </div>

        {/* Notifications */}
        <button className="relative p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">
          <Bell className="w-5 h-5 text-slate-300" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-700 pb-2 overflow-x-auto">
        {[
          { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
          { id: 'feed', label: 'Feed', icon: MessageCircle },
          { id: 'following', label: 'Following', icon: UserPlus },
          { id: 'copy-trading', label: 'Copy Trading', icon: Copy },
          { id: 'marketplace', label: 'Marketplace', icon: ShoppingBag },
          { id: 'profile', label: 'My Profile', icon: Settings }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-t-lg whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-cyan-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Leaderboard Tab */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <select
              value={leaderboardPeriod}
              onChange={(e) => setLeaderboardPeriod(e.target.value)}
              className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="daily">Today</option>
              <option value="weekly">This Week</option>
              <option value="monthly">This Month</option>
              <option value="all_time">All Time</option>
            </select>

            <select
              value={leaderboardMetric}
              onChange={(e) => setLeaderboardMetric(e.target.value)}
              className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="profit">By Profit</option>
              <option value="win_rate">By Win Rate</option>
              <option value="profit_factor">By Profit Factor</option>
              <option value="trades">By Trade Count</option>
              <option value="roi">By ROI</option>
            </select>
          </div>

          {/* Rankings */}
          <div className="space-y-3">
            {leaderboard.length === 0 ? (
              <div className="text-center py-12 bg-slate-800/50 rounded-xl border border-slate-700">
                <Trophy className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white">No Rankings Yet</h3>
                <p className="text-slate-400">Be the first to make your mark!</p>
              </div>
            ) : (
              leaderboard.map((trader, index) => (
                <LeaderboardCard
                  key={trader.userId}
                  trader={trader}
                  rank={index + 1}
                  isFollowing={isFollowing(trader.userId)}
                  onFollow={() => followUser(trader.userId)}
                  onUnfollow={() => unfollowUser(trader.userId)}
                  metric={leaderboardMetric}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* Feed Tab */}
      {activeTab === 'feed' && (
        <div className="space-y-4">
          {/* Feed Type Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setFeedType('following')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                feedType === 'following'
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Following
            </button>
            <button
              onClick={() => setFeedType('global')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                feedType === 'global'
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Global
            </button>
          </div>

          {/* Posts */}
          <div className="space-y-4">
            {feed.length === 0 ? (
              <div className="text-center py-12 bg-slate-800/50 rounded-xl border border-slate-700">
                <MessageCircle className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white">No Posts Yet</h3>
                <p className="text-slate-400">
                  {feedType === 'following'
                    ? 'Follow traders to see their posts'
                    : 'Be the first to share your trades!'}
                </p>
              </div>
            ) : (
              feed.map((post) => (
                <FeedPost
                  key={post.id}
                  post={post}
                  onLike={() => likePost(post.id)}
                  currentUserId={currentUserId}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* Following Tab */}
      {activeTab === 'following' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Following */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-cyan-400" />
              Following ({following.length})
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {following.length === 0 ? (
                <p className="text-slate-400 text-sm">You're not following anyone yet</p>
              ) : (
                following.map((user) => (
                  <FollowCard
                    key={user.user_id}
                    user={user}
                    onUnfollow={() => unfollowUser(user.user_id)}
                    showUnfollow
                  />
                ))
              )}
            </div>
          </div>

          {/* Followers */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-cyan-400" />
              Followers ({followers.length})
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {followers.length === 0 ? (
                <p className="text-slate-400 text-sm">You don't have any followers yet</p>
              ) : (
                followers.map((user) => (
                  <FollowCard
                    key={user.user_id}
                    user={user}
                    isFollowing={isFollowing(user.user_id)}
                    onFollow={() => followUser(user.user_id)}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Copy Trading Tab */}
      {activeTab === 'copy-trading' && (
        <div className="space-y-6">
          {/* Active Copy Traders */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              Active Copy Trading
            </h3>

            {copyTraders.length === 0 ? (
              <div className="text-center py-8">
                <Copy className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">You're not copying anyone yet</p>
                <p className="text-sm text-slate-500 mt-2">
                  Find top traders in the leaderboard and start copying their trades
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {copyTraders.map((trader) => (
                  <CopyTraderCard key={trader.trader_id} trader={trader} />
                ))}
              </div>
            )}
          </div>

          {/* Top Traders to Copy */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Crown className="w-5 h-5 text-yellow-400" />
              Recommended Traders to Copy
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {leaderboard.slice(0, 6).map((trader) => (
                <div key={trader.userId} className="bg-slate-700/50 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                      {trader.displayName?.[0] || 'T'}
                    </div>
                    <div>
                      <div className="font-semibold text-white flex items-center gap-1">
                        {trader.displayName}
                        {trader.isVerified && <Shield className="w-4 h-4 text-green-400" />}
                      </div>
                      <div className="text-xs text-slate-400">{trader.tradingStyle || 'Trader'}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div className="bg-slate-800/50 p-2 rounded-lg">
                      <div className="text-slate-400 text-xs">Win Rate</div>
                      <div className="text-green-400 font-semibold">{trader.stats?.winRate || 0}%</div>
                    </div>
                    <div className="bg-slate-800/50 p-2 rounded-lg">
                      <div className="text-slate-400 text-xs">Profit</div>
                      <div className={`font-semibold ${trader.stats?.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        ${trader.stats?.totalProfit?.toFixed(2) || 0}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => startCopyTrading(trader.userId, { risk_multiplier: 1.0 })}
                    className="w-full py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg text-white text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    Start Copying
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Marketplace Tab */}
      {activeTab === 'marketplace' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Strategy Marketplace</h3>
            <button className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg text-white text-sm transition-colors">
              List Your Strategy
            </button>
          </div>

          {strategies.length === 0 ? (
            <div className="text-center py-12 bg-slate-800/50 rounded-xl border border-slate-700">
              <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white">No Strategies Listed</h3>
              <p className="text-slate-400">Be the first to share your trading strategy!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {strategies.map((strategy) => (
                <StrategyCard key={strategy.id} strategy={strategy} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Profile Tab */}
      {activeTab === 'profile' && myProfile && (
        <ProfileEditor profile={myProfile} apiUrl={apiUrl} authToken={authToken} onUpdate={fetchMyProfile} />
      )}

      {/* Error Display */}
      {error && (
        <div className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-96 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <span className="text-red-400 text-sm flex-1">{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
            <span className="text-xl">&times;</span>
          </button>
        </div>
      )}
    </div>
  );
};

// Sub-components
const LeaderboardCard = ({ trader, rank, isFollowing, onFollow, onUnfollow, metric }) => {
  const getRankBadge = (rank) => {
    if (rank === 1) return { bg: 'bg-yellow-500/20', text: 'text-yellow-400', icon: '1st' };
    if (rank === 2) return { bg: 'bg-slate-400/20', text: 'text-slate-300', icon: '2nd' };
    if (rank === 3) return { bg: 'bg-orange-500/20', text: 'text-orange-400', icon: '3rd' };
    return { bg: 'bg-slate-700', text: 'text-slate-400', icon: rank };
  };

  const badge = getRankBadge(rank);

  return (
    <div className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${
      rank <= 3 ? 'bg-slate-800/70 border-slate-600' : 'bg-slate-800/50 border-slate-700'
    }`}>
      <div className={`w-12 h-12 ${badge.bg} rounded-full flex items-center justify-center ${badge.text} font-bold text-lg`}>
        {badge.icon}
      </div>

      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white">{trader.displayName}</span>
          {trader.isVerified && <Shield className="w-4 h-4 text-green-400" />}
          {trader.country && (
            <span className="text-xs text-slate-400">{trader.country}</span>
          )}
        </div>
        <div className="flex items-center gap-4 mt-1 text-sm">
          <span className="text-slate-400">{trader.stats?.totalTrades || 0} trades</span>
          <span className="text-green-400">{trader.stats?.winRate || 0}% win rate</span>
          <span className="text-cyan-400">PF: {trader.stats?.profitFactor || 0}</span>
        </div>
      </div>

      <div className="text-right">
        <div className={`text-xl font-bold ${trader.value?.startsWith('-') ? 'text-red-400' : 'text-green-400'}`}>
          {trader.value || `$${trader.stats?.totalProfit?.toFixed(2) || 0}`}
        </div>
        <div className="text-xs text-slate-500 capitalize">{metric.replace('_', ' ')}</div>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          isFollowing ? onUnfollow() : onFollow();
        }}
        className={`px-4 py-2 rounded-lg text-sm transition-colors ${
          isFollowing
            ? 'bg-slate-700 text-slate-300 hover:bg-red-500/20 hover:text-red-400'
            : 'bg-cyan-600 text-white hover:bg-cyan-700'
        }`}
      >
        {isFollowing ? 'Unfollow' : 'Follow'}
      </button>
    </div>
  );
};

const FeedPost = ({ post, onLike, currentUserId }) => {
  const [showComments, setShowComments] = useState(false);

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
          {post.display_name?.[0] || 'T'}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">{post.display_name}</span>
            {post.is_verified && <Shield className="w-4 h-4 text-green-400" />}
          </div>
          <div className="text-xs text-slate-500">
            {new Date(post.created_at).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Trade Info */}
      {post.trade_data && (
        <div className="mb-3 p-3 bg-slate-700/50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-white">{post.trade_data.pair}</span>
            <span className={`px-2 py-0.5 rounded text-xs ${
              post.trade_data.type === 'BUY'
                ? 'bg-green-500/20 text-green-400'
                : 'bg-red-500/20 text-red-400'
            }`}>
              {post.trade_data.type}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div>
              <span className="text-slate-400">Entry:</span>{' '}
              <span className="text-white">{post.trade_data.entry_price}</span>
            </div>
            <div>
              <span className="text-slate-400">Exit:</span>{' '}
              <span className="text-white">{post.trade_data.exit_price}</span>
            </div>
            <div>
              <span className="text-slate-400">P&L:</span>{' '}
              <span className={post.trade_data.profit >= 0 ? 'text-green-400' : 'text-red-400'}>
                ${post.trade_data.profit?.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Caption */}
      {post.caption && (
        <p className="text-slate-300 mb-3">{post.caption}</p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 pt-3 border-t border-slate-700">
        <button
          onClick={onLike}
          className={`flex items-center gap-1 transition-colors ${
            post.user_liked ? 'text-red-400' : 'text-slate-400 hover:text-red-400'
          }`}
        >
          <Heart className={`w-5 h-5 ${post.user_liked ? 'fill-current' : ''}`} />
          <span className="text-sm">{post.likes_count || 0}</span>
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1 text-slate-400 hover:text-cyan-400 transition-colors"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-sm">{post.comments_count || 0}</span>
        </button>
        <button className="flex items-center gap-1 text-slate-400 hover:text-green-400 transition-colors">
          <Share2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

const FollowCard = ({ user, isFollowing, onFollow, onUnfollow, showUnfollow }) => (
  <div className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg">
    <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
      {user.display_name?.[0] || 'T'}
    </div>
    <div className="flex-1">
      <div className="font-semibold text-white flex items-center gap-1">
        {user.display_name}
        {user.is_verified && <Shield className="w-3 h-3 text-green-400" />}
      </div>
      <div className="text-xs text-slate-400">
        {user.stats?.totalTrades || 0} trades | {user.stats?.winRate || 0}% win rate
      </div>
    </div>
    {showUnfollow ? (
      <button
        onClick={onUnfollow}
        className="px-3 py-1 bg-slate-600 hover:bg-red-500/20 hover:text-red-400 rounded-lg text-sm text-slate-300 transition-colors"
      >
        Unfollow
      </button>
    ) : !isFollowing && (
      <button
        onClick={onFollow}
        className="px-3 py-1 bg-cyan-600 hover:bg-cyan-700 rounded-lg text-sm text-white transition-colors"
      >
        Follow
      </button>
    )}
  </div>
);

const CopyTraderCard = ({ trader }) => (
  <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-xl">
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold">
        {trader.display_name?.[0] || 'T'}
      </div>
      <div>
        <div className="font-semibold text-white">{trader.display_name}</div>
        <div className="text-sm text-slate-400">
          Risk: {trader.risk_multiplier}x | Copying since {new Date(trader.started_at).toLocaleDateString()}
        </div>
      </div>
    </div>
    <div className="text-right">
      <div className={`text-lg font-bold ${trader.total_profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
        ${trader.total_profit?.toFixed(2) || 0}
      </div>
      <div className="text-xs text-slate-500">{trader.total_trades || 0} trades copied</div>
    </div>
    <button className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm transition-colors">
      Stop
    </button>
  </div>
);

const StrategyCard = ({ strategy }) => (
  <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
    <div className="flex items-start justify-between mb-3">
      <div>
        <h4 className="font-semibold text-white">{strategy.name}</h4>
        <p className="text-sm text-slate-400 mt-1">{strategy.description?.slice(0, 100)}...</p>
      </div>
      {strategy.is_verified && (
        <Shield className="w-5 h-5 text-green-400" />
      )}
    </div>

    <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
      <div className="bg-slate-700/50 p-2 rounded-lg">
        <div className="text-slate-400 text-xs">Win Rate</div>
        <div className="text-green-400 font-semibold">{strategy.performance?.win_rate || 0}%</div>
      </div>
      <div className="bg-slate-700/50 p-2 rounded-lg">
        <div className="text-slate-400 text-xs">Profit Factor</div>
        <div className="text-cyan-400 font-semibold">{strategy.performance?.profit_factor || 0}</div>
      </div>
    </div>

    <div className="flex items-center justify-between pt-3 border-t border-slate-700">
      <div className="text-lg font-bold text-white">
        ${strategy.price || 0}
        {strategy.price_type === 'subscription' && <span className="text-sm text-slate-400">/mo</span>}
      </div>
      <button className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg text-white text-sm transition-colors">
        View Details
      </button>
    </div>
  </div>
);

const ProfileEditor = ({ profile, apiUrl, authToken, onUpdate }) => {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    display_name: profile?.display_name || '',
    bio: profile?.bio || '',
    is_public: profile?.is_public || false,
    show_trades: profile?.show_trades || false,
    trading_style: profile?.trading_style || ''
  });

  const handleSave = async () => {
    try {
      await fetch(`${apiUrl}/api/social/profile`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      setEditing(false);
      onUpdate();
    } catch (err) {
      console.error('Failed to update profile:', err);
    }
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Profile Settings</h3>
        <button
          onClick={() => editing ? handleSave() : setEditing(true)}
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg text-white text-sm transition-colors"
        >
          {editing ? 'Save Changes' : 'Edit Profile'}
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm text-slate-400 mb-1">Display Name</label>
          <input
            type="text"
            value={formData.display_name}
            onChange={(e) => setFormData({...formData, display_name: e.target.value})}
            disabled={!editing}
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>

        <div>
          <label className="block text-sm text-slate-400 mb-1">Bio</label>
          <textarea
            value={formData.bio}
            onChange={(e) => setFormData({...formData, bio: e.target.value})}
            disabled={!editing}
            rows={3}
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>

        <div>
          <label className="block text-sm text-slate-400 mb-1">Trading Style</label>
          <select
            value={formData.trading_style}
            onChange={(e) => setFormData({...formData, trading_style: e.target.value})}
            disabled={!editing}
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="">Select style</option>
            <option value="scalper">Scalper</option>
            <option value="day_trader">Day Trader</option>
            <option value="swing_trader">Swing Trader</option>
            <option value="position_trader">Position Trader</option>
          </select>
        </div>

        <div className="flex items-center gap-6 pt-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_public}
              onChange={(e) => setFormData({...formData, is_public: e.target.checked})}
              disabled={!editing}
              className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-cyan-600 focus:ring-cyan-500"
            />
            <span className="text-white">Public Profile</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.show_trades}
              onChange={(e) => setFormData({...formData, show_trades: e.target.checked})}
              disabled={!editing}
              className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-cyan-600 focus:ring-cyan-500"
            />
            <span className="text-white">Show My Trades</span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default SocialNetworkDashboard;
