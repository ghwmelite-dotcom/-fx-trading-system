import React, { useState, useEffect, useRef } from 'react';
import { Zap, ChevronDown, ChevronUp, Settings, X, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

/**
 * One-Click Trading Panel
 * MT4/MT5-style quick execution with preset lot sizes
 * Press Q to toggle, B for buy, S for sell
 */
const OneClickTrading = ({
  isVisible,
  onClose,
  onExecuteTrade,
  accounts = [],
  theme = 'dark'
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [position, setPosition] = useState({ x: window.innerWidth - 320, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const panelRef = useRef(null);

  // Quick trade settings
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('one_click_trading_settings');
    return saved ? JSON.parse(saved) : {
      pair: 'EUR/USD',
      lotSize: 0.1,
      stopLoss: 50,
      takeProfit: 100,
      accountId: accounts[0]?.id || 1,
      enableSL: true,
      enableTP: true
    };
  });

  // Preset lot sizes
  const lotSizes = [0.01, 0.05, 0.1, 0.5, 1.0];

  // Common pairs
  const commonPairs = [
    'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF',
    'AUD/USD', 'USD/CAD', 'NZD/USD', 'EUR/GBP',
    'EUR/JPY', 'GBP/JPY', 'XAU/USD', 'BTC/USD'
  ];

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('one_click_trading_settings', JSON.stringify(settings));
  }, [settings]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isVisible) return;

    const handleKeyPress = (e) => {
      // Ignore if typing in input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        executeTrade('buy');
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        executeTrade('sell');
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        setIsMinimized(!isMinimized);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isVisible, settings, isMinimized]);

  // Dragging logic
  const handleMouseDown = (e) => {
    if (e.target.closest('.no-drag')) return;
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  useEffect(() => {
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

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  // Execute trade
  const executeTrade = (type) => {
    const trade = {
      pair: settings.pair,
      type,
      size: settings.lotSize,
      stopLoss: settings.enableSL ? settings.stopLoss : null,
      takeProfit: settings.enableTP ? settings.takeProfit : null,
      accountId: settings.accountId,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0].substring(0, 5),
      notes: `One-click ${type} - ${settings.lotSize} lots`
    };

    if (onExecuteTrade) {
      onExecuteTrade(trade);
    }

    // Visual feedback
    const btn = type === 'buy' ? '.buy-btn' : '.sell-btn';
    const element = panelRef.current?.querySelector(btn);
    if (element) {
      element.classList.add('scale-95');
      setTimeout(() => element.classList.remove('scale-95'), 100);
    }
  };

  if (!isVisible) return null;

  const bgClass = theme === 'dark' ? 'bg-slate-900' : 'bg-white';
  const borderClass = theme === 'dark' ? 'border-slate-700' : 'border-slate-300';
  const textClass = theme === 'dark' ? 'text-white' : 'text-slate-900';

  return (
    <div
      ref={panelRef}
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 1000
      }}
      className={`${bgClass} border-2 ${borderClass} rounded-xl shadow-2xl ${
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
      } select-none`}
      onMouseDown={handleMouseDown}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="text-yellow-400" size={18} />
          <h3 className={`font-bold ${textClass}`}>One-Click Trading</h3>
        </div>
        <div className="flex items-center gap-1 no-drag">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover:bg-slate-700 rounded transition-colors"
            title={isMinimized ? "Expand" : "Minimize"}
          >
            {isMinimized ? (
              <ChevronDown className="text-slate-400" size={16} />
            ) : (
              <ChevronUp className="text-slate-400" size={16} />
            )}
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-red-600 rounded transition-colors"
            title="Close (Q)"
          >
            <X className="text-slate-400 hover:text-white" size={16} />
          </button>
        </div>
      </div>

      {/* Content */}
      {!isMinimized && (
        <div className="p-4 w-80 space-y-3">
          {/* Pair Selection */}
          <div>
            <label className="block text-xs text-slate-400 mb-1">Pair</label>
            <select
              value={settings.pair}
              onChange={(e) => setSettings({ ...settings, pair: e.target.value })}
              className="no-drag w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {commonPairs.map(pair => (
                <option key={pair} value={pair}>{pair}</option>
              ))}
            </select>
          </div>

          {/* Lot Size Presets */}
          <div>
            <label className="block text-xs text-slate-400 mb-2">Lot Size</label>
            <div className="grid grid-cols-5 gap-2 no-drag">
              {lotSizes.map(size => (
                <button
                  key={size}
                  onClick={() => setSettings({ ...settings, lotSize: size })}
                  className={`px-2 py-2 rounded-lg text-sm font-medium transition-all ${
                    settings.lotSize === size
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Account Selection */}
          {accounts.length > 1 && (
            <div>
              <label className="block text-xs text-slate-400 mb-1">Account</label>
              <select
                value={settings.accountId}
                onChange={(e) => setSettings({ ...settings, accountId: parseInt(e.target.value) })}
                className="no-drag w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* SL/TP Settings */}
          {showSettings && (
            <div className="space-y-2 pt-2 border-t border-slate-700">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.enableSL}
                  onChange={(e) => setSettings({ ...settings, enableSL: e.target.checked })}
                  className="no-drag"
                />
                <label className="text-xs text-slate-400">Stop Loss (pips)</label>
                <input
                  type="number"
                  value={settings.stopLoss}
                  onChange={(e) => setSettings({ ...settings, stopLoss: parseFloat(e.target.value) })}
                  disabled={!settings.enableSL}
                  className="no-drag flex-1 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-white text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 disabled:opacity-50"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.enableTP}
                  onChange={(e) => setSettings({ ...settings, enableTP: e.target.checked })}
                  className="no-drag"
                />
                <label className="text-xs text-slate-400">Take Profit (pips)</label>
                <input
                  type="number"
                  value={settings.takeProfit}
                  onChange={(e) => setSettings({ ...settings, takeProfit: parseFloat(e.target.value) })}
                  disabled={!settings.enableTP}
                  className="no-drag flex-1 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-white text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 disabled:opacity-50"
                />
              </div>
            </div>
          )}

          {/* Settings Toggle */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="no-drag w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg text-xs transition-all"
          >
            <Settings size={14} />
            {showSettings ? 'Hide' : 'Show'} SL/TP Settings
          </button>

          {/* Buy/Sell Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2 no-drag">
            <button
              onClick={() => executeTrade('buy')}
              className="buy-btn group relative px-6 py-4 bg-gradient-to-br from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all active:scale-95"
            >
              <div className="flex flex-col items-center gap-1">
                <TrendingUp size={24} />
                <span>BUY</span>
              </div>
              <div className="absolute top-1 right-1 text-xs opacity-50">B</div>
            </button>
            <button
              onClick={() => executeTrade('sell')}
              className="sell-btn group relative px-6 py-4 bg-gradient-to-br from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all active:scale-95"
            >
              <div className="flex flex-col items-center gap-1">
                <TrendingDown size={24} />
                <span>SELL</span>
              </div>
              <div className="absolute top-1 right-1 text-xs opacity-50">S</div>
            </button>
          </div>

          {/* Quick Info */}
          <div className="text-center text-xs text-slate-500 pt-1">
            Press <kbd className="px-1 py-0.5 bg-slate-800 rounded">B</kbd> for Buy,
            <kbd className="px-1 py-0.5 bg-slate-800 rounded ml-1">S</kbd> for Sell,
            <kbd className="px-1 py-0.5 bg-slate-800 rounded ml-1">M</kbd> to minimize
          </div>
        </div>
      )}

      {/* Minimized View */}
      {isMinimized && (
        <div className="px-4 py-2 flex items-center gap-2">
          <DollarSign className="text-yellow-400" size={16} />
          <span className="text-sm text-slate-400">
            {settings.pair} • {settings.lotSize} lots
          </span>
        </div>
      )}
    </div>
  );
};

export default OneClickTrading;
