import React, { useState, useEffect } from 'react';
import { TrendingUp, Move, AlertTriangle, Info, Copy, Check } from 'lucide-react';

/**
 * Trailing Stop Visualizer
 * Calculate and visualize trailing stop distances
 * Shows breakeven point, trail distance, and potential profit protection
 */
const TrailingStopVisualizer = ({
  trade = null,
  isEmbedded = false,
  theme = 'dark'
}) => {
  const [currentPrice, setCurrentPrice] = useState(trade?.entry_price || 1.0850);
  const [entryPrice, setEntryPrice] = useState(trade?.entry_price || 1.0850);
  const [tradeType, setTradeType] = useState(trade?.type || 'buy');
  const [trailDistance, setTrailDistance] = useState(50); // pips
  const [activationDistance, setActivationDistance] = useState(20); // pips when to activate trail
  const [lotSize, setLotSize] = useState(trade?.size || 0.1);
  const [copied, setCopied] = useState(false);

  // Calculate values
  const pipValue = 10; // $10 per pip per lot for standard pairs
  const pipMultiplier = 0.0001; // For 4-decimal pairs

  const priceMovement = tradeType === 'buy'
    ? (currentPrice - entryPrice) / pipMultiplier
    : (entryPrice - currentPrice) / pipMultiplier;

  const isTrailActive = priceMovement >= activationDistance;

  const trailingStopPrice = tradeType === 'buy'
    ? currentPrice - (trailDistance * pipMultiplier)
    : currentPrice + (trailDistance * pipMultiplier);

  const protectedProfit = isTrailActive
    ? (priceMovement - trailDistance) * pipValue * lotSize
    : 0;

  const breakevenPoint = tradeType === 'buy'
    ? entryPrice + (activationDistance * pipMultiplier)
    : entryPrice - (activationDistance * pipMultiplier);

  const currentPnL = priceMovement * pipValue * lotSize;

  // Copy to clipboard
  const copySettings = () => {
    const text = `Trailing Stop Settings:
Entry: ${entryPrice.toFixed(5)}
Trail Distance: ${trailDistance} pips
Activation: ${activationDistance} pips
Current Stop: ${trailingStopPrice.toFixed(5)}
Protected Profit: $${protectedProfit.toFixed(2)}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const bgClass = theme === 'dark' ? 'bg-slate-900' : 'bg-white';
  const textClass = theme === 'dark' ? 'text-white' : 'text-slate-900';
  const secondaryTextClass = theme === 'dark' ? 'text-slate-400' : 'text-slate-600';
  const borderClass = theme === 'dark' ? 'border-slate-700' : 'border-slate-300';

  return (
    <div className={`${isEmbedded ? '' : 'p-6'} space-y-4`}>
      {/* Header */}
      {!isEmbedded && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
              <Move className="text-white" size={20} />
            </div>
            <div>
              <h3 className={`text-lg font-bold ${textClass}`}>Trailing Stop Calculator</h3>
              <p className={`text-sm ${secondaryTextClass}`}>Protect your profits as price moves</p>
            </div>
          </div>
          <button
            onClick={copySettings}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            title="Copy settings"
          >
            {copied ? (
              <Check className="text-green-400" size={18} />
            ) : (
              <Copy className="text-slate-400" size={18} />
            )}
          </button>
        </div>
      )}

      {/* Visual Progress Bar */}
      <div className={`p-4 bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl border ${borderClass}`}>
        <div className="flex items-center justify-between mb-2">
          <span className={`text-xs ${secondaryTextClass}`}>Entry</span>
          <span className={`text-xs ${secondaryTextClass}`}>Current Stop</span>
          <span className={`text-xs ${secondaryTextClass}`}>Current Price</span>
        </div>

        {/* Price Movement Bar */}
        <div className="relative h-12 bg-slate-900 rounded-lg overflow-hidden">
          {/* Entry marker */}
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>

          {/* Trail activation zone */}
          {isTrailActive && (
            <div
              className="absolute top-0 bottom-0 bg-green-500/20"
              style={{
                left: '0%',
                width: `${Math.min((priceMovement / (priceMovement + trailDistance)) * 100, 100)}%`
              }}
            ></div>
          )}

          {/* Trailing stop position */}
          <div
            className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full ${
              isTrailActive ? 'bg-yellow-400 animate-pulse' : 'bg-slate-600'
            }`}
            style={{
              left: `${Math.min(Math.max(((priceMovement - trailDistance) / (priceMovement + 20)) * 100, 0), 95)}%`
            }}
          ></div>

          {/* Current price marker */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-purple-500 border-2 border-white animate-pulse"
            style={{
              left: `${Math.min((priceMovement / (priceMovement + 20)) * 100, 100)}%`
            }}
          ></div>
        </div>

        {/* Values */}
        <div className="grid grid-cols-3 gap-2 mt-3">
          <div className="text-center">
            <div className="text-xs text-blue-400">Entry</div>
            <div className="text-sm font-mono text-white">{entryPrice.toFixed(5)}</div>
          </div>
          <div className="text-center">
            <div className={`text-xs ${isTrailActive ? 'text-yellow-400' : 'text-slate-500'}`}>Trail Stop</div>
            <div className={`text-sm font-mono ${isTrailActive ? 'text-yellow-400' : 'text-slate-500'}`}>
              {trailingStopPrice.toFixed(5)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-purple-400">Current</div>
            <div className="text-sm font-mono text-white">{currentPrice.toFixed(5)}</div>
          </div>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Trade Type */}
        <div>
          <label className={`block text-xs ${secondaryTextClass} mb-1`}>Trade Type</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setTradeType('buy')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                tradeType === 'buy'
                  ? 'bg-green-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              BUY
            </button>
            <button
              onClick={() => setTradeType('sell')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                tradeType === 'sell'
                  ? 'bg-red-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              SELL
            </button>
          </div>
        </div>

        {/* Entry Price */}
        <div>
          <label className={`block text-xs ${secondaryTextClass} mb-1`}>Entry Price</label>
          <input
            type="number"
            step="0.00001"
            value={entryPrice}
            onChange={(e) => setEntryPrice(parseFloat(e.target.value) || 0)}
            className={`w-full px-3 py-2 bg-slate-800 border ${borderClass} rounded-lg ${textClass} text-sm focus:outline-none focus:ring-2 focus:ring-purple-500`}
          />
        </div>

        {/* Current Price */}
        <div>
          <label className={`block text-xs ${secondaryTextClass} mb-1`}>Current Price</label>
          <input
            type="number"
            step="0.00001"
            value={currentPrice}
            onChange={(e) => setCurrentPrice(parseFloat(e.target.value) || 0)}
            className={`w-full px-3 py-2 bg-slate-800 border ${borderClass} rounded-lg ${textClass} text-sm focus:outline-none focus:ring-2 focus:ring-purple-500`}
          />
        </div>

        {/* Lot Size */}
        <div>
          <label className={`block text-xs ${secondaryTextClass} mb-1`}>Lot Size</label>
          <input
            type="number"
            step="0.01"
            value={lotSize}
            onChange={(e) => setLotSize(parseFloat(e.target.value) || 0)}
            className={`w-full px-3 py-2 bg-slate-800 border ${borderClass} rounded-lg ${textClass} text-sm focus:outline-none focus:ring-2 focus:ring-purple-500`}
          />
        </div>
      </div>

      {/* Trail Settings */}
      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className={`text-xs ${secondaryTextClass}`}>Trail Distance (pips)</label>
            <span className={`text-sm font-bold ${textClass}`}>{trailDistance}</span>
          </div>
          <input
            type="range"
            min="5"
            max="200"
            step="5"
            value={trailDistance}
            onChange={(e) => setTrailDistance(parseInt(e.target.value))}
            className="w-full accent-purple-600"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className={`text-xs ${secondaryTextClass}`}>Activation Distance (pips)</label>
            <span className={`text-sm font-bold ${textClass}`}>{activationDistance}</span>
          </div>
          <input
            type="range"
            min="5"
            max="100"
            step="5"
            value={activationDistance}
            onChange={(e) => setActivationDistance(parseInt(e.target.value))}
            className="w-full accent-blue-600"
          />
        </div>
      </div>

      {/* Results Cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Trail Status */}
        <div className={`p-3 rounded-xl border-2 ${
          isTrailActive
            ? 'bg-green-500/10 border-green-500/30'
            : 'bg-slate-800/50 border-slate-700'
        }`}>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className={isTrailActive ? 'text-green-400' : 'text-slate-500'} size={16} />
            <span className={`text-xs ${isTrailActive ? 'text-green-300' : 'text-slate-500'}`}>
              Trail Status
            </span>
          </div>
          <div className={`text-lg font-bold ${isTrailActive ? 'text-green-400' : 'text-slate-500'}`}>
            {isTrailActive ? 'ACTIVE' : 'WAITING'}
          </div>
          <div className={`text-xs ${isTrailActive ? 'text-green-400' : 'text-slate-500'}`}>
            {isTrailActive
              ? `${priceMovement.toFixed(1)} pips in profit`
              : `Need ${(activationDistance - priceMovement).toFixed(1)} more pips`
            }
          </div>
        </div>

        {/* Protected Profit */}
        <div className="p-3 bg-purple-500/10 border-2 border-purple-500/30 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="text-purple-400" size={16} />
            <span className="text-xs text-purple-300">Protected Profit</span>
          </div>
          <div className="text-lg font-bold text-purple-400">
            ${protectedProfit.toFixed(2)}
          </div>
          <div className="text-xs text-purple-400">
            {isTrailActive ? `${(priceMovement - trailDistance).toFixed(1)} pips locked` : 'Not active yet'}
          </div>
        </div>

        {/* Breakeven Point */}
        <div className="p-3 bg-blue-500/10 border-2 border-blue-500/30 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <Info className="text-blue-400" size={16} />
            <span className="text-xs text-blue-300">Breakeven at</span>
          </div>
          <div className="text-lg font-bold text-blue-400">
            {breakevenPoint.toFixed(5)}
          </div>
          <div className="text-xs text-blue-400">
            {activationDistance} pips from entry
          </div>
        </div>

        {/* Current P&L */}
        <div className={`p-3 border-2 rounded-xl ${
          currentPnL >= 0
            ? 'bg-green-500/10 border-green-500/30'
            : 'bg-red-500/10 border-red-500/30'
        }`}>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className={currentPnL >= 0 ? 'text-green-400' : 'text-red-400'} size={16} />
            <span className={`text-xs ${currentPnL >= 0 ? 'text-green-300' : 'text-red-300'}`}>
              Current P&L
            </span>
          </div>
          <div className={`text-lg font-bold ${currentPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {currentPnL >= 0 ? '+' : ''}${currentPnL.toFixed(2)}
          </div>
          <div className={`text-xs ${currentPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {priceMovement.toFixed(1)} pips {tradeType === 'buy' ? (priceMovement >= 0 ? '↑' : '↓') : (priceMovement >= 0 ? '↑' : '↓')}
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="p-3 bg-slate-800/30 border border-slate-700 rounded-lg">
        <div className="flex items-start gap-2">
          <Info className="text-cyan-400 mt-0.5 flex-shrink-0" size={14} />
          <div className={`text-xs ${secondaryTextClass} space-y-1`}>
            <p><strong className="text-cyan-300">How it works:</strong></p>
            <ul className="list-disc list-inside space-y-0.5 ml-2">
              <li>Trail activates when price moves {activationDistance} pips in your favor</li>
              <li>Stop loss follows price at {trailDistance} pips distance</li>
              <li>Lock in profits while letting winners run</li>
              <li>Never moves against you once activated</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrailingStopVisualizer;
