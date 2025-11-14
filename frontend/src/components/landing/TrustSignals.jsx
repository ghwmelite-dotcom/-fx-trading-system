import { motion } from 'framer-motion';
import { Shield, Lock, CheckCircle, Activity, Users, Server, Globe } from 'lucide-react';

const TrustSignals = () => {
  const badges = [
    { label: 'SOC 2 Compliant', icon: Shield },
    { label: 'GDPR Ready', icon: Lock },
    { label: 'AES-256 Encrypted', icon: Shield },
    { label: '99.9% Uptime', icon: Activity }
  ];

  const integrations = [
    { name: 'MetaTrader 4', logo: '📊', status: 'Active' },
    { name: 'MetaTrader 5', logo: '📈', status: 'Active' },
    { name: 'TradingView', logo: '📉', status: 'Coming Soon' },
    { name: 'cTrader', logo: '💹', status: 'Coming Soon' }
  ];

  const stats = [
    { icon: Users, value: '500+', label: 'Active Traders', color: 'purple' },
    { icon: Activity, value: '99.9%', label: 'Uptime SLA', color: 'green' },
    { icon: Server, value: '24/7', label: 'Monitoring', color: 'blue' },
    { icon: Globe, value: '50+', label: 'Countries', color: 'cyan' }
  ];

  return (
    <div className="relative py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <p className="text-center text-slate-400 text-sm font-semibold uppercase tracking-wide mb-6">
            Trusted & Secure
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8">
            {badges.map((badge, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/10 rounded-xl hover:border-green-500/30 hover:bg-green-500/5 transition-all backdrop-blur-sm group"
              >
                <badge.icon className="text-green-400 group-hover:scale-110 transition-transform" size={20} />
                <span className="text-slate-300 font-semibold text-sm">{badge.label}</span>
                <CheckCircle className="text-green-400 ml-1" size={16} />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Integrations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <p className="text-center text-slate-400 text-sm font-semibold uppercase tracking-wide mb-6">
            Integrations
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {integrations.map((integration, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ scale: 1.03 }}
                className="relative group"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl blur opacity-0 group-hover:opacity-50 transition-opacity"></div>
                <div className="relative bg-white/5 border border-white/10 rounded-xl p-6 text-center hover:border-white/20 transition-all backdrop-blur-sm">
                  <div className="text-4xl mb-3">{integration.logo}</div>
                  <h4 className="font-bold text-white text-sm mb-1">{integration.name}</h4>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    integration.status === 'Active'
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                  }`}>
                    {integration.status}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Live Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <p className="text-center text-slate-400 text-sm font-semibold uppercase tracking-wide mb-6">
            Platform Status
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -5 }}
                className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border border-white/10 rounded-xl p-6 text-center hover:border-white/20 transition-all backdrop-blur-sm"
              >
                <stat.icon className={`text-${stat.color}-400 mx-auto mb-3`} size={32} />
                <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-sm text-slate-400">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Featured In (Placeholder) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <p className="text-center text-slate-400 text-sm font-semibold uppercase tracking-wide mb-6">
            As Featured In
          </p>
          <div className="flex flex-wrap justify-center items-center gap-12 opacity-60 grayscale hover:opacity-80 hover:grayscale-0 transition-all">
            {['TechCrunch', 'Forbes', 'Bloomberg', 'WSJ'].map((publication, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 0.6 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ opacity: 1, scale: 1.1 }}
                className="text-slate-500 font-bold text-2xl"
              >
                {publication}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Uptime Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12"
        >
          <div className="max-w-2xl mx-auto">
            <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-white font-semibold">All Systems Operational</span>
                </div>
                <span className="text-sm text-slate-400">Last checked: 1 min ago</span>
              </div>

              {/* Uptime bars (last 30 days) */}
              <div className="flex gap-1 h-12 items-end">
                {Array.from({ length: 30 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="flex-1 bg-green-500 rounded-t hover:bg-green-400 transition-colors cursor-pointer"
                    style={{ height: `${Math.random() * 20 + 80}%` }}
                    title={`Day ${idx + 1}: 99.9% uptime`}
                  />
                ))}
              </div>
              <div className="flex justify-between text-xs text-slate-500 mt-2">
                <span>30 days ago</span>
                <span>Today</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TrustSignals;
