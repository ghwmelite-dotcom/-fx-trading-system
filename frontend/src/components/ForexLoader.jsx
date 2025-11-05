import { useEffect, useState } from 'react';
import { TrendingUp, DollarSign, BarChart3, Activity } from 'lucide-react';

const ForexLoader = ({ message = 'Loading...' }) => {
  const [progress, setProgress] = useState(0);
  const [candlesticks, setCandlesticks] = useState([]);
  const [currentPrice, setCurrentPrice] = useState(1.0850);

  useEffect(() => {
    // Animate progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 0 : prev + 2));
    }, 50);

    // Generate random candlesticks
    const generateCandlesticks = () => {
      return Array.from({ length: 15 }, (_, i) => {
        const open = 1.08 + Math.random() * 0.02;
        const close = open + (Math.random() - 0.5) * 0.01;
        const high = Math.max(open, close) + Math.random() * 0.005;
        const low = Math.min(open, close) - Math.random() * 0.005;
        return { open, close, high, low, isGreen: close > open };
      });
    };

    setCandlesticks(generateCandlesticks());

    // Update candlesticks animation
    const candleInterval = setInterval(() => {
      setCandlesticks(generateCandlesticks());
    }, 2000);

    // Animate price ticker
    const priceInterval = setInterval(() => {
      setCurrentPrice((prev) => prev + (Math.random() - 0.5) * 0.001);
    }, 100);

    return () => {
      clearInterval(progressInterval);
      clearInterval(candleInterval);
      clearInterval(priceInterval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center relative overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f12_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f12_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]"></div>

      {/* Floating Currency Symbols */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {['$', '€', '¥', '£', '₿'].map((symbol, i) => (
          <div
            key={i}
            className="absolute text-purple-500/10 text-6xl font-bold animate-float"
            style={{
              left: `${20 + i * 20}%`,
              top: `${10 + (i % 3) * 30}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${3 + i}s`,
            }}
          >
            {symbol}
          </div>
        ))}
      </div>

      {/* Animated Background Glow */}
      <div className="absolute w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center gap-8 px-4">
        {/* Logo/Icon */}
        <div className="relative">
          <div className="w-24 h-24 bg-gradient-to-br from-purple-600 to-blue-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-purple-500/50 animate-pulse">
            <TrendingUp className="text-white" size={48} />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center animate-bounce">
            <DollarSign size={16} className="text-white" />
          </div>
        </div>

        {/* Candlestick Chart */}
        <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 shadow-2xl">
          <div className="flex items-end justify-center gap-2 h-32">
            {candlesticks.map((candle, i) => {
              const bodyHeight = Math.abs(candle.close - candle.open) * 500;
              const wickTop = (candle.high - Math.max(candle.open, candle.close)) * 500;
              const wickBottom = (Math.min(candle.open, candle.close) - candle.low) * 500;

              return (
                <div
                  key={i}
                  className="flex flex-col items-center justify-end transition-all duration-500"
                  style={{ height: '100%' }}
                >
                  {/* Upper Wick */}
                  <div
                    className={`w-0.5 ${candle.isGreen ? 'bg-green-400' : 'bg-red-400'}`}
                    style={{ height: `${wickTop}px` }}
                  ></div>
                  {/* Body */}
                  <div
                    className={`w-3 ${
                      candle.isGreen ? 'bg-green-500' : 'bg-red-500'
                    } rounded-sm transition-all duration-500`}
                    style={{ height: `${Math.max(bodyHeight, 2)}px` }}
                  ></div>
                  {/* Lower Wick */}
                  <div
                    className={`w-0.5 ${candle.isGreen ? 'bg-green-400' : 'bg-red-400'}`}
                    style={{ height: `${wickBottom}px` }}
                  ></div>
                </div>
              );
            })}
          </div>

          {/* Price Ticker */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="text-purple-400 animate-pulse" size={16} />
              <span className="text-slate-400 text-sm font-medium">EUR/USD</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-white tabular-nums">
                {currentPrice.toFixed(5)}
              </span>
              <TrendingUp className="text-green-400" size={16} />
            </div>
          </div>
        </div>

        {/* Loading Text */}
        <div className="text-center space-y-4">
          <h3 className="text-2xl font-bold text-white animate-pulse">{message}</h3>

          {/* Progress Bar */}
          <div className="w-64 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 via-blue-500 to-green-500 rounded-full transition-all duration-100"
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          {/* Animated Dots */}
          <div className="flex items-center justify-center gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              ></div>
            ))}
          </div>
        </div>

        {/* Feature Icons */}
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-center gap-2 opacity-50 hover:opacity-100 transition-opacity">
            <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center">
              <BarChart3 className="text-purple-400" size={24} />
            </div>
            <span className="text-slate-500 text-xs">Analytics</span>
          </div>
          <div className="flex flex-col items-center gap-2 opacity-50 hover:opacity-100 transition-opacity">
            <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center">
              <TrendingUp className="text-green-400" size={24} />
            </div>
            <span className="text-slate-500 text-xs">Performance</span>
          </div>
          <div className="flex flex-col items-center gap-2 opacity-50 hover:opacity-100 transition-opacity">
            <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center">
              <Activity className="text-blue-400" size={24} />
            </div>
            <span className="text-slate-500 text-xs">Real-time</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default ForexLoader;
