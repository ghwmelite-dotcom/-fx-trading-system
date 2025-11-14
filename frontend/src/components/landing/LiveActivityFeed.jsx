import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Award, Users, Target, Zap, Trophy } from 'lucide-react';

const LiveActivityFeed = () => {
  const activities = [
    { type: 'improvement', name: 'Sarah', location: 'London', metric: 'win rate', value: '+15%', icon: TrendingUp, color: 'green' },
    { type: 'trade', name: 'Michael', location: 'New York', metric: 'profit', value: '$2,450', icon: Target, color: 'blue' },
    { type: 'achievement', name: 'David', location: 'Singapore', metric: 'streak', value: '30 days', icon: Trophy, color: 'yellow' },
    { type: 'signup', name: 'Emma', location: 'Sydney', metric: 'joined', value: 'today', icon: Users, color: 'purple' },
    { type: 'improvement', name: 'James', location: 'Tokyo', metric: 'drawdown', value: '-8%', icon: Zap, color: 'cyan' },
    { type: 'trade', name: 'Lisa', location: 'Toronto', metric: 'trades', value: '100+', icon: Award, color: 'pink' },
    { type: 'achievement', name: 'Carlos', location: 'Madrid', metric: 'accuracy', value: '75%', icon: Trophy, color: 'orange' },
    { type: 'improvement', name: 'Nina', location: 'Berlin', metric: 'profit factor', value: '2.5x', icon: TrendingUp, color: 'green' },
    { type: 'signup', name: 'Alex', location: 'Paris', metric: 'joined', value: 'today', icon: Users, color: 'purple' },
    { type: 'trade', name: 'Ryan', location: 'Dubai', metric: 'win rate', value: '68%', icon: Target, color: 'blue' },
  ];

  const [visibleActivities, setVisibleActivities] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // Initialize with first 3 activities
    setVisibleActivities(activities.slice(0, 3));

    // Add new activity every 3 seconds
    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const nextIndex = (prev + 1) % activities.length;
        setVisibleActivities((current) => {
          const newActivities = [...current.slice(1), activities[nextIndex]];
          return newActivities;
        });
        return nextIndex;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getGradient = (color) => {
    const gradients = {
      green: 'from-green-500 to-emerald-500',
      blue: 'from-blue-500 to-cyan-500',
      yellow: 'from-yellow-500 to-orange-500',
      purple: 'from-purple-500 to-pink-500',
      cyan: 'from-cyan-500 to-teal-500',
      pink: 'from-pink-500 to-rose-500',
      orange: 'from-orange-500 to-red-500'
    };
    return gradients[color] || gradients.purple;
  };

  const getActivityText = (activity) => {
    const texts = {
      improvement: `improved ${activity.metric} by`,
      trade: `achieved`,
      achievement: `reached`,
      signup: `just joined`
    };
    return texts[activity.type] || 'updated';
  };

  return (
    <div className="relative py-12 px-4 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/5 to-transparent"></div>

      <div className="max-w-7xl mx-auto relative">
        {/* Section Label */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-300 text-sm font-semibold">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            Live Activity
          </div>
        </div>

        {/* Activity Cards */}
        <div className="relative">
          <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
            <AnimatePresence mode="popLayout">
              {visibleActivities.map((activity, index) => {
                const Icon = activity.icon;
                return (
                  <motion.div
                    key={`${activity.name}-${activity.location}-${index}`}
                    initial={{ opacity: 0, y: -20, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.8 }}
                    transition={{ duration: 0.5 }}
                    className="relative group w-full md:w-auto"
                  >
                    <div className={`absolute -inset-0.5 bg-gradient-to-r ${getGradient(activity.color)} rounded-2xl blur opacity-30 group-hover:opacity-60 transition-opacity`}></div>
                    <div className="relative bg-slate-900/90 border border-white/10 rounded-2xl p-6 backdrop-blur-xl min-w-[320px]">
                      <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <div className={`relative flex-shrink-0 w-12 h-12 bg-gradient-to-br ${getGradient(activity.color)} rounded-full flex items-center justify-center shadow-lg`}>
                          <span className="text-white font-bold text-lg">
                            {activity.name[0]}
                          </span>
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-slate-900 rounded-full flex items-center justify-center">
                            <Icon size={12} className="text-white" />
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="font-bold text-white">{activity.name}</span>
                            <span className="text-slate-500 text-sm">from {activity.location}</span>
                          </div>
                          <div className="text-slate-300 text-sm mb-2">
                            {getActivityText(activity)}
                          </div>
                          <div className={`inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r ${getGradient(activity.color)} bg-opacity-20 border border-white/10 rounded-lg`}>
                            <Icon size={14} className="text-white" />
                            <span className="font-bold text-white">{activity.value}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Bottom Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <p className="text-slate-400 text-sm">
            Join <span className="text-purple-400 font-bold">500+ active traders</span> improving their performance daily
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default LiveActivityFeed;
