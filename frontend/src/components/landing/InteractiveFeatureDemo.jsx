import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, BookOpen, BarChart3, Target, Activity, Shield, CheckCircle, Sparkles } from 'lucide-react';

const InteractiveFeatureDemo = ({ onLoginClick }) => {
  const [activeTab, setActiveTab] = useState(0);

  const features = [
    {
      id: 'ai-coach',
      icon: Brain,
      title: 'AI Psychology Coach',
      color: 'purple',
      gradient: 'from-purple-600 to-violet-600',
      description: 'Advanced AI analyzes your trading patterns, emotions, and decision-making to provide personalized coaching.',
      benefits: [
        'Emotional pattern recognition',
        'Personalized improvement plans',
        'Real-time psychology insights',
        'Behavioral analysis'
      ],
      preview: {
        title: 'Psychology Analysis',
        metric: 'Emotional Discipline Score',
        value: '8.5/10',
        trend: '+15%',
        insight: 'Your patience during drawdowns has improved significantly'
      }
    },
    {
      id: 'journal',
      icon: BookOpen,
      title: 'Smart Trade Journal',
      color: 'blue',
      gradient: 'from-blue-600 to-cyan-600',
      description: 'Comprehensive trade logging with emotions, screenshots, tags, and detailed notes for every position.',
      benefits: [
        'Screenshot attachments',
        'Emotion tracking',
        'Custom tags & ratings',
        'Rich text notes'
      ],
      preview: {
        title: 'Latest Journal Entry',
        metric: 'EUR/USD Long',
        value: '+$450',
        trend: '+2.5R',
        insight: 'Followed plan perfectly. Entry was patient and disciplined.'
      }
    },
    {
      id: 'analytics',
      icon: BarChart3,
      title: 'Advanced Analytics',
      color: 'cyan',
      gradient: 'from-cyan-600 to-teal-600',
      description: 'Multi-dimensional performance analysis across pairs, strategies, timeframes, and more.',
      benefits: [
        'Win rate by pair',
        'Strategy comparison',
        'Time-of-day analysis',
        'Risk metrics'
      ],
      preview: {
        title: 'Performance Overview',
        metric: 'Sharpe Ratio',
        value: '2.8',
        trend: 'Excellent',
        insight: 'Risk-adjusted returns are in the top 10% of traders'
      }
    },
    {
      id: 'risk',
      icon: Target,
      title: 'Risk Management',
      color: 'green',
      gradient: 'from-green-600 to-emerald-600',
      description: 'Real-time risk monitoring with alerts, drawdown tracking, and position size calculations.',
      benefits: [
        'Daily loss limits',
        'Position size calculator',
        'Drawdown alerts',
        'Risk/reward tracking'
      ],
      preview: {
        title: 'Risk Status',
        metric: 'Max Drawdown',
        value: '8.2%',
        trend: 'Safe',
        insight: 'Well within acceptable range. Keep up the good work!'
      }
    },
    {
      id: 'mt4',
      icon: Activity,
      title: 'MT4/MT5 Integration',
      color: 'orange',
      gradient: 'from-orange-600 to-red-600',
      description: 'Automatic trade capture via webhook. Your trades sync in real-time without manual entry.',
      benefits: [
        'Real-time sync',
        'Zero manual entry',
        'Multi-account support',
        'Trade validation'
      ],
      preview: {
        title: 'Auto-Sync Status',
        metric: 'Trades Synced',
        value: '247',
        trend: 'Active',
        insight: 'All MT5 accounts connected and syncing perfectly'
      }
    },
    {
      id: 'security',
      icon: Shield,
      title: 'Enterprise Security',
      color: 'pink',
      gradient: 'from-pink-600 to-rose-600',
      description: 'Bank-level encryption, role-based access control, audit logs, and secure authentication.',
      benefits: [
        'AES-256 encryption',
        'Two-factor auth',
        'Audit logging',
        'GDPR compliant'
      ],
      preview: {
        title: 'Security Status',
        metric: 'Protection Level',
        value: 'Maximum',
        trend: 'Active',
        insight: 'All security features enabled and operational'
      }
    }
  ];

  const currentFeature = features[activeTab];

  const getColorClasses = (color) => {
    const classes = {
      purple: { text: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30', glow: 'purple-500/50' },
      blue: { text: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', glow: 'blue-500/50' },
      cyan: { text: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', glow: 'cyan-500/50' },
      green: { text: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30', glow: 'green-500/50' },
      orange: { text: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', glow: 'orange-500/50' },
      pink: { text: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/30', glow: 'pink-500/50' }
    };
    return classes[color] || classes.purple;
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
          <div className="inline-block px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-300 text-sm font-semibold mb-4">
            INTERACTIVE DEMO
          </div>
          <h2 className="text-5xl sm:text-6xl font-bold text-white">
            See It In
            <br />
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Action
            </span>
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Explore our powerful features with interactive previews
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const isActive = activeTab === index;
            const colors = getColorClasses(feature.color);

            return (
              <motion.button
                key={feature.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab(index)}
                className={`relative group px-6 py-3 rounded-xl font-semibold transition-all ${
                  isActive
                    ? `${colors.bg} border-2 ${colors.border} ${colors.text}`
                    : 'bg-white/5 border-2 border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className={`absolute -inset-1 bg-gradient-to-r ${feature.gradient} rounded-xl blur opacity-50`}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  />
                )}
                <div className="relative flex items-center gap-2">
                  <Icon size={20} />
                  <span className="hidden sm:inline">{feature.title}</span>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="grid lg:grid-cols-2 gap-12 items-center"
          >
            {/* Left: Description */}
            <div className="space-y-8">
              <div>
                <div className={`inline-flex items-center gap-3 mb-4`}>
                  <div className={`p-3 ${getColorClasses(currentFeature.color).bg} border ${getColorClasses(currentFeature.color).border} rounded-xl`}>
                    <currentFeature.icon className={getColorClasses(currentFeature.color).text} size={32} />
                  </div>
                  <h3 className="text-3xl font-bold text-white">{currentFeature.title}</h3>
                </div>
                <p className="text-lg text-slate-300 leading-relaxed">
                  {currentFeature.description}
                </p>
              </div>

              {/* Benefits */}
              <div className="space-y-3">
                {currentFeature.benefits.map((benefit, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-xl hover:border-white/20 transition-colors"
                  >
                    <CheckCircle className={getColorClasses(currentFeature.color).text} size={20} />
                    <span className="text-slate-200 font-medium">{benefit}</span>
                  </motion.div>
                ))}
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onLoginClick}
                className={`px-8 py-4 bg-gradient-to-r ${currentFeature.gradient} hover:opacity-90 text-white rounded-xl font-bold text-lg shadow-2xl transition-all flex items-center gap-3 group`}
              >
                <Sparkles size={20} />
                Try It Now
                <motion.span
                  animate={{ x: [0, 5, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  →
                </motion.span>
              </motion.button>
            </div>

            {/* Right: Interactive Preview */}
            <div className="relative">
              <div className={`absolute -inset-1 bg-gradient-to-r ${currentFeature.gradient} rounded-3xl blur-xl opacity-50`}></div>
              <div className="relative bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-2 border-white/10 rounded-3xl p-8 backdrop-blur-xl">
                {/* Preview Header */}
                <div className="flex items-center justify-between mb-6 pb-6 border-b border-white/10">
                  <h4 className="text-xl font-bold text-white">{currentFeature.preview.title}</h4>
                  <currentFeature.icon className={getColorClasses(currentFeature.color).text} size={24} />
                </div>

                {/* Main Metric */}
                <div className="space-y-6 mb-8">
                  <div>
                    <div className="text-sm text-slate-400 mb-2">{currentFeature.preview.metric}</div>
                    <div className="flex items-baseline gap-3">
                      <div className={`text-5xl font-bold ${getColorClasses(currentFeature.color).text}`}>
                        {currentFeature.preview.value}
                      </div>
                      <div className="px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 text-sm font-bold">
                        {currentFeature.preview.trend}
                      </div>
                    </div>
                  </div>

                  {/* Insight */}
                  <div className={`p-4 ${getColorClasses(currentFeature.color).bg} border ${getColorClasses(currentFeature.color).border} rounded-xl`}>
                    <div className="flex items-start gap-3">
                      <Sparkles className={getColorClasses(currentFeature.color).text} size={20} />
                      <p className="text-slate-200 text-sm leading-relaxed">
                        {currentFeature.preview.insight}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Animated Progress Bars */}
                <div className="space-y-4">
                  {[
                    { label: 'Performance', value: 85 },
                    { label: 'Consistency', value: 72 },
                    { label: 'Risk Control', value: 91 }
                  ].map((stat, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">{stat.label}</span>
                        <span className="text-white font-bold">{stat.value}%</span>
                      </div>
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${stat.value}%` }}
                          transition={{ delay: idx * 0.2, duration: 1, ease: 'easeOut' }}
                          className={`h-full bg-gradient-to-r ${currentFeature.gradient} rounded-full`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default InteractiveFeatureDemo;
