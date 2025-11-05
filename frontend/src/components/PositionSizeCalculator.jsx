import React, { useState, useEffect } from 'react';
import { Calculator, X, Minimize2, Maximize2, Info, DollarSign, TrendingUp, Target, Percent, AlertTriangle } from 'lucide-react';

/**
 * Floating Position Size Calculator Widget
 * Helps traders calculate optimal position sizes based on risk parameters
 */
const PositionSizeCalculator = ({ isVisible, onClose, accountBalance = 10000, theme = 'dark' }) => {
  // Position state
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 100 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Calculator inputs
  const [inputs, setInputs] = useState({
    accountBalance: accountBalance || 10000,
    riskPercent: 1,
    entryPrice: '',
    stopLoss: '',
    takeProfit: '',
    pipValue: 10, // Default for standard lot on forex majors
    currency: 'USD'
  });

  // Results
  const [results, setResults] = useState({
    lotSize: 0,
    riskAmount: 0,
    potentialProfit: 0,
    stopLossPips: 0,
    takeProfitPips: 0,
    riskRewardRatio: 0,
    kellyLotSize: 0
  });

  // Update account balance when prop changes
  useEffect(() => {
    if (accountBalance) {
      setInputs(prev => ({ ...prev, accountBalance }));
    }
  }, [accountBalance]);

  // Calculate position size and metrics
  useEffect(() => {
    const { accountBalance, riskPercent, entryPrice, stopLoss, takeProfit, pipValue } = inputs;

    if (!entryPrice || !stopLoss || !accountBalance || !riskPercent) {
      return;
    }

    const entry = parseFloat(entryPrice);
    const sl = parseFloat(stopLoss);
    const tp = takeProfit ? parseFloat(takeProfit) : null;
    const balance = parseFloat(accountBalance);
    const riskPct = parseFloat(riskPercent);

    // Calculate stop loss distance in pips
    const slPips = Math.abs(entry - sl) * 10000; // For 4-decimal pairs
    const tpPips = tp ? Math.abs(tp - entry) * 10000 : 0;

    // Calculate risk amount in dollars
    const riskAmount = (balance * riskPct) / 100;

    // Calculate lot size
    // Formula: Lot Size = Risk Amount / (Stop Loss Pips * Pip Value)
    const lotSize = riskAmount / (slPips * (pipValue / 100));

    // Calculate potential profit
    const potentialProfit = tp ? (tpPips * (pipValue / 100) * lotSize) : 0;

    // Risk/Reward Ratio
    const rrRatio = tp && slPips > 0 ? tpPips / slPips : 0;

    // Kelly Criterion (simplified - requires win rate)
    // Assuming 50% win rate and 1:2 RR for example
    const winRate = 0.5;
    const avgWin = rrRatio || 2;
    const avgLoss = 1;
    const kellyPercent = winRate > 0 ? ((winRate * avgWin) - ((1 - winRate) * avgLoss)) / avgWin : 0;
    const kellyLotSize = kellyPercent > 0 ? (balance * kellyPercent / 100) / (slPips * (pipValue / 100)) : 0;

    setResults({
      lotSize: Math.max(0, lotSize.toFixed(2)),
      riskAmount: riskAmount.toFixed(2),
      potentialProfit: potentialProfit.toFixed(2),
      stopLossPips: slPips.toFixed(1),
      takeProfitPips: tpPips.toFixed(1),
      riskRewardRatio: rrRatio.toFixed(2),
      kellyLotSize: Math.max(0, kellyLotSize.toFixed(2))
    });
  }, [inputs]);

  // Dragging functionality
  const handleMouseDown = (e) => {
    if (e.target.closest('.no-drag')) return;
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragOffset.x,
      y: e.clientY - dragOffset.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  if (!isVisible) return null;

  const bgClass = theme === 'dark' ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200';
  const textClass = theme === 'dark' ? 'text-white' : 'text-slate-900';
  const secondaryTextClass = theme === 'dark' ? 'text-slate-300' : 'text-slate-700';
  const inputClass = theme === 'dark'
    ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
    : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400';

  return (
    <div
      className={`fixed z-50 ${bgClass} border rounded-2xl shadow-2xl ${
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
      } ${isMinimized ? 'w-72' : 'w-96'} transition-all`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        maxHeight: isMinimized ? 'auto' : '80vh'
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Calculator size={20} className="text-purple-400" />
          <h3 className={`font-bold ${textClass}`}>Position Size Calculator</h3>
        </div>
        <div className="flex items-center gap-2 no-drag">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-slate-800 rounded"
          >
            {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
          </button>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-slate-800 rounded"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Content */}
      {!isMinimized && (
        <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(80vh-80px)] no-drag">
          {/* Account Balance */}
          <div>
            <label className={`block ${secondaryTextClass} text-sm font-medium mb-2 flex items-center gap-2`}>
              <DollarSign size={14} className="text-green-400" />
              Account Balance ($)
            </label>
            <input
              type="number"
              value={inputs.accountBalance}
              onChange={(e) => setInputs({ ...inputs, accountBalance: e.target.value })}
              className={`w-full px-3 py-2 ${inputClass} border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500`}
              placeholder="10000"
            />
          </div>

          {/* Risk Percentage */}
          <div>
            <label className={`block ${secondaryTextClass} text-sm font-medium mb-2 flex items-center gap-2`}>
              <Percent size={14} className="text-yellow-400" />
              Risk Per Trade (%)
            </label>
            <input
              type="number"
              step="0.1"
              value={inputs.riskPercent}
              onChange={(e) => setInputs({ ...inputs, riskPercent: e.target.value })}
              className={`w-full px-3 py-2 ${inputClass} border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500`}
              placeholder="1"
            />
            <p className="text-xs text-slate-500 mt-1">Recommended: 1-2% per trade</p>
          </div>

          {/* Entry Price */}
          <div>
            <label className={`block ${secondaryTextClass} text-sm font-medium mb-2`}>
              Entry Price
            </label>
            <input
              type="number"
              step="0.00001"
              value={inputs.entryPrice}
              onChange={(e) => setInputs({ ...inputs, entryPrice: e.target.value })}
              className={`w-full px-3 py-2 ${inputClass} border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500`}
              placeholder="1.08500"
            />
          </div>

          {/* Stop Loss */}
          <div>
            <label className={`block ${secondaryTextClass} text-sm font-medium mb-2 flex items-center gap-2`}>
              <AlertTriangle size={14} className="text-red-400" />
              Stop Loss Price
            </label>
            <input
              type="number"
              step="0.00001"
              value={inputs.stopLoss}
              onChange={(e) => setInputs({ ...inputs, stopLoss: e.target.value })}
              className={`w-full px-3 py-2 ${inputClass} border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500`}
              placeholder="1.08300"
            />
          </div>

          {/* Take Profit (Optional) */}
          <div>
            <label className={`block ${secondaryTextClass} text-sm font-medium mb-2 flex items-center gap-2`}>
              <Target size={14} className="text-blue-400" />
              Take Profit Price (Optional)
            </label>
            <input
              type="number"
              step="0.00001"
              value={inputs.takeProfit}
              onChange={(e) => setInputs({ ...inputs, takeProfit: e.target.value })}
              className={`w-full px-3 py-2 ${inputClass} border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500`}
              placeholder="1.08900"
            />
          </div>

          {/* Pip Value */}
          <div>
            <label className={`block ${secondaryTextClass} text-sm font-medium mb-2 flex items-center gap-2`}>
              <Info size={14} className="text-cyan-400" />
              Pip Value (per lot)
            </label>
            <input
              type="number"
              step="0.1"
              value={inputs.pipValue}
              onChange={(e) => setInputs({ ...inputs, pipValue: e.target.value })}
              className={`w-full px-3 py-2 ${inputClass} border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500`}
              placeholder="10"
            />
            <p className="text-xs text-slate-500 mt-1">Default: $10 for standard lot on majors</p>
          </div>

          {/* Results */}
          {results.lotSize > 0 && (
            <div className="mt-6 pt-6 border-t border-white/10 space-y-3">
              <h4 className={`font-semibold ${textClass} mb-3 flex items-center gap-2`}>
                <TrendingUp size={16} className="text-green-400" />
                Calculated Results
              </h4>

              {/* Recommended Lot Size */}
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-purple-300 text-sm font-medium">Recommended Lot Size</span>
                  <span className={`font-bold text-lg ${textClass}`}>{results.lotSize} lots</span>
                </div>
              </div>

              {/* Risk Amount */}
              <div className="flex items-center justify-between p-2 bg-slate-800/30 rounded">
                <span className={`text-sm ${secondaryTextClass}`}>Risk Amount</span>
                <span className={`font-semibold text-red-400`}>${results.riskAmount}</span>
              </div>

              {/* Stop Loss Distance */}
              <div className="flex items-center justify-between p-2 bg-slate-800/30 rounded">
                <span className={`text-sm ${secondaryTextClass}`}>Stop Loss Distance</span>
                <span className={`font-semibold ${textClass}`}>{results.stopLossPips} pips</span>
              </div>

              {/* Potential Profit */}
              {results.potentialProfit > 0 && (
                <>
                  <div className="flex items-center justify-between p-2 bg-slate-800/30 rounded">
                    <span className={`text-sm ${secondaryTextClass}`}>Potential Profit</span>
                    <span className={`font-semibold text-green-400`}>${results.potentialProfit}</span>
                  </div>

                  <div className="flex items-center justify-between p-2 bg-slate-800/30 rounded">
                    <span className={`text-sm ${secondaryTextClass}`}>Take Profit Distance</span>
                    <span className={`font-semibold ${textClass}`}>{results.takeProfitPips} pips</span>
                  </div>

                  <div className="flex items-center justify-between p-2 bg-slate-800/30 rounded">
                    <span className={`text-sm ${secondaryTextClass}`}>Risk/Reward Ratio</span>
                    <span className={`font-semibold ${
                      results.riskRewardRatio >= 2 ? 'text-green-400' :
                      results.riskRewardRatio >= 1 ? 'text-yellow-400' : 'text-red-400'
                    }`}>1:{results.riskRewardRatio}</span>
                  </div>
                </>
              )}

              {/* Kelly Criterion (Advanced) */}
              {results.kellyLotSize > 0 && (
                <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Info size={14} className="text-blue-400" />
                    <span className="text-blue-300 text-xs font-medium">Kelly Criterion (Advanced)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs ${secondaryTextClass}`}>Optimal Lot Size</span>
                    <span className={`font-semibold text-sm ${textClass}`}>{results.kellyLotSize} lots</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Based on 50% win rate. Use with caution - Kelly can be aggressive.
                  </p>
                </div>
              )}

              {/* Risk Warning */}
              {results.riskRewardRatio > 0 && results.riskRewardRatio < 1 && (
                <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={14} className="text-red-400" />
                    <span className="text-red-300 text-xs font-medium">
                      Warning: Risk/Reward ratio is below 1:1
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Consider adjusting your TP/SL levels for better risk management.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Help Text */}
          {results.lotSize === 0 && (
            <div className="mt-4 p-3 bg-slate-800/30 rounded-lg">
              <p className="text-xs text-slate-400">
                💡 Enter your entry price and stop loss to calculate the optimal position size based on your risk parameters.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Footer (when minimized) */}
      {isMinimized && (
        <div className="p-3">
          <p className={`text-xs ${secondaryTextClass}`}>Calculator minimized - Click to expand</p>
        </div>
      )}
    </div>
  );
};

export default PositionSizeCalculator;
