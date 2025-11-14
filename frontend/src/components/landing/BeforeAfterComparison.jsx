import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Check, AlertCircle, TrendingUp, Sparkles } from 'lucide-react';

const BeforeAfterComparison = ({ onLoginClick }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const container = e.currentTarget.getBoundingClientRect();
    const position = ((e.clientX - container.left) / container.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, position)));
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const container = e.currentTarget.getBoundingClientRect();
    const touch = e.touches[0];
    const position = ((touch.clientX - container.left) / container.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, position)));
  };

  const problems = [
    { text: 'Emotional trading decisions', icon: AlertCircle },
    { text: 'No performance tracking', icon: AlertCircle },
    { text: 'Manual trade logging', icon: AlertCircle },
    { text: 'Unclear patterns & mistakes', icon: AlertCircle },
    { text: 'Repeating same errors', icon: AlertCircle },
    { text: 'Poor risk management', icon: AlertCircle }
  ];

  const solutions = [
    { text: 'AI-powered psychology coaching', icon: Check },
    { text: 'Advanced analytics dashboard', icon: Check },
    { text: 'Automatic MT4/MT5 sync', icon: Check },
    { text: 'Clear insights & patterns', icon: Check },
    { text: 'Behavioral improvement plans', icon: Check },
    { text: 'Real-time risk monitoring', icon: Check }
  ];

  return (
    <div className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center space-y-5 mb-16"
        >
          <div className="inline-block px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-300 text-sm font-semibold mb-4">
            THE TRANSFORMATION
          </div>
          <h2 className="text-5xl sm:text-6xl font-bold text-white">
            Before vs
            <br />
            <span className="bg-gradient-to-r from-red-400 via-purple-400 to-green-400 bg-clip-text text-transparent">
              After TradeMetrics
            </span>
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            See how TradeMetrics transforms your trading journey
          </p>
        </motion.div>

        {/* Interactive Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative"
        >
          {/* Comparison Container */}
          <div
            className="relative h-[600px] rounded-3xl overflow-hidden cursor-ew-resize select-none"
            onMouseMove={handleMouseMove}
            onTouchMove={handleTouchMove}
            onMouseDown={() => setIsDragging(true)}
            onTouchStart={() => setIsDragging(true)}
            onMouseUp={() => setIsDragging(false)}
            onTouchEnd={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
          >
            {/* BEFORE (Left Side - Red Tint) */}
            <div className="absolute inset-0 bg-gradient-to-br from-red-950/90 via-slate-900/90 to-slate-800/90">
              <div className="h-full flex flex-col p-8 md:p-12">
                {/* Label */}
                <div className="inline-flex items-center gap-2 px-5 py-2 bg-red-500/20 border border-red-500/30 rounded-full text-red-300 font-bold text-lg mb-8 self-start">
                  <X size={20} />
                  Without TradeMetrics
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col justify-center space-y-6 max-w-md">
                  <h3 className="text-3xl font-bold text-white mb-4">The Struggle</h3>
                  {problems.map((problem, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-center gap-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl backdrop-blur-sm"
                    >
                      <div className="w-10 h-10 bg-red-500/20 border border-red-500/30 rounded-full flex items-center justify-center flex-shrink-0">
                        <X className="text-red-400" size={20} />
                      </div>
                      <span className="text-slate-300 font-medium">{problem.text}</span>
                    </motion.div>
                  ))}

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-red-500/20">
                    <div className="text-center p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                      <div className="text-3xl font-bold text-red-400 mb-1">45%</div>
                      <div className="text-sm text-slate-400">Win Rate</div>
                    </div>
                    <div className="text-center p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                      <div className="text-3xl font-bold text-red-400 mb-1">-8%</div>
                      <div className="text-sm text-slate-400">Monthly Return</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* AFTER (Right Side - Green Glow) */}
            <div
              className="absolute inset-0 bg-gradient-to-br from-green-950/90 via-slate-900/90 to-slate-800/90"
              style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
            >
              <div className="h-full flex flex-col p-8 md:p-12">
                {/* Label */}
                <div className="inline-flex items-center gap-2 px-5 py-2 bg-green-500/20 border border-green-500/30 rounded-full text-green-300 font-bold text-lg mb-8 self-start">
                  <Check size={20} />
                  With TradeMetrics
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col justify-center space-y-6 max-w-md">
                  <h3 className="text-3xl font-bold text-white mb-4 flex items-center gap-3">
                    The Solution
                    <Sparkles className="text-green-400" size={28} />
                  </h3>
                  {solutions.map((solution, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-center gap-4 p-4 bg-green-500/10 border border-green-500/20 rounded-xl backdrop-blur-sm"
                    >
                      <div className="w-10 h-10 bg-green-500/20 border border-green-500/30 rounded-full flex items-center justify-center flex-shrink-0">
                        <Check className="text-green-400" size={20} />
                      </div>
                      <span className="text-slate-100 font-medium">{solution.text}</span>
                    </motion.div>
                  ))}

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-green-500/20">
                    <div className="text-center p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                      <div className="text-3xl font-bold text-green-400 mb-1">68%</div>
                      <div className="text-sm text-slate-400">Win Rate</div>
                      <div className="text-xs text-green-400 font-semibold mt-1">+23% ↑</div>
                    </div>
                    <div className="text-center p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                      <div className="text-3xl font-bold text-green-400 mb-1">+18%</div>
                      <div className="text-sm text-slate-400">Monthly Return</div>
                      <div className="text-xs text-green-400 font-semibold mt-1">+26% ↑</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Slider Handle */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-white/20 backdrop-blur-sm"
              style={{ left: `${sliderPosition}%` }}
            >
              {/* Handle Circle */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white rounded-full shadow-2xl flex items-center justify-center cursor-ew-resize border-4 border-slate-900">
                <div className="flex gap-1">
                  <div className="w-1 h-6 bg-slate-400 rounded-full"></div>
                  <div className="w-1 h-6 bg-slate-400 rounded-full"></div>
                </div>
              </div>

              {/* Top Label */}
              <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-white rounded-full shadow-lg">
                <span className="text-slate-900 font-bold text-sm whitespace-nowrap">Drag to compare</span>
              </div>
            </div>
          </div>

          {/* CTA Below */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 text-center"
          >
            <p className="text-slate-300 mb-6 text-lg">
              Ready to transform your trading performance?
            </p>
            <button
              onClick={onLoginClick}
              className="px-10 py-5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-2xl font-bold text-lg shadow-2xl shadow-green-500/50 hover:shadow-green-500/70 transition-all hover:scale-105 flex items-center gap-3 mx-auto group"
            >
              <TrendingUp size={22} />
              Start Your Transformation
              <motion.span
                animate={{ x: [0, 5, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                →
              </motion.span>
            </button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default BeforeAfterComparison;
