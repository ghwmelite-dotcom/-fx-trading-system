import { motion } from 'framer-motion';
import { Trophy, Target, Zap, Award, TrendingUp, Calendar, Flame, Star, CheckCircle } from 'lucide-react';

const GamificationSection = ({ onLoginClick }) => {
  const milestones = [
    {
      day: 'Day 1',
      title: 'First Steps',
      description: 'Create account, log first trade',
      icon: Target,
      color: 'blue',
      gradient: 'from-blue-500 to-cyan-500',
      unlocks: ['Trade Journal', 'Basic Analytics'],
      badge: '🎯'
    },
    {
      day: 'Week 1',
      title: 'Building Habits',
      description: 'Log 10+ trades, track emotions',
      icon: Calendar,
      color: 'purple',
      gradient: 'from-purple-500 to-pink-500',
      unlocks: ['Emotion Tracking', 'Pattern Analysis'],
      badge: '📊'
    },
    {
      day: 'Month 1',
      title: 'Gaining Momentum',
      description: '50+ trades, AI insights activated',
      icon: Zap,
      color: 'orange',
      gradient: 'from-orange-500 to-red-500',
      unlocks: ['AI Psychology Coach', 'Advanced Metrics'],
      badge: '🧠'
    },
    {
      day: 'Month 3',
      title: 'Trading Master',
      description: '200+ trades, consistent improvement',
      icon: Trophy,
      color: 'yellow',
      gradient: 'from-yellow-500 to-orange-500',
      unlocks: ['Custom Reports', 'Priority Support'],
      badge: '🏆'
    }
  ];

  const achievements = [
    { icon: Flame, title: '30-Day Streak', description: 'Log trades for 30 consecutive days', color: 'orange', rarity: 'Rare' },
    { icon: Star, title: 'Win Rate Champion', description: 'Achieve 70%+ win rate for a month', color: 'yellow', rarity: 'Epic' },
    { icon: TrendingUp, title: 'Profit Master', description: 'Make $10,000+ in a single month', color: 'green', rarity: 'Legendary' },
    { icon: Award, title: 'Psychology Pro', description: 'Complete 50 AI coaching sessions', color: 'purple', rarity: 'Rare' },
    { icon: Target, title: 'Risk Manager', description: 'Maintain max drawdown under 5%', color: 'blue', rarity: 'Epic' },
    { icon: Zap, title: 'Quick Learner', description: 'Improve win rate by 20% in 60 days', color: 'cyan', rarity: 'Legendary' }
  ];

  const getRarityColor = (rarity) => {
    const colors = {
      'Rare': 'text-blue-400 bg-blue-500/10 border-blue-500/30',
      'Epic': 'text-purple-400 bg-purple-500/10 border-purple-500/30',
      'Legendary': 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30'
    };
    return colors[rarity] || colors['Rare'];
  };

  return (
    <div className="relative py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center space-y-5 mb-16"
        >
          <div className="inline-block px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-yellow-300 text-sm font-semibold mb-4">
            GAMIFICATION
          </div>
          <h2 className="text-5xl sm:text-6xl font-bold text-white">
            Your Trading
            <br />
            <span className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
              Journey
            </span>
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Level up your skills with achievements, streaks, and progressive feature unlocks
          </p>
        </motion.div>

        {/* Timeline */}
        <div className="mb-20">
          <h3 className="text-2xl font-bold text-white mb-8 text-center">Progression Roadmap</h3>
          <div className="relative">
            {/* Timeline Line */}
            <div className="hidden lg:block absolute top-24 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 via-orange-500 to-yellow-500 rounded-full"></div>

            {/* Milestones */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4">
              {milestones.map((milestone, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.15 }}
                  className="relative group"
                >
                  {/* Card */}
                  <div className="relative">
                    <div className={`absolute -inset-1 bg-gradient-to-r ${milestone.gradient} rounded-2xl blur opacity-0 group-hover:opacity-50 transition-opacity`}></div>
                    <div className="relative bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-2 border-white/10 rounded-2xl p-6 backdrop-blur-xl hover:border-white/20 transition-all">
                      {/* Badge */}
                      <div className="text-5xl mb-4 text-center">{milestone.badge}</div>

                      {/* Icon */}
                      <div className={`mb-4 mx-auto w-16 h-16 bg-gradient-to-br ${milestone.gradient} rounded-xl flex items-center justify-center shadow-xl`}>
                        <milestone.icon className="text-white" size={28} />
                      </div>

                      {/* Day */}
                      <div className={`inline-block px-3 py-1 bg-gradient-to-r ${milestone.gradient} bg-opacity-20 border border-white/20 rounded-full text-white text-xs font-bold mb-3`}>
                        {milestone.day}
                      </div>

                      {/* Title */}
                      <h4 className="text-xl font-bold text-white mb-2">{milestone.title}</h4>
                      <p className="text-slate-400 text-sm mb-4">{milestone.description}</p>

                      {/* Unlocks */}
                      <div className="space-y-2">
                        <div className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Unlocks:</div>
                        {milestone.unlocks.map((unlock, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <CheckCircle className={`text-${milestone.color}-400`} size={14} />
                            <span className="text-slate-300">{unlock}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Achievements Grid */}
        <div>
          <h3 className="text-2xl font-bold text-white mb-8 text-center flex items-center justify-center gap-3">
            <Trophy className="text-yellow-400" size={28} />
            Achievement System
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {achievements.map((achievement, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ scale: 1.02 }}
                className="relative group cursor-pointer"
              >
                <div className={`absolute -inset-0.5 bg-gradient-to-r from-${achievement.color}-500 to-${achievement.color}-600 rounded-2xl blur opacity-0 group-hover:opacity-50 transition-opacity`}></div>
                <div className="relative bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-2 border-white/10 rounded-2xl p-6 backdrop-blur-xl hover:border-white/20 transition-all">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 bg-${achievement.color}-500/10 border border-${achievement.color}-500/20 rounded-xl`}>
                      <achievement.icon className={`text-${achievement.color}-400`} size={24} />
                    </div>
                    <div className={`px-3 py-1 ${getRarityColor(achievement.rarity)} border rounded-full text-xs font-bold`}>
                      {achievement.rarity}
                    </div>
                  </div>

                  {/* Content */}
                  <h4 className="text-lg font-bold text-white mb-2">{achievement.title}</h4>
                  <p className="text-slate-400 text-sm">{achievement.description}</p>

                  {/* Progress Bar (example) */}
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="flex justify-between text-xs text-slate-400 mb-2">
                      <span>Progress</span>
                      <span>0%</span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className={`h-full bg-gradient-to-r from-${achievement.color}-500 to-${achievement.color}-600 rounded-full w-0`}></div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Streak Counter Example */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 max-w-2xl mx-auto"
        >
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-3xl blur-xl opacity-50 animate-pulse-slow"></div>
            <div className="relative bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-2 border-white/10 rounded-3xl p-8 backdrop-blur-xl text-center">
              <Flame className="text-orange-400 mx-auto mb-4 animate-bounce" size={48} />
              <h3 className="text-3xl font-bold text-white mb-2">Current Streak</h3>
              <div className="text-7xl font-extrabold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent mb-4">
                15 Days
              </div>
              <p className="text-slate-300 mb-6">Keep logging trades daily to maintain your streak!</p>
              <button
                onClick={onLoginClick}
                className="px-8 py-4 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white rounded-xl font-bold shadow-2xl shadow-orange-500/50 hover:shadow-orange-500/70 transition-all hover:scale-105"
              >
                Log Today's Trade
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      <style jsx>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.75; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default GamificationSection;
