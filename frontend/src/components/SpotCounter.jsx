import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, Clock, Flame, Award } from 'lucide-react';

const SpotCounter = ({ onWaitlistClick, onApplyClick }) => {
  const [stats, setStats] = useState(null);
  const [mode, setMode] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    // Update every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      // Fetch both stats and mode
      const [statsResponse, modeResponse] = await Promise.all([
        fetch('https://fx-dashboard-api.ghwmelite.workers.dev/api/platform/stats'),
        fetch('https://fx-dashboard-api.ghwmelite.workers.dev/api/platform/mode')
      ]);

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      if (modeResponse.ok) {
        const modeData = await modeResponse.json();
        setMode(modeData);
      }
    } catch (error) {
      console.error('Error fetching platform data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-violet-600/20 to-purple-600/20 border border-violet-500/30 rounded-2xl p-8 backdrop-blur-xl animate-pulse">
        <div className="h-32 bg-violet-500/10 rounded"></div>
      </div>
    );
  }

  if (!stats) return null;

  const percentage = Math.round((stats.spots_taken / stats.max_users) * 100);
  const isAlmostFull = percentage >= 80;
  const isFull = stats.is_full;

  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${
      isFull
        ? 'from-red-600/20 to-rose-600/20 border-red-500/30'
        : isAlmostFull
        ? 'from-amber-600/20 to-orange-600/20 border-amber-500/30'
        : 'from-violet-600/20 to-purple-600/20 border-violet-500/30'
    } border rounded-2xl p-8 backdrop-blur-xl shadow-2xl transition-all duration-500`}>
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {isFull ? (
              <>
                <div className="p-3 bg-red-500/20 rounded-lg">
                  <Clock className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Access Closed</h3>
                  <p className="text-red-300 text-sm">All spots claimed</p>
                </div>
              </>
            ) : mode?.curated_mode ? (
              <>
                <div className="p-3 bg-amber-500/20 rounded-lg">
                  <Award className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Founding Member Applications</h3>
                  <p className="text-amber-300 text-sm">Curated access • {mode.founding_spots_remaining || 0} of 25 spots left</p>
                </div>
              </>
            ) : isAlmostFull ? (
              <>
                <div className="p-3 bg-amber-500/20 rounded-lg animate-pulse">
                  <Flame className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Limited Beta Access</h3>
                  <p className="text-amber-300 text-sm">Filling up fast!</p>
                </div>
              </>
            ) : (
              <>
                <div className="p-3 bg-violet-500/20 rounded-lg">
                  <Users className="w-6 h-6 text-violet-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Exclusive Beta Access</h3>
                  <p className="text-violet-300 text-sm">Limited to 100 traders</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-end mb-2">
            <span className="text-3xl font-bold text-white">
              {stats.spots_taken} / {stats.max_users}
            </span>
            <span className={`text-lg font-semibold ${
              isFull
                ? 'text-red-300'
                : isAlmostFull
                ? 'text-amber-300'
                : 'text-violet-300'
            }`}>
              {isFull ? 'Full' : `${stats.spots_remaining} left`}
            </span>
          </div>
          <div className="w-full bg-slate-800/50 rounded-full h-4 overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ease-out ${
                isFull
                  ? 'bg-gradient-to-r from-red-600 to-rose-600'
                  : isAlmostFull
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 animate-pulse'
                  : 'bg-gradient-to-r from-violet-600 to-purple-600'
              }`}
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {percentage}% claimed
          </p>
        </div>

        {/* Benefits */}
        {!isFull && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-white mb-1">
                {stats.spots_taken <= 25 ? '🏆' : stats.spots_taken <= 75 ? '⭐' : '🎯'}
              </div>
              <p className="text-xs text-gray-300">
                {stats.spots_taken <= 25 ? 'Lifetime Free' : stats.spots_taken <= 75 ? '50% Off' : '1 Year Free'}
              </p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-1">✨</div>
              <p className="text-xs text-gray-300">Early Access</p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-1">🎁</div>
              <p className="text-xs text-gray-300">
                {stats.spots_taken <= 25 ? '5' : stats.spots_taken <= 75 ? '3' : '2'} Invites
              </p>
            </div>
          </div>
        )}

        {/* Waitlist Info & Button */}
        {isFull && (
          <div className="space-y-4">
            {stats.waitlist_size > 0 && (
              <div className="bg-slate-900/50 rounded-lg p-4 flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-violet-400" />
                <div>
                  <p className="text-white font-semibold">
                    {stats.waitlist_size.toLocaleString()} traders waiting
                  </p>
                  <p className="text-gray-400 text-xs">Join the waitlist to be notified when spots open</p>
                </div>
              </div>
            )}
            {onWaitlistClick && (
              <button
                onClick={onWaitlistClick}
                className="w-full px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white rounded-lg font-bold transition-all hover:scale-105 shadow-lg"
              >
                Join Waitlist
              </button>
            )}
          </div>
        )}

        {/* Curated Mode - Apply Button */}
        {!isFull && mode?.curated_mode && onApplyClick && (
          <div className="space-y-3">
            <button
              onClick={onApplyClick}
              className="w-full px-6 py-4 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-lg font-bold text-lg transition-all hover:scale-105 shadow-lg flex items-center justify-center gap-2"
            >
              <Award className="w-5 h-5" />
              Apply for Founding Member
            </button>
            <p className="text-center text-xs text-gray-400">
              🏆 Lifetime Free Access • Hand-picked elite traders only
            </p>
          </div>
        )}

        {/* Automatic Mode - Register Button */}
        {!isFull && !mode?.curated_mode && (
          <div className="space-y-3">
            <a
              href="/register"
              className="block w-full px-6 py-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white rounded-lg font-bold text-lg transition-all hover:scale-105 shadow-lg text-center"
            >
              Register Now
            </a>
            <p className="text-center text-xs text-gray-400">
              {stats.spots_taken <= 75 ? '⭐ Early Adopter - 50% Off Forever' : '🎯 Beta Tester - Free for 1 Year'}
            </p>
          </div>
        )}

        {/* Urgency message */}
        {!isFull && isAlmostFull && !mode?.curated_mode && (
          <div className="mt-4 text-center">
            <p className="text-amber-300 text-sm font-medium animate-pulse">
              ⚡ Only {stats.spots_remaining} spots remaining! Register now before it's too late.
            </p>
          </div>
        )}
      </div>

      {/* Shimmer animation CSS */}
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 3s infinite;
        }
      `}</style>
    </div>
  );
};

export default SpotCounter;
