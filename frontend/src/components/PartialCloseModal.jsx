import React, { useState } from 'react';
import { X, Scissors, TrendingUp, AlertCircle, Check } from 'lucide-react';

/**
 * Partial Close Modal
 * Close portions of a position like MT4/MT5
 * E.g., close 50% at target, let rest run
 */
const PartialCloseModal = ({
  isOpen,
  onClose,
  trade,
  onPartialClose,
  theme = 'dark'
}) => {
  const [closePercent, setClosePercent] = useState(50);
  const [closeLots, setCloseLots] = useState((trade?.size || 0) * 0.5);
  const [usePercent, setUsePercent] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen || !trade) return null;

  const originalSize = parseFloat(trade.size) || 0;
  const maxClose = originalSize;

  // Sync percent and lots
  const handlePercentChange = (percent) => {
    setClosePercent(percent);
    setCloseLots((originalSize * percent) / 100);
  };

  const handleLotsChange = (lots) => {
    const validLots = Math.min(lots, maxClose);
    setCloseLots(validLots);
    setClosePercent((validLots / originalSize) * 100);
  };

  // Quick percent buttons
  const quickPercents = [25, 50, 75, 100];

  // Calculate remaining
  const remainingLots = originalSize - closeLots;
  const remainingPercent = 100 - closePercent;

  // Handle partial close
  const handleSubmit = async () => {
    if (closeLots <= 0 || closeLots > originalSize) {
      alert('Invalid close amount');
      return;
    }

    setIsProcessing(true);

    try {
      await onPartialClose({
        tradeId: trade.id,
        closeLots: parseFloat(closeLots.toFixed(2)),
        closePercent: parseFloat(closePercent.toFixed(2)),
        remainingLots: parseFloat(remainingLots.toFixed(2)),
        originalSize: originalSize
      });

      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setIsProcessing(false);
      }, 1500);
    } catch (error) {
      console.error('Partial close error:', error);
      alert('Failed to close position');
      setIsProcessing(false);
    }
  };

  const bgClass = theme === 'dark' ? 'bg-slate-900' : 'bg-white';
  const overlayClass = 'bg-black/50';
  const textClass = theme === 'dark' ? 'text-white' : 'text-slate-900';
  const secondaryTextClass = theme === 'dark' ? 'text-slate-400' : 'text-slate-600';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Overlay */}
      <div className={overlayClass} onClick={onClose}></div>

      {/* Modal */}
      <div className={`relative ${bgClass} rounded-2xl shadow-2xl border border-white/10 max-w-md w-full mx-4 animate-in zoom-in duration-200`}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center">
              <Scissors className="text-purple-400" size={20} />
            </div>
            <div>
              <h2 className={`text-xl font-bold ${textClass}`}>Partial Close</h2>
              <p className={`text-sm ${secondaryTextClass}`}>
                {trade.pair} • {trade.type.toUpperCase()}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="text-slate-400" size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Current Position Info */}
          <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <span className={secondaryTextClass}>Current Position Size</span>
              <span className={`text-2xl font-bold ${textClass}`}>
                {originalSize} lots
              </span>
            </div>
            {trade.pnl !== undefined && (
              <div className="flex items-center justify-between">
                <span className={secondaryTextClass}>Current P&L</span>
                <span className={`text-lg font-bold ${
                  trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                </span>
              </div>
            )}
          </div>

          {/* Toggle: Percent vs Lots */}
          <div className="flex items-center gap-2 bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => setUsePercent(true)}
              className={`flex-1 px-4 py-2 rounded-md font-medium transition-all ${
                usePercent
                  ? 'bg-purple-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Percent
            </button>
            <button
              onClick={() => setUsePercent(false)}
              className={`flex-1 px-4 py-2 rounded-md font-medium transition-all ${
                !usePercent
                  ? 'bg-purple-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Lots
            </button>
          </div>

          {/* Close Amount Input */}
          {usePercent ? (
            <div>
              <label className={`block mb-2 font-medium ${textClass}`}>
                Close Percentage
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={closePercent}
                onChange={(e) => handlePercentChange(parseFloat(e.target.value))}
                className="w-full accent-purple-600"
              />
              <div className="flex items-center justify-between mt-2">
                <span className={`text-3xl font-bold ${textClass}`}>
                  {closePercent.toFixed(0)}%
                </span>
                <span className={secondaryTextClass}>
                  = {closeLots.toFixed(2)} lots
                </span>
              </div>
            </div>
          ) : (
            <div>
              <label className={`block mb-2 font-medium ${textClass}`}>
                Close Amount (Lots)
              </label>
              <input
                type="number"
                min="0.01"
                max={maxClose}
                step="0.01"
                value={closeLots}
                onChange={(e) => handleLotsChange(parseFloat(e.target.value))}
                className={`w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg ${textClass} text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-purple-500`}
              />
              <div className="flex items-center justify-between mt-2">
                <span className={secondaryTextClass}>
                  Max: {maxClose} lots
                </span>
                <span className={secondaryTextClass}>
                  = {closePercent.toFixed(0)}%
                </span>
              </div>
            </div>
          )}

          {/* Quick Percent Buttons */}
          <div className="grid grid-cols-4 gap-2">
            {quickPercents.map(percent => (
              <button
                key={percent}
                onClick={() => handlePercentChange(percent)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  Math.abs(closePercent - percent) < 1
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {percent}%
              </button>
            ))}
          </div>

          {/* Remaining Position Info */}
          <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="text-blue-400" size={16} />
              <span className="text-blue-300 font-medium">Remaining Position</span>
            </div>
            <div className="flex items-center justify-between">
              <span className={secondaryTextClass}>Will remain open</span>
              <span className="text-2xl font-bold text-blue-400">
                {remainingLots.toFixed(2)} lots ({remainingPercent.toFixed(0)}%)
              </span>
            </div>
          </div>

          {/* Warning */}
          {closePercent === 100 && (
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-start gap-2">
              <AlertCircle className="text-yellow-400 flex-shrink-0 mt-0.5" size={16} />
              <p className="text-yellow-300 text-sm">
                This will close the entire position. Use the regular close function for full exits.
              </p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="p-4 bg-green-500/20 border border-green-500/50 rounded-xl flex items-center gap-3 animate-in fade-in duration-200">
              <Check className="text-green-400" size={24} />
              <div>
                <p className="text-green-300 font-medium">Position Partially Closed!</p>
                <p className="text-green-400 text-sm">
                  Closed {closeLots.toFixed(2)} lots • {remainingLots.toFixed(2)} lots remaining
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isProcessing || closeLots <= 0 || closeLots > originalSize}
              className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all disabled:opacity-50 ${
                isProcessing
                  ? 'bg-purple-700 cursor-wait'
                  : 'bg-purple-600 hover:bg-purple-700'
              } text-white`}
            >
              {isProcessing ? 'Processing...' : `Close ${closeLots.toFixed(2)} Lots`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartialCloseModal;
