import { useEffect, useState } from 'react';
import { TrendingUp, DollarSign, BarChart3, Activity, Zap } from 'lucide-react';

const ForexLoader = ({ message = 'Loading...' }) => {
  const [progress, setProgress] = useState(0);
  const [candlesticks, setCandlesticks] = useState([]);
  const [currentPrice, setCurrentPrice] = useState(1.0850);
  const [loadingStage, setLoadingStage] = useState(0);
  const [fadeIn, setFadeIn] = useState(false);

  const loadingMessages = [
    'Connecting to market data...',
    'Loading analytics engine...',
    'Initializing trading platform...',
    'Preparing your dashboard...',
    'Almost ready...'
  ];

  useEffect(() => {
    // Fade in effect
    setTimeout(() => setFadeIn(true), 100);

    // Smooth progress animation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 1.5;
        if (next >= 100) return 100;

        // Update loading stage based on progress
        if (next > 80) setLoadingStage(4);
        else if (next > 60) setLoadingStage(3);
        else if (next > 40) setLoadingStage(2);
        else if (next > 20) setLoadingStage(1);

        return next;
      });
    }, 40);

    // Generate realistic candlesticks with trend
    const generateCandlesticks = () => {
      let basePrice = 1.08;
      return Array.from({ length: 20 }, (_, i) => {
        const trend = Math.sin(i / 4) * 0.002;
        const open = basePrice + trend;
        const volatility = 0.003 + Math.random() * 0.002;
        const close = open + (Math.random() - 0.48) * volatility;
        const high = Math.max(open, close) + Math.random() * volatility * 0.5;
        const low = Math.min(open, close) - Math.random() * volatility * 0.5;
        basePrice = close;
        return { open, close, high, low, isGreen: close > open };
      });
    };

    setCandlesticks(generateCandlesticks());

    // Smooth candlestick updates
    const candleInterval = setInterval(() => {
      setCandlesticks(prev => {
        const newCandles = [...prev];
        newCandles.shift();
        const lastCandle = newCandles[newCandles.length - 1];
        const open = lastCandle.close;
        const close = open + (Math.random() - 0.48) * 0.003;
        const high = Math.max(open, close) + Math.random() * 0.001;
        const low = Math.min(open, close) - Math.random() * 0.001;
        newCandles.push({ open, close, high, low, isGreen: close > open });
        return newCandles;
      });
    }, 800);

    // Realistic price ticker
    const priceInterval = setInterval(() => {
      setCurrentPrice((prev) => {
        const change = (Math.random() - 0.48) * 0.0003;
        return prev + change;
      });
    }, 80);

    return () => {
      clearInterval(progressInterval);
      clearInterval(candleInterval);
      clearInterval(priceInterval);
    };
  }, []);

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center relative overflow-hidden transition-opacity duration-700 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}>
      {/* Animated Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f12_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f12_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)] animate-grid-flow"></div>

      {/* Floating Currency Symbols - Enhanced */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {['$', '€', '¥', '£', '₿'].map((symbol, i) => (
          <div
            key={i}
            className="absolute text-purple-500/10 text-6xl font-bold animate-float-smooth"
            style={{
              left: `${15 + i * 18}%`,
              top: `${10 + (i % 3) * 25}%`,
              animationDelay: `${i * 0.3}s`,
              animationDuration: `${4 + i * 0.5}s`,
            }}
          >
            {symbol}
          </div>
        ))}
      </div>

      {/* Enhanced Animated Background Glows */}
      <div className="absolute w-[600px] h-[600px] bg-purple-500/20 rounded-full blur-3xl animate-glow-pulse"></div>
      <div className="absolute w-[500px] h-[500px] bg-blue-500/15 rounded-full blur-3xl animate-glow-pulse-delayed"></div>
      <div className="absolute w-[400px] h-[400px] bg-pink-500/10 rounded-full blur-3xl animate-glow-pulse" style={{ animationDelay: '2s' }}></div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center gap-6 px-4 animate-slide-up">
        {/* Enhanced Logo/Icon */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-blue-600 rounded-3xl blur-xl opacity-60 group-hover:opacity-80 transition-opacity duration-500"></div>
          <div className="relative w-28 h-28 bg-gradient-to-br from-purple-600 via-blue-600 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-purple-500/50 animate-logo-pulse backdrop-blur-sm border border-white/10">
            <TrendingUp className="text-white animate-logo-icon" size={54} />
          </div>
          <div className="absolute -top-3 -right-3 w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center animate-badge-bounce shadow-lg shadow-green-500/50">
            <Zap size={18} className="text-white" />
          </div>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-slate-900/80 backdrop-blur-sm border border-purple-500/30 rounded-full">
            <span className="text-purple-300 text-xs font-semibold">FX Trading Pro</span>
          </div>
        </div>

        {/* Enhanced Candlestick Chart */}
        <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 shadow-2xl hover:border-purple-500/30 transition-all duration-500">
          {/* Chart Header */}
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Activity className="text-purple-400 animate-pulse" size={18} />
              <span className="text-slate-300 text-sm font-semibold">EUR/USD</span>
              <span className="text-xs text-slate-500">• Live</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent tabular-nums">
                {currentPrice.toFixed(5)}
              </span>
              <div className="flex flex-col items-end">
                <TrendingUp className="text-green-400 animate-pulse" size={14} />
                <span className="text-xs text-green-400 font-medium">+0.15%</span>
              </div>
            </div>
          </div>

          {/* Candlestick Chart */}
          <div className="flex items-end justify-center gap-1.5 h-32 px-2">
            {candlesticks.map((candle, i) => {
              const bodyHeight = Math.abs(candle.close - candle.open) * 600;
              const wickTop = (candle.high - Math.max(candle.open, candle.close)) * 600;
              const wickBottom = (Math.min(candle.open, candle.close) - candle.low) * 600;

              return (
                <div
                  key={i}
                  className="flex flex-col items-center justify-end transition-all duration-700 ease-out hover:scale-110"
                  style={{
                    height: '100%',
                    opacity: 0.3 + (i / candlesticks.length) * 0.7
                  }}
                >
                  {/* Upper Wick */}
                  <div
                    className={`w-0.5 ${candle.isGreen ? 'bg-green-400/80' : 'bg-red-400/80'} transition-all duration-700`}
                    style={{ height: `${wickTop}px` }}
                  ></div>
                  {/* Body */}
                  <div
                    className={`w-3 ${
                      candle.isGreen
                        ? 'bg-gradient-to-t from-green-500 to-green-400 shadow-lg shadow-green-500/20'
                        : 'bg-gradient-to-t from-red-500 to-red-400 shadow-lg shadow-red-500/20'
                    } rounded-sm transition-all duration-700`}
                    style={{ height: `${Math.max(bodyHeight, 3)}px` }}
                  ></div>
                  {/* Lower Wick */}
                  <div
                    className={`w-0.5 ${candle.isGreen ? 'bg-green-400/80' : 'bg-red-400/80'} transition-all duration-700`}
                    style={{ height: `${wickBottom}px` }}
                  ></div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Enhanced Loading Text */}
        <div className="text-center space-y-5 mt-2">
          {/* Stage Messages with Transition */}
          <div className="min-h-[2rem]">
            <h3 className="text-xl font-bold bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent animate-shimmer">
              {loadingMessages[loadingStage]}
            </h3>
          </div>

          {/* Enhanced Progress Bar */}
          <div className="w-80 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Progress</span>
              <span className="tabular-nums font-semibold text-purple-400">{Math.floor(progress)}%</span>
            </div>
            <div className="h-2.5 bg-slate-800/80 rounded-full overflow-hidden border border-slate-700/50 shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-purple-500 via-blue-500 to-green-500 rounded-full transition-all duration-300 ease-out relative overflow-hidden"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer-bar"></div>
              </div>
            </div>
          </div>

          {/* Animated Dots */}
          <div className="flex items-center justify-center gap-2 pt-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2.5 h-2.5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full animate-dot-bounce shadow-lg shadow-purple-500/50"
                style={{ animationDelay: `${i * 0.15}s` }}
              ></div>
            ))}
          </div>
        </div>

        {/* Enhanced Feature Icons */}
        <div className="flex items-center gap-8 mt-2">
          {[
            { icon: BarChart3, label: 'Analytics', color: 'purple', delay: '0s' },
            { icon: TrendingUp, label: 'Performance', color: 'green', delay: '0.1s' },
            { icon: Activity, label: 'Real-time', color: 'blue', delay: '0.2s' }
          ].map((feature, idx) => (
            <div
              key={idx}
              className="flex flex-col items-center gap-2 opacity-60 hover:opacity-100 transition-all duration-300 animate-fade-in-feature cursor-pointer group"
              style={{ animationDelay: feature.delay }}
            >
              <div className={`w-14 h-14 bg-slate-800/50 backdrop-blur-sm rounded-xl flex items-center justify-center border border-slate-700/50 group-hover:scale-110 group-hover:border-${feature.color}-500/50 transition-all duration-300 shadow-lg`}>
                <feature.icon className={`text-${feature.color}-400 group-hover:text-${feature.color}-300 transition-colors`} size={26} />
              </div>
              <span className="text-slate-500 text-xs font-medium group-hover:text-slate-400 transition-colors">{feature.label}</span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes float-smooth {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
            opacity: 0.1;
          }
          50% {
            transform: translateY(-30px) rotate(5deg);
            opacity: 0.15;
          }
        }

        @keyframes glow-pulse {
          0%, 100% {
            opacity: 0.2;
            transform: scale(1);
          }
          50% {
            opacity: 0.3;
            transform: scale(1.1);
          }
        }

        @keyframes glow-pulse-delayed {
          0%, 100% {
            opacity: 0.15;
            transform: scale(1) translateX(0);
          }
          50% {
            opacity: 0.25;
            transform: scale(1.15) translateX(20px);
          }
        }

        @keyframes logo-pulse {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 20px 60px -12px rgba(147, 51, 234, 0.5);
          }
          50% {
            transform: scale(1.05);
            box-shadow: 0 25px 80px -12px rgba(147, 51, 234, 0.7);
          }
        }

        @keyframes logo-icon {
          0%, 100% {
            transform: rotate(0deg) scale(1);
          }
          50% {
            transform: rotate(5deg) scale(1.1);
          }
        }

        @keyframes badge-bounce {
          0%, 100% {
            transform: translateY(0px) scale(1);
          }
          50% {
            transform: translateY(-5px) scale(1.1);
          }
        }

        @keyframes shimmer {
          0% {
            background-position: -200% center;
          }
          100% {
            background-position: 200% center;
          }
        }

        @keyframes shimmer-bar {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        @keyframes dot-bounce {
          0%, 80%, 100% {
            transform: translateY(0) scale(1);
            opacity: 0.7;
          }
          40% {
            transform: translateY(-10px) scale(1.2);
            opacity: 1;
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fade-in-feature {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.9);
          }
          to {
            opacity: 0.6;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes grid-flow {
          0% {
            background-position: 0 0;
          }
          100% {
            background-position: 4rem 4rem;
          }
        }

        .animate-float-smooth {
          animation: float-smooth 4s ease-in-out infinite;
        }

        .animate-glow-pulse {
          animation: glow-pulse 6s ease-in-out infinite;
        }

        .animate-glow-pulse-delayed {
          animation: glow-pulse-delayed 7s ease-in-out infinite;
        }

        .animate-logo-pulse {
          animation: logo-pulse 3s ease-in-out infinite;
        }

        .animate-logo-icon {
          animation: logo-icon 4s ease-in-out infinite;
        }

        .animate-badge-bounce {
          animation: badge-bounce 2s ease-in-out infinite;
        }

        .animate-shimmer {
          background-size: 200% auto;
          animation: shimmer 3s linear infinite;
        }

        .animate-shimmer-bar {
          animation: shimmer-bar 2s ease-in-out infinite;
        }

        .animate-dot-bounce {
          animation: dot-bounce 1.4s ease-in-out infinite;
        }

        .animate-slide-up {
          animation: slide-up 0.8s ease-out;
        }

        .animate-fade-in-feature {
          animation: fade-in-feature 0.6s ease-out forwards;
        }

        .animate-grid-flow {
          animation: grid-flow 20s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default ForexLoader;
