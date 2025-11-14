import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, Percent, BarChart3, Sparkles } from 'lucide-react';
import { useAnimatedNumber } from '../../hooks/useAnimatedNumber';

const ROICalculator = ({ onLoginClick }) => {
  const [winRate, setWinRate] = useState(50);
  const [monthlyTrades, setMonthlyTrades] = useState(100);
  const [avgTradeSize, setAvgTradeSize] = useState(100);

  // Calculate before and after values
  const calculations = useMemo(() => {
    const winRateImprovement = 0.15; // 15% improvement with AI coaching
    const avgWinAmount = avgTradeSize * 1.5; // 1.5 R/R ratio
    const avgLossAmount = avgTradeSize;

    // Before AI coaching
    const beforeWinRate = winRate / 100;
    const beforeWins = monthlyTrades * beforeWinRate;
    const beforeLosses = monthlyTrades * (1 - beforeWinRate);
    const beforeProfit = (beforeWins * avgWinAmount) - (beforeLosses * avgLossAmount);

    // After AI coaching (15% better win rate)
    const afterWinRate = Math.min(beforeWinRate + winRateImprovement, 0.95);
    const afterWins = monthlyTrades * afterWinRate;
    const afterLosses = monthlyTrades * (1 - afterWinRate);
    const afterProfit = (afterWins * avgWinAmount) - (afterLosses * avgLossAmount);

    const improvement = afterProfit - beforeProfit;
    const improvementPercent = beforeProfit > 0 ? ((improvement / beforeProfit) * 100) : 0;

    return {
      beforeProfit: Math.max(0, beforeProfit),
      afterProfit: Math.max(0, afterProfit),
      improvement: Math.max(0, improvement),
      improvementPercent,
      afterWinRate: afterWinRate * 100
    };
  }, [winRate, monthlyTrades, avgTradeSize]);

  // Animated values
  const animatedBefore = useAnimatedNumber(calculations.beforeProfit, 1000);
  const animatedAfter = useAnimatedNumber(calculations.afterProfit, 1000);
  const animatedImprovement = useAnimatedNumber(calculations.improvement, 1000);

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
          <div className="inline-block px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full text-green-300 text-sm font-semibold mb-4">
            ROI CALCULATOR
          </div>
          <h2 className="text-5xl sm:text-6xl font-bold text-white">
            Calculate Your
            <br />
            <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              Potential Gains
            </span>
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            See how AI coaching could improve your trading performance
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Controls */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-2 border-white/10 rounded-3xl p-8 backdrop-blur-xl">
              <h3 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                <BarChart3 className="text-purple-400" size={28} />
                Your Trading Stats
              </h3>

              {/* Win Rate Slider */}
              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center">
                  <label className="text-slate-300 font-semibold">Current Win Rate</label>
                  <span className="text-2xl font-bold text-purple-400">{winRate}%</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="70"
                  value={winRate}
                  onChange={(e) => setWinRate(Number(e.target.value))}
                  className="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-slate-500">
                  <span>30%</span>
                  <span>70%</span>
                </div>
              </div>

              {/* Monthly Trades Slider */}
              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center">
                  <label className="text-slate-300 font-semibold">Monthly Trades</label>
                  <span className="text-2xl font-bold text-blue-400">{monthlyTrades}</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="300"
                  step="10"
                  value={monthlyTrades}
                  onChange={(e) => setMonthlyTrades(Number(e.target.value))}
                  className="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-slate-500">
                  <span>20</span>
                  <span>300</span>
                </div>
              </div>

              {/* Average Trade Size Slider */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-slate-300 font-semibold">Avg Trade Size</label>
                  <span className="text-2xl font-bold text-green-400">${avgTradeSize}</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="500"
                  step="10"
                  value={avgTradeSize}
                  onChange={(e) => setAvgTradeSize(Number(e.target.value))}
                  className="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-slate-500">
                  <span>$50</span>
                  <span>$500</span>
                </div>
              </div>

              <div className="mt-8 p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                <p className="text-sm text-slate-300 flex items-start gap-2">
                  <Sparkles className="text-purple-400 flex-shrink-0 mt-0.5" size={16} />
                  <span>Based on +15% win rate improvement from AI psychology coaching</span>
                </p>
              </div>
            </div>
          </motion.div>

          {/* Results */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            {/* Before Card */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-slate-600 to-slate-500 rounded-3xl blur opacity-25"></div>
              <div className="relative bg-gradient-to-br from-slate-800/90 to-slate-700/90 border-2 border-slate-600/30 rounded-3xl p-8 backdrop-blur-xl">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-bold text-slate-300">Without AI Coaching</h4>
                  <TrendingUp className="text-slate-400" size={24} />
                </div>
                <div className="text-5xl font-bold text-white mb-2">
                  ${Math.floor(animatedBefore).toLocaleString()}
                </div>
                <div className="text-slate-400">Monthly Profit</div>
              </div>
            </div>

            {/* After Card */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-green-600 to-emerald-500 rounded-3xl blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
              <div className="relative bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-2 border-green-500/30 rounded-3xl p-8 backdrop-blur-xl">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-bold text-green-300">With AI Coaching</h4>
                  <Sparkles className="text-green-400" size={24} />
                </div>
                <div className="text-5xl font-bold text-white mb-2">
                  ${Math.floor(animatedAfter).toLocaleString()}
                </div>
                <div className="text-green-400 font-semibold">
                  Win Rate: {calculations.afterWinRate.toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Improvement Card */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-500 rounded-3xl blur opacity-50 group-hover:opacity-75 transition-opacity animate-pulse-slow"></div>
              <div className="relative bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-2 border-purple-500/30 rounded-3xl p-8 backdrop-blur-xl">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-bold text-purple-300">Additional Monthly Profit</h4>
                  <DollarSign className="text-purple-400" size={24} />
                </div>
                <div className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                  +${Math.floor(animatedImprovement).toLocaleString()}
                </div>
                <div className="text-purple-400 font-semibold">
                  {calculations.improvementPercent > 0 && (
                    <span>+{calculations.improvementPercent.toFixed(1)}% increase</span>
                  )}
                </div>
              </div>
            </div>

            {/* CTA */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onLoginClick}
              className="w-full px-8 py-5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-2xl font-bold text-lg shadow-2xl shadow-purple-500/50 hover:shadow-purple-500/70 transition-all flex items-center justify-center gap-3 group"
            >
              <Sparkles size={20} />
              Start Improving Today
              <TrendingUp className="group-hover:translate-x-1 transition-transform" size={20} />
            </motion.button>
          </motion.div>
        </div>
      </div>

      {/* Slider Styles */}
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%);
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(168, 85, 247, 0.5);
          transition: all 0.2s;
        }

        .slider::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 6px 20px rgba(168, 85, 247, 0.7);
        }

        .slider::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%);
          cursor: pointer;
          border: none;
          box-shadow: 0 4px 12px rgba(168, 85, 247, 0.5);
          transition: all 0.2s;
        }

        .slider::-moz-range-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 6px 20px rgba(168, 85, 247, 0.7);
        }

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

export default ROICalculator;
