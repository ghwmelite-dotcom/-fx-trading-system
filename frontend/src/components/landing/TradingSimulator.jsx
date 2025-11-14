import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, Target, BarChart3, Calendar, ArrowRight, Sparkles, Play } from 'lucide-react';

const TradingSimulator = ({ onLoginClick }) => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState(null);

  const demoTrades = [
    { id: 1, symbol: 'EUR/USD', type: 'Long', entry: 1.0850, exit: 1.0920, profit: 450, pips: 70, status: 'win', date: '2 hours ago' },
    { id: 2, symbol: 'GBP/JPY', type: 'Short', entry: 189.50, exit: 188.80, profit: 320, pips: 70, status: 'win', date: '5 hours ago' },
    { id: 3, symbol: 'USD/CAD', type: 'Long', entry: 1.3420, exit: 1.3395, profit: -180, pips: -25, status: 'loss', date: '1 day ago' },
    { id: 4, symbol: 'AUD/USD', type: 'Short', entry: 0.6650, exit: 0.6710, profit: -240, pips: -60, status: 'loss', date: '2 days ago' },
    { id: 5, symbol: 'XAU/USD', type: 'Long', entry: 2045.50, exit: 2067.80, profit: 890, pips: 223, status: 'win', date: '3 days ago' }
  ];

  const stats = {
    totalProfit: 1240,
    winRate: 68.4,
    totalTrades: 247,
    sharpeRatio: 2.8
  };

  const handleTradeClick = (trade) => {
    setSelectedTrade(selectedTrade?.id === trade.id ? null : trade);
  };

  const handleStartDemo = () => {
    setIsSimulating(true);
    setTimeout(() => setIsSimulating(false), 3000);
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
          <div className="inline-block px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-full text-orange-300 text-sm font-semibold mb-4">
            INTERACTIVE DEMO
          </div>
          <h2 className="text-5xl sm:text-6xl font-bold text-white">
            Try It
            <br />
            <span className="bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent">
              Right Now
            </span>
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Experience the dashboard with live demo data. No signup required.
          </p>
        </motion.div>

        {/* Demo Dashboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative"
        >
          {/* Glow */}
          <div className="absolute -inset-1 bg-gradient-to-r from-orange-600 via-pink-500 to-purple-600 rounded-3xl blur-xl opacity-50"></div>

          <div className="relative bg-gradient-to-br from-slate-900/95 to-slate-800/95 border-2 border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-xl">
            {/* Top Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-6 border-b border-white/10">
              <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-600 to-pink-600 rounded-lg flex items-center justify-center">
                  <BarChart3 className="text-white" size={20} />
                </div>
                Demo Dashboard
              </h3>
              <button
                onClick={handleStartDemo}
                disabled={isSimulating}
                className="px-6 py-3 bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700 text-white rounded-xl font-bold shadow-lg shadow-orange-500/50 hover:shadow-orange-500/70 transition-all hover:scale-105 flex items-center gap-2 disabled:opacity-50"
              >
                <Play size={18} />
                {isSimulating ? 'Simulating...' : 'Run Simulation'}
              </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Total Profit', value: `$${stats.totalProfit.toLocaleString()}`, icon: DollarSign, color: 'green', trend: '+23%' },
                { label: 'Win Rate', value: `${stats.winRate}%`, icon: Target, color: 'blue', trend: '+12%' },
                { label: 'Total Trades', value: stats.totalTrades, icon: BarChart3, color: 'purple', trend: 'This month' },
                { label: 'Sharpe Ratio', value: stats.sharpeRatio, icon: TrendingUp, color: 'orange', trend: 'Excellent' }
              ].map((stat, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: isSimulating ? 0.5 : 1, scale: isSimulating ? 0.95 : 1 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`relative group cursor-pointer`}
                >
                  <div className={`absolute -inset-0.5 bg-gradient-to-r from-${stat.color}-500 to-${stat.color}-600 rounded-xl blur opacity-0 group-hover:opacity-50 transition-opacity`}></div>
                  <div className="relative bg-white/5 border border-white/10 rounded-xl p-4 hover:border-white/20 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <stat.icon className={`text-${stat.color}-400`} size={20} />
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                    <div className="text-xs text-slate-400 uppercase tracking-wide mb-1">{stat.label}</div>
                    <div className={`text-xs text-${stat.color}-400 font-semibold`}>{stat.trend}</div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Recent Trades */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-bold text-white flex items-center gap-2">
                  <Calendar size={20} className="text-slate-400" />
                  Recent Trades
                </h4>
                <span className="text-sm text-slate-400">Click to view details</span>
              </div>

              <div className="space-y-2">
                {demoTrades.map((trade, idx) => (
                  <motion.div
                    key={trade.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    whileHover={{ scale: 1.01 }}
                    onClick={() => handleTradeClick(trade)}
                    className={`relative cursor-pointer ${selectedTrade?.id === trade.id ? 'ring-2 ring-purple-500' : ''}`}
                  >
                    <div className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-4 transition-all">
                      <div className="flex items-center justify-between gap-4">
                        {/* Left: Symbol & Type */}
                        <div className="flex items-center gap-3 flex-1">
                          <div className={`w-10 h-10 ${trade.status === 'win' ? 'bg-green-500/20 border-green-500/30' : 'bg-red-500/20 border-red-500/30'} border rounded-lg flex items-center justify-center`}>
                            {trade.status === 'win' ? (
                              <TrendingUp className="text-green-400" size={20} />
                            ) : (
                              <TrendingDown className="text-red-400" size={20} />
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-white">{trade.symbol}</div>
                            <div className="text-sm text-slate-400">{trade.type}</div>
                          </div>
                        </div>

                        {/* Middle: Entry/Exit */}
                        <div className="hidden md:flex items-center gap-2 text-sm">
                          <span className="text-slate-400">{trade.entry}</span>
                          <ArrowRight size={16} className="text-slate-600" />
                          <span className="text-slate-400">{trade.exit}</span>
                        </div>

                        {/* Right: Profit */}
                        <div className="text-right">
                          <div className={`text-lg font-bold ${trade.status === 'win' ? 'text-green-400' : 'text-red-400'}`}>
                            {trade.profit > 0 ? '+' : ''}${trade.profit}
                          </div>
                          <div className="text-sm text-slate-400">{trade.pips > 0 ? '+' : ''}{trade.pips} pips</div>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {selectedTrade?.id === trade.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 gap-3 text-sm"
                        >
                          <div>
                            <span className="text-slate-400">Entry:</span>
                            <span className="text-white font-semibold ml-2">{trade.entry}</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Exit:</span>
                            <span className="text-white font-semibold ml-2">{trade.exit}</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Type:</span>
                            <span className="text-white font-semibold ml-2">{trade.type}</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Time:</span>
                            <span className="text-white font-semibold ml-2">{trade.date}</span>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-8 pt-8 border-t border-white/10 text-center"
            >
              <p className="text-slate-300 mb-4 text-lg">Like what you see?</p>
              <button
                onClick={onLoginClick}
                className="px-10 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-bold text-lg shadow-2xl shadow-purple-500/50 hover:shadow-purple-500/70 transition-all hover:scale-105 flex items-center gap-3 mx-auto group"
              >
                <Sparkles size={20} />
                Start Trading Smarter
                <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
              </button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TradingSimulator;
