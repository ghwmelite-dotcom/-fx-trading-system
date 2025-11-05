import React, { useState, useMemo, useEffect, useCallback, lazy, Suspense } from 'react';
import { Upload, TrendingUp, TrendingDown, DollarSign, Activity, BarChart3, Calendar, Plus, Download, Settings, Wifi, WifiOff, X, Check, AlertCircle, Zap, Target, Edit, Trash2, Filter, Search, Star, Tag, Smile, LogOut, User, Shield, Moon, Sun, Camera, Loader, Info, Brain } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import ScreenshotUpload from './ScreenshotUpload';

// Lazy load heavy components for better performance
const LoginPage = lazy(() => import('./components/LoginPage'));
const LoginModal = lazy(() => import('./components/LoginModal'));
const LandingPage = lazy(() => import('./components/LandingPage'));
const AdminPortal = lazy(() => import('./components/AdminPortal'));
const JournalTab = lazy(() => import('./components/JournalTab'));
const PsychologyCoach = lazy(() => import('./components/PsychologyCoach'));
const AnalyticsTab = lazy(() => import('./components/AnalyticsTab'));
const ForexLoader = lazy(() => import('./components/ForexLoader'));
const TradingViewWidget = lazy(() => import('./components/TradingViewWidget'));
const PositionSizeCalculator = lazy(() => import('./components/PositionSizeCalculator'));
const QuickScreenshotCapture = lazy(() => import('./components/QuickScreenshotCapture'));
const TradeTemplateManager = lazy(() => import('./components/TradeTemplateManager'));
const OneClickTrading = lazy(() => import('./components/OneClickTrading'));
const PartialCloseModal = lazy(() => import('./components/PartialCloseModal'));
const TrailingStopVisualizer = lazy(() => import('./components/TrailingStopVisualizer'));
const CorrelationMatrix = lazy(() => import('./components/CorrelationMatrix'));
const TradeCopier = lazy(() => import('./components/TradeCopier'));
const EconomicCalendar = lazy(() => import('./components/EconomicCalendar'));
const AITradeReview = lazy(() => import('./components/AITradeReview'));

const COLORS = ['#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

// Predefined options for journal
const STRATEGY_TAGS = [
  'scalping', 'day-trading', 'swing-trading', 'trend-following', 'mean-reversion',
  'breakout', 'reversal', 'support-resistance', 'news-trading', 'range-trading'
];

const EMOTIONS = [
  { value: 'confident', label: 'Confident', color: 'green' },
  { value: 'patient', label: 'Patient', color: 'blue' },
  { value: 'disciplined', label: 'Disciplined', color: 'purple' },
  { value: 'fearful', label: 'Fearful', color: 'red' },
  { value: 'greedy', label: 'Greedy', color: 'orange' },
  { value: 'FOMO', label: 'FOMO', color: 'yellow' },
  { value: 'impatient', label: 'Impatient', color: 'red' },
  { value: 'revenge-trading', label: 'Revenge Trading', color: 'red' }
];

// Instrument categorization
const INSTRUMENT_CATEGORIES = {
  'Forex Majors': ['EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'USD/CAD', 'NZD/USD', 'EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD', 'USDCAD', 'NZDUSD'],
  'Forex Minors': ['EUR/GBP', 'EUR/AUD', 'EUR/CAD', 'EUR/CHF', 'GBP/JPY', 'GBP/CHF', 'GBP/AUD', 'AUD/JPY', 'AUD/NZD', 'CAD/JPY', 'CHF/JPY', 'NZD/JPY', 'EURGBP', 'EURAUD', 'EURCAD', 'EURCHF', 'GBPJPY', 'GBPCHF', 'GBPAUD', 'AUDJPY', 'AUDNZD', 'CADJPY', 'CHFJPY', 'NZDJPY'],
  'Forex Exotics': ['USD/TRY', 'USD/ZAR', 'USD/MXN', 'USD/SEK', 'USD/NOK', 'USD/DKK', 'USD/SGD', 'USD/HKD', 'USD/THB', 'EUR/TRY', 'EUR/ZAR', 'GBP/ZAR', 'USDTRY', 'USDZAR', 'USDMXN', 'USDSEK', 'USDNOK', 'USDDKK', 'USDSGD', 'USDHKD', 'USDTHB', 'EURTRY', 'EURZAR', 'GBPZAR'],
  'Commodities': ['XAU/USD', 'XAG/USD', 'WTI', 'BRENT', 'NATGAS', 'CRUDE', 'OIL', 'XAUUSD', 'XAGUSD', 'GOLD', 'SILVER'],
  'Indices': ['US30', 'NAS100', 'SPX500', 'UK100', 'GER40', 'FRA40', 'JPN225', 'AUS200', 'HK50', 'DJIA', 'NASDAQ', 'S&P500', 'DAX', 'FTSE', 'NIKKEI'],
  'Metals': ['COPPER', 'PLATINUM', 'PALLADIUM', 'XPT/USD', 'XPD/USD', 'XPTUSD', 'XPDUSD']
};

// Get category for an instrument
const getCategoryForInstrument = (pair) => {
  const normalizedPair = pair.toUpperCase().replace(/\s/g, '');
  for (const [category, instruments] of Object.entries(INSTRUMENT_CATEGORIES)) {
    if (instruments.some(inst => normalizedPair.includes(inst.replace(/\//g, '').replace(/\s/g, '')))) {
      return category;
    }
  }
  return 'Other';
};

// Star Rating Component
const StarRating = ({ value, onChange, label, readonly = false }) => {
  const [hover, setHover] = useState(0);

  return (
    <div className="space-y-2">
      {label && <label className="block text-slate-300 text-sm font-medium">{label}</label>}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => !readonly && onChange(star)}
            onMouseEnter={() => !readonly && setHover(star)}
            onMouseLeave={() => !readonly && setHover(0)}
            disabled={readonly}
            className={`transition-all ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}
          >
            <Star
              size={24}
              className={`${
                star <= (hover || value)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-slate-600'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
};

// Tag Selector Component
const TagSelector = ({ tags = [], onChange }) => {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const addTag = (tag) => {
    if (tag && !tags.includes(tag)) {
      onChange([...tags, tag]);
      setInputValue('');
      setShowSuggestions(false);
    }
  };

  const removeTag = (tagToRemove) => {
    onChange(tags.filter(t => t !== tagToRemove));
  };

  const filteredSuggestions = STRATEGY_TAGS.filter(
    tag => !tags.includes(tag) && tag.toLowerCase().includes(inputValue.toLowerCase())
  );

  return (
    <div className="space-y-2">
      <label className="block text-slate-300 text-sm font-medium">Strategy Tags</label>

      {/* Selected Tags */}
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map(tag => (
          <span
            key={tag}
            className="px-3 py-1 bg-purple-600/30 border border-purple-500/50 rounded-full text-purple-200 text-sm flex items-center gap-2 hover:bg-purple-600/40 transition-colors"
          >
            {tag}
            <button
              onClick={() => removeTag(tag)}
              className="hover:text-white"
            >
              <X size={14} />
            </button>
          </span>
        ))}
      </div>

      {/* Input */}
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && inputValue) {
              e.preventDefault();
              addTag(inputValue);
            }
          }}
          placeholder="Add tag..."
          className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />

        {/* Suggestions Dropdown */}
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {filteredSuggestions.map(tag => (
              <button
                key={tag}
                onClick={() => addTag(tag)}
                className="w-full px-4 py-2 text-left text-white hover:bg-slate-700 transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Emotions Selector Component
const EmotionsSelector = ({ emotions = [], onChange }) => {
  const toggleEmotion = (emotionValue) => {
    if (emotions.includes(emotionValue)) {
      onChange(emotions.filter(e => e !== emotionValue));
    } else {
      onChange([...emotions, emotionValue]);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-slate-300 text-sm font-medium">Emotions</label>
      <div className="flex flex-wrap gap-2">
        {EMOTIONS.map(emotion => {
          const isSelected = emotions.includes(emotion.value);
          const colorClasses = {
            green: 'bg-green-600/30 border-green-500/50 text-green-200 hover:bg-green-600/40',
            blue: 'bg-blue-600/30 border-blue-500/50 text-blue-200 hover:bg-blue-600/40',
            purple: 'bg-purple-600/30 border-purple-500/50 text-purple-200 hover:bg-purple-600/40',
            red: 'bg-red-600/30 border-red-500/50 text-red-200 hover:bg-red-600/40',
            orange: 'bg-orange-600/30 border-orange-500/50 text-orange-200 hover:bg-orange-600/40',
            yellow: 'bg-yellow-600/30 border-yellow-500/50 text-yellow-200 hover:bg-yellow-600/40',
          };

          return (
            <button
              key={emotion.value}
              onClick={() => toggleEmotion(emotion.value)}
              className={`px-3 py-1 rounded-full text-sm border transition-all ${
                isSelected
                  ? colorClasses[emotion.color]
                  : 'bg-slate-700/50 border-slate-600 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {emotion.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// Journal Section Component with Category Filtering
const JournalSection = ({ trades, onUpdate, apiUrl, apiKey }) => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTradeId, setSelectedTradeId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [minPnl, setMinPnl] = useState('');
  const [maxPnl, setMaxPnl] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Categorize and filter trades
  const categorizedTrades = useMemo(() => {
    const categories = { 'All': [] };

    Object.keys(INSTRUMENT_CATEGORIES).forEach(category => {
      categories[category] = [];
    });
    categories['Other'] = [];

    // Filter trades based on search and filters
    const filteredTrades = trades.filter(trade => {
      // Search filter
      if (searchTerm && !trade.pair.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // Date range filter
      if (dateFrom && trade.date < dateFrom) return false;
      if (dateTo && trade.date > dateTo) return false;

      // P&L range filter
      const pnl = parseFloat(trade.pnl || 0);
      if (minPnl !== '' && pnl < parseFloat(minPnl)) return false;
      if (maxPnl !== '' && pnl > parseFloat(maxPnl)) return false;

      return true;
    });

    // Add to All category
    categories['All'] = filteredTrades;

    // Categorize filtered trades
    filteredTrades.forEach(trade => {
      const category = getCategoryForInstrument(trade.pair);
      if (categories[category]) {
        categories[category].push(trade);
      }
    });

    return categories;
  }, [trades, searchTerm, dateFrom, dateTo, minPnl, maxPnl]);

  // Get category stats
  const getCategoryStats = (categoryTrades) => {
    const totalPnL = categoryTrades.reduce((sum, t) => sum + parseFloat(t.pnl || 0), 0);
    const wins = categoryTrades.filter(t => parseFloat(t.pnl || 0) > 0).length;
    const losses = categoryTrades.filter(t => parseFloat(t.pnl || 0) < 0).length;
    const winRate = categoryTrades.length > 0 ? (wins / categoryTrades.length * 100) : 0;

    return { totalPnL, wins, losses, winRate, total: categoryTrades.length };
  };

  const filteredTrades = categorizedTrades[selectedCategory] || [];
  const selectedTrade = selectedTradeId ? filteredTrades.find(t => t.id === selectedTradeId) : filteredTrades[0];

  // Auto-select first trade when category changes
  useEffect(() => {
    if (filteredTrades.length > 0 && !filteredTrades.find(t => t.id === selectedTradeId)) {
      setSelectedTradeId(filteredTrades[0].id);
    }
  }, [selectedCategory, filteredTrades, selectedTradeId]);

  const categoryColors = {
    'All': 'purple',
    'Forex Majors': 'blue',
    'Forex Minors': 'cyan',
    'Forex Exotics': 'pink',
    'Commodities': 'orange',
    'Indices': 'green',
    'Metals': 'yellow',
    'Other': 'slate'
  };

  const getColorClasses = (category, isSelected) => {
    const color = categoryColors[category] || 'slate';
    if (isSelected) {
      return {
        blue: 'bg-blue-600 border-blue-500 text-white',
        cyan: 'bg-cyan-600 border-cyan-500 text-white',
        pink: 'bg-pink-600 border-pink-500 text-white',
        orange: 'bg-orange-600 border-orange-500 text-white',
        green: 'bg-green-600 border-green-500 text-white',
        yellow: 'bg-yellow-600 border-yellow-500 text-white',
        purple: 'bg-purple-600 border-purple-500 text-white',
        slate: 'bg-slate-600 border-slate-500 text-white'
      }[color];
    }
    return {
      blue: 'bg-blue-600/20 border-blue-500/30 text-blue-200 hover:bg-blue-600/30',
      cyan: 'bg-cyan-600/20 border-cyan-500/30 text-cyan-200 hover:bg-cyan-600/30',
      pink: 'bg-pink-600/20 border-pink-500/30 text-pink-200 hover:bg-pink-600/30',
      orange: 'bg-orange-600/20 border-orange-500/30 text-orange-200 hover:bg-orange-600/30',
      green: 'bg-green-600/20 border-green-500/30 text-green-200 hover:bg-green-600/30',
      yellow: 'bg-yellow-600/20 border-yellow-500/30 text-yellow-200 hover:bg-yellow-600/30',
      purple: 'bg-purple-600/20 border-purple-500/30 text-purple-200 hover:bg-purple-600/30',
      slate: 'bg-slate-600/20 border-slate-500/30 text-slate-200 hover:bg-slate-600/30'
    }[color];
  };

  if (trades.length === 0) {
    return (
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-12 border border-white/10 text-center">
        <p className="text-slate-400 text-lg">No trades to journal yet</p>
      </div>
    );
  }

  // Export functions
  const exportToCSV = () => {
    const filteredTrades = categorizedTrades[selectedCategory] || [];
    if (filteredTrades.length === 0) {
      alert('No trades to export');
      return;
    }

    const headers = ['Date', 'Pair', 'Type', 'Size', 'Entry', 'Exit', 'P&L', 'Notes', 'Tags', 'Rating', 'Setup Quality', 'Execution Quality', 'Emotions', 'Lessons Learned'];
    const rows = filteredTrades.map(t => [
      t.date,
      t.pair,
      t.type,
      t.size,
      t.entry_price || t.entryPrice,
      t.exit_price || t.exitPrice,
      t.pnl,
      (t.notes || '').replace(/"/g, '""'),
      (typeof t.tags === 'string' ? t.tags : JSON.stringify(t.tags || [])),
      t.rating || '',
      t.setup_quality || t.setupQuality || '',
      t.execution_quality || t.executionQuality || '',
      (typeof t.emotions === 'string' ? t.emotions : JSON.stringify(t.emotions || [])),
      (t.lessons_learned || t.lessonsLearned || '').replace(/"/g, '""')
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trade-journal-${selectedCategory.replace(/\s/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const exportToPDF = () => {
    alert('PDF export coming soon! For now, please use Print (Ctrl+P) to save as PDF from your browser.');
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setDateFrom('');
    setDateTo('');
    setMinPnl('');
    setMaxPnl('');
  };

  const hasActiveFilters = searchTerm || dateFrom || dateTo || minPnl !== '' || maxPnl !== '';

  return (
    <div className="space-y-6">
      {/* Header with Export Buttons */}
      <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold text-white">Trade Journal</h2>
          <div className="flex gap-2">
            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all font-medium text-sm flex items-center gap-2"
            >
              <Download size={16} />
              Export CSV
            </button>
            <button
              onClick={exportToPDF}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all font-medium text-sm flex items-center gap-2"
            >
              <Download size={16} />
              Export PDF
            </button>
          </div>
        </div>
        <p className="text-slate-400">Document your trades with notes, tags, ratings, emotions, and chart screenshots</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Search & Filters</h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-200 rounded-lg transition-all text-sm flex items-center gap-2"
          >
            <Filter size={16} />
            {showFilters ? 'Hide' : 'Show'} Filters
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by currency pair (e.g., EUR/USD, Gold)..."
              className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-slate-800/30 rounded-xl">
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">Date From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">Date To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">Min P&L ($)</label>
              <input
                type="number"
                value={minPnl}
                onChange={(e) => setMinPnl(e.target.value)}
                placeholder="-100"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">Max P&L ($)</label>
              <input
                type="number"
                value={maxPnl}
                onChange={(e) => setMaxPnl(e.target.value)}
                placeholder="1000"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        )}

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <span className="text-slate-400 text-sm">Active filters:</span>
            {searchTerm && (
              <span className="px-3 py-1 bg-purple-600/20 border border-purple-500/30 rounded-full text-purple-200 text-sm">
                Search: {searchTerm}
              </span>
            )}
            {dateFrom && (
              <span className="px-3 py-1 bg-blue-600/20 border border-blue-500/30 rounded-full text-blue-200 text-sm">
                From: {dateFrom}
              </span>
            )}
            {dateTo && (
              <span className="px-3 py-1 bg-blue-600/20 border border-blue-500/30 rounded-full text-blue-200 text-sm">
                To: {dateTo}
              </span>
            )}
            {minPnl !== '' && (
              <span className="px-3 py-1 bg-green-600/20 border border-green-500/30 rounded-full text-green-200 text-sm">
                Min P&L: ${minPnl}
              </span>
            )}
            {maxPnl !== '' && (
              <span className="px-3 py-1 bg-green-600/20 border border-green-500/30 rounded-full text-green-200 text-sm">
                Max P&L: ${maxPnl}
              </span>
            )}
            <button
              onClick={clearAllFilters}
              className="px-3 py-1 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 rounded-full text-red-200 text-sm transition-all"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* Category Filter Pills */}
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">Filter by Instrument</h3>
        <div className="flex flex-wrap gap-3">
          {Object.keys(categorizedTrades).map(category => {
            const stats = getCategoryStats(categorizedTrades[category]);
            const isSelected = selectedCategory === category;

            return (
              <button
                key={category}
                onClick={() => {
                  setSelectedCategory(category);
                  setSelectedTradeId(null);
                }}
                className={`px-4 py-2 rounded-xl border-2 transition-all font-medium ${
                  getColorClasses(category, isSelected)
                } ${isSelected ? 'shadow-lg scale-105' : ''}`}
              >
                <div className="flex items-center gap-2">
                  <span>{category}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    isSelected ? 'bg-white/20' : 'bg-white/10'
                  }`}>
                    {stats.total}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Category Stats */}
        {selectedCategory && categorizedTrades[selectedCategory].length > 0 && (
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            {(() => {
              const stats = getCategoryStats(categorizedTrades[selectedCategory]);
              return (
                <>
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <p className="text-slate-400 text-xs mb-1">Total Trades</p>
                    <p className="text-white text-xl font-bold">{stats.total}</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <p className="text-slate-400 text-xs mb-1">Win Rate</p>
                    <p className={`text-xl font-bold ${stats.winRate >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                      {stats.winRate.toFixed(1)}%
                    </p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <p className="text-slate-400 text-xs mb-1">Total P&L</p>
                    <p className={`text-xl font-bold ${stats.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      ${stats.totalPnL.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <p className="text-slate-400 text-xs mb-1">W/L Ratio</p>
                    <p className="text-white text-xl font-bold">{stats.wins}/{stats.losses}</p>
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </div>

      {/* Trade List and Journal Entry */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trade List (Sidebar) */}
        <div className="lg:col-span-1">
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
            <div className="p-4 border-b border-white/10 bg-white/5">
              <h3 className="text-lg font-semibold text-white">Trades ({filteredTrades.length})</h3>
            </div>
            <div className="max-h-[800px] overflow-y-auto">
              {filteredTrades.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  No trades in this category
                </div>
              ) : (
                filteredTrades.map(trade => (
                  <button
                    key={trade.id}
                    onClick={() => setSelectedTradeId(trade.id)}
                    className={`w-full p-4 text-left border-b border-white/5 transition-all hover:bg-white/5 ${
                      selectedTradeId === trade.id ? 'bg-white/10 border-l-4 border-l-purple-500' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-semibold">{trade.pair}</span>
                      <span className={`text-sm font-bold ${
                        parseFloat(trade.pnl) >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {parseFloat(trade.pnl) >= 0 ? '+' : ''}${parseFloat(trade.pnl).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>{trade.date}</span>
                      <span className="uppercase">{trade.type}</span>
                    </div>
                    {(trade.tags && trade.tags.length > 0) && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {(typeof trade.tags === 'string' ? JSON.parse(trade.tags) : trade.tags).slice(0, 2).map((tag, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-purple-600/30 rounded text-xs text-purple-200">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Journal Entry Form */}
        <div className="lg:col-span-2">
          {selectedTrade ? (
            <TradeJournalCard
              trade={selectedTrade}
              onUpdate={onUpdate}
              apiUrl={apiUrl}
              apiKey={apiKey}
            />
          ) : (
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-12 border border-white/10 text-center">
              <p className="text-slate-400">Select a trade to start journaling</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Trade Journal Card Component
const TradeJournalCard = ({ trade, onUpdate, apiUrl, apiKey }) => {
  const [journalData, setJournalData] = useState({
    notes: trade.notes || '',
    tags: trade.tags || [],
    rating: trade.rating || null,
    setupQuality: trade.setupQuality || trade.setup_quality || null,
    executionQuality: trade.executionQuality || trade.execution_quality || null,
    emotions: trade.emotions || [],
    screenshotUrl: trade.screenshotUrl || trade.screenshot_url || '',
    lessonsLearned: trade.lessonsLearned || trade.lessons_learned || '',
  });

  const [hasChanges, setHasChanges] = useState(false);

  const updateField = (field, value) => {
    setJournalData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    await onUpdate(trade.id, journalData);
    setHasChanges(false);
  };

  return (
    <div className="bg-white/10 rounded-2xl p-6 border border-white/10 space-y-6">
      {/* Trade Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div>
          <h3 className="text-xl font-bold text-white">{trade.pair}</h3>
          <p className="text-slate-400 text-sm">{trade.date} • {trade.type.toUpperCase()}</p>
        </div>
        <div className="text-right">
          <p className={`text-2xl font-bold ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
          </p>
          <p className="text-slate-400 text-sm">{trade.size} lots</p>
        </div>
      </div>

      {/* Notes Section */}
      <div className="space-y-2">
        <label className="block text-slate-300 text-sm font-medium">Trade Notes</label>
        <textarea
          value={journalData.notes}
          onChange={(e) => updateField('notes', e.target.value)}
          placeholder="What happened during this trade? Entry reasoning, market conditions, etc."
          className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
          rows={3}
        />
      </div>

      {/* Tags Section */}
      <TagSelector
        tags={journalData.tags}
        onChange={(tags) => updateField('tags', tags)}
      />

      {/* Ratings Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 bg-slate-800/30 rounded-xl">
        <StarRating
          value={journalData.rating}
          onChange={(value) => updateField('rating', value)}
          label="Overall Rating"
        />
        <StarRating
          value={journalData.setupQuality}
          onChange={(value) => updateField('setupQuality', value)}
          label="Setup Quality"
        />
        <StarRating
          value={journalData.executionQuality}
          onChange={(value) => updateField('executionQuality', value)}
          label="Execution Quality"
        />
      </div>

      {/* Emotions Section */}
      <EmotionsSelector
        emotions={journalData.emotions}
        onChange={(emotions) => updateField('emotions', emotions)}
      />

      {/* Screenshot Section */}
      <ScreenshotUpload
        tradeId={trade.id}
        currentScreenshot={journalData.screenshotUrl}
        onUploadSuccess={(url) => updateField('screenshotUrl', url)}
        onDelete={() => updateField('screenshotUrl', '')}
        apiUrl={apiUrl}
        apiKey={apiKey}
      />

      {/* Lessons Learned Section */}
      <div className="space-y-2">
        <label className="block text-slate-300 text-sm font-medium">Lessons Learned</label>
        <textarea
          value={journalData.lessonsLearned}
          onChange={(e) => updateField('lessonsLearned', e.target.value)}
          placeholder="What did you learn from this trade? What would you do differently?"
          className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
          rows={2}
        />
      </div>

      {/* Save Button */}
      {hasChanges && (
        <button
          onClick={handleSave}
          className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl transition-all font-medium shadow-lg"
        >
          <div className="flex items-center justify-center gap-2">
            <Check size={20} />
            Save Journal Entry
          </div>
        </button>
      )}
    </div>
  );
};

const FXTradingDashboard = () => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Theme & Platform Settings State
  const [theme, setTheme] = useState('dark'); // 'dark' or 'light'
  const [platformSettings, setPlatformSettings] = useState({
    platform_name: 'FX Trading Dashboard',
    logo_url: null,
    favicon_url: null,
    primary_color: '#8b5cf6'
  });

  // Existing State
  const [trades, setTrades] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState('all');
  const [showUpload, setShowUpload] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showEditTrade, setShowEditTrade] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [notification, setNotification] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showScreenshotPrompt, setShowScreenshotPrompt] = useState(false);
  const [newTradeId, setNewTradeId] = useState(null);
  const [showOneClickTrading, setShowOneClickTrading] = useState(false);
  const [showTrailingStop, setShowTrailingStop] = useState(false);
  const [partialCloseTarget, setPartialCloseTarget] = useState(null);
  const [showAIReview, setShowAIReview] = useState(false);
  const [tradeToReview, setTradeToReview] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  // API Configuration
  const [apiUrl, setApiUrl] = useState('https://fx-dashboard-api.ghwmelite.workers.dev');
  const [apiKey, setApiKey] = useState('fx-trading-2024-secure-key');

  // Filter state
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    pair: '',
    type: '',
    minPnl: '',
    maxPnl: '',
    searchTerm: ''
  });

  // Load platform settings
  const loadPlatformSettings = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/settings`);
      const data = await response.json();

      if (data.success) {
        setPlatformSettings(data.settings);
        // Apply theme from settings if available
        if (data.settings.theme_mode) {
          const savedTheme = localStorage.getItem('preferred_theme');
          setTheme(savedTheme || data.settings.theme_mode);
        }
      }
    } catch (error) {
      console.error('Failed to load platform settings:', error);
    }
  };

  // Toggle theme
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('preferred_theme', newTheme);
  };

  // Apply theme to document
  useEffect(() => {
    // Apply theme class to document
    if (theme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }

    // Update favicon if set
    if (platformSettings.favicon_url) {
      let favicon = document.querySelector("link[rel*='icon']");
      if (!favicon) {
        favicon = document.createElement('link');
        favicon.rel = 'icon';
        document.head.appendChild(favicon);
      }
      favicon.href = `${apiUrl}/api/r2/${platformSettings.favicon_url}`;
    }

    // Update page title if set
    if (platformSettings.platform_name) {
      document.title = platformSettings.platform_name;
    }
  }, [theme, platformSettings, apiUrl]);

  // Check for existing auth token on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token');
      const user = localStorage.getItem('auth_user');

      if (token && user) {
        setAuthToken(token);
        setCurrentUser(JSON.parse(user));
        setIsAuthenticated(true);
      }

      // Load platform settings
      await loadPlatformSettings();

      setAuthLoading(false);
    };

    checkAuth();
  }, []);

  // Load config and data on mount
  useEffect(() => {
    if (!isAuthenticated || !authToken) return;

    const savedUrl = localStorage.getItem('fx_api_url');

    // Only override default if saved value exists
    if (savedUrl) setApiUrl(savedUrl);

    // Use current apiUrl (either default or loaded from localStorage)
    const urlToUse = savedUrl || apiUrl;

    if (urlToUse && authToken) {
      loadDataFromAPI(urlToUse, authToken);
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated, authToken]);

  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  // Authentication functions
  // Handle successful login from LoginModal (which handles its own auth)
  const handleLoginSuccess = (user, token) => {
    // Store token and user info
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify(user));

    setAuthToken(token);
    setCurrentUser(user);
    setIsAuthenticated(true);

    showNotification(`Welcome back, ${user.username}!`, 'success');
  };

  const handleLogin = async (username, password, turnstileToken = null) => {
    try {
      // Check if API URL is configured
      if (!apiUrl) {
        throw new Error('API URL not configured. Please configure in Settings.');
      }

      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password, turnstileToken })
      });

      // Check if response is ok
      if (!response.ok) {
        const text = await response.text();
        let errorMessage = 'Login failed';
        try {
          const errorData = JSON.parse(text);
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `Server error: ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Login failed');
      }

      // Store token and user info
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_user', JSON.stringify(data.user));

      setAuthToken(data.token);
      setCurrentUser(data.user);
      setIsAuthenticated(true);

      showNotification(`Welcome back, ${data.user.username}!`, 'success');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setAuthToken(null);
    setCurrentUser(null);
    setIsAuthenticated(false);
    setActiveTab('overview');
    showNotification('Logged out successfully', 'success');
  };

  // API helper function
  const apiCall = async (endpoint, method = 'GET', body = null) => {
    if (!apiUrl || !authToken) {
      throw new Error('API not configured or not authenticated');
    }

    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${apiUrl}${endpoint}`, options);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return response.json();
  };

  // Load data from API
  const loadDataFromAPI = async (url, token) => {
    try {
      setIsLoading(true);

      // Use JWT token for authentication
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const [tradesData, accountsData] = await Promise.all([
        fetch(`${url}/api/trades`, { headers }).then(r => r.json()),
        fetch(`${url}/api/accounts`, { headers }).then(r => r.json())
      ]);
      
      setTrades(tradesData.map(t => ({
        id: t.id,
        date: t.date,
        pair: t.pair,
        type: t.type,
        size: t.size,
        entryPrice: t.entry_price,
        exitPrice: t.exit_price,
        pnl: t.pnl,
        account: t.account_id,
        // Journal fields
        notes: t.notes || '',
        tags: t.tags ? JSON.parse(t.tags) : [],
        rating: t.rating || null,
        setupQuality: t.setup_quality || null,
        executionQuality: t.execution_quality || null,
        emotions: t.emotions ? JSON.parse(t.emotions) : [],
        screenshotUrl: t.screenshot_url || '',
        lessonsLearned: t.lessons_learned || ''
      })));
      
      setAccounts(accountsData.map(a => ({
        id: a.id,
        name: a.name,
        broker: a.broker,
        balance: a.balance
      })));
      
      setIsOnline(true);
      showNotification('Connected to live data!', 'success');
    } catch (error) {
      console.error('Failed to load data:', error);
      setIsOnline(false);
      showNotification('Failed to connect. Check API settings.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Manual trade state
  const [manualTrade, setManualTrade] = useState({
    date: new Date().toISOString().split('T')[0],
    pair: 'EUR/USD',
    type: 'buy',
    size: '',
    entryPrice: '',
    exitPrice: '',
    pnl: '',
    accountId: 1
  });

  // Apply filters to trades
  const filteredAndSearchedTrades = useMemo(() => {
    let filtered = trades;

    // Account filter
    if (selectedAccount !== 'all') {
      filtered = filtered.filter(t => t.account === parseInt(selectedAccount));
    }

    // Date range filter
    if (filters.dateFrom) {
      filtered = filtered.filter(t => t.date >= filters.dateFrom);
    }
    if (filters.dateTo) {
      filtered = filtered.filter(t => t.date <= filters.dateTo);
    }

    // Pair filter
    if (filters.pair) {
      filtered = filtered.filter(t => 
        t.pair.toLowerCase().includes(filters.pair.toLowerCase())
      );
    }

    // Type filter
    if (filters.type) {
      filtered = filtered.filter(t => t.type === filters.type);
    }

    // P&L range filter
    if (filters.minPnl !== '') {
      filtered = filtered.filter(t => t.pnl >= parseFloat(filters.minPnl));
    }
    if (filters.maxPnl !== '') {
      filtered = filtered.filter(t => t.pnl <= parseFloat(filters.maxPnl));
    }

    // Search term (searches in pair, date, type)
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(t => 
        t.pair.toLowerCase().includes(searchLower) ||
        t.date.includes(searchLower) ||
        t.type.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [trades, selectedAccount, filters]);

  // Sort trades by date (most recent first) and ID as tiebreaker
  const sortedTrades = useMemo(() => {
    return [...filteredAndSearchedTrades].sort((a, b) => {
      // First sort by date (descending - most recent first)
      const dateCompare = new Date(b.date) - new Date(a.date);
      if (dateCompare !== 0) return dateCompare;
      // If dates are equal, sort by ID (descending - highest ID first)
      return b.id - a.id;
    });
  }, [filteredAndSearchedTrades]);

  // Pagination logic
  const totalPages = Math.ceil(sortedTrades.length / itemsPerPage);
  const paginatedTrades = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedTrades.slice(startIndex, endIndex);
  }, [sortedTrades, currentPage, itemsPerPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, selectedAccount]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Don't trigger if user is typing in an input/textarea
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      // Close modals with Escape
      if (e.key === 'Escape') {
        if (showShortcutsHelp) setShowShortcutsHelp(false);
        else if (showCalculator) setShowCalculator(false);
        else if (showOneClickTrading) setShowOneClickTrading(false);
        else if (showTrailingStop) setShowTrailingStop(false);
        else if (partialCloseTarget) setPartialCloseTarget(null);
        else if (showSettings) setShowSettings(false);
        else if (showEditTrade) setShowEditTrade(false);
        else if (showDeleteConfirm) setShowDeleteConfirm(false);
        else if (showManualEntry) setShowManualEntry(false);
        else if (showUpload) setShowUpload(false);
        return;
      }

      // Show shortcuts help with ?
      if (e.key === '?' && !showShortcutsHelp) {
        e.preventDefault();
        setShowShortcutsHelp(true);
        return;
      }

      // Navigation shortcuts (numbers 1-5)
      if (e.key >= '1' && e.key <= '5' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        const tabs = ['overview', 'trades', 'analytics', 'risk', 'journal', 'psychology'];
        if (currentUser) {
          if (e.key === '5' && currentUser.role === 'admin') {
            setActiveTab('admin');
          } else if (parseInt(e.key) <= tabs.length) {
            setActiveTab(tabs[parseInt(e.key) - 1]);
          }
        }
        return;
      }

      // New trade with N
      if ((e.key === 'n' || e.key === 'N') && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setShowManualEntry(true);
        return;
      }

      // Toggle filters with F
      if ((e.key === 'f' || e.key === 'F') && !e.ctrlKey && !e.metaKey && activeTab === 'trades') {
        e.preventDefault();
        setShowFilters(!showFilters);
        return;
      }

      // Focus search with S (Ctrl/Cmd + K also works)
      if (((e.key === 's' || e.key === 'S') && !e.ctrlKey && !e.metaKey) ||
          ((e.ctrlKey || e.metaKey) && e.key === 'k')) {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Search"]');
        if (searchInput) searchInput.focus();
        return;
      }

      // Export with E
      if ((e.key === 'e' || e.key === 'E') && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        handleExport();
        return;
      }

      // Toggle Calculator with C
      if ((e.key === 'c' || e.key === 'C') && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setShowCalculator(!showCalculator);
        return;
      }

      // Toggle One-Click Trading with Q
      if ((e.key === 'q' || e.key === 'Q') && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setShowOneClickTrading(!showOneClickTrading);
        return;
      }

      // Toggle Trailing Stop with T
      if ((e.key === 't' || e.key === 'T') && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setShowTrailingStop(!showTrailingStop);
        return;
      }

      // Previous page with Left Arrow
      if (e.key === 'ArrowLeft' && !e.ctrlKey && !e.metaKey && currentPage > 1) {
        e.preventDefault();
        setCurrentPage(currentPage - 1);
        return;
      }

      // Next page with Right Arrow
      if (e.key === 'ArrowRight' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        const maxPage = Math.ceil(filteredAndSearchedTrades.length / itemsPerPage);
        if (currentPage < maxPage) {
          setCurrentPage(currentPage + 1);
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showShortcutsHelp, showCalculator, showOneClickTrading, showTrailingStop, partialCloseTarget, showSettings, showEditTrade, showDeleteConfirm, showManualEntry,
      showUpload, showFilters, activeTab, currentPage, itemsPerPage, filteredAndSearchedTrades,
      currentUser]);

  // Calculate comprehensive analytics
  const analytics = useMemo(() => {
    const filteredTrades = filteredAndSearchedTrades;

    const totalPnL = filteredTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const winningTrades = filteredTrades.filter(t => (t.pnl || 0) > 0);
    const losingTrades = filteredTrades.filter(t => (t.pnl || 0) < 0);
    const winRate = filteredTrades.length > 0 
      ? (winningTrades.length / filteredTrades.length * 100).toFixed(1)
      : 0;

    // Only show balance if user has trades, otherwise show 0 until accounts are connected
    const totalBalance = filteredTrades.length === 0
      ? 0
      : selectedAccount === 'all'
        ? accounts.reduce((sum, acc) => sum + acc.balance, 0)
        : accounts.find(acc => acc.id === parseInt(selectedAccount))?.balance || 0;

    // Pair performance
    const pairPerformance = {};
    filteredTrades.forEach(trade => {
      if (!pairPerformance[trade.pair]) {
        pairPerformance[trade.pair] = { pnl: 0, count: 0, wins: 0, losses: 0 };
      }
      pairPerformance[trade.pair].pnl += trade.pnl || 0;
      pairPerformance[trade.pair].count += 1;
      if (trade.pnl > 0) pairPerformance[trade.pair].wins += 1;
      else if (trade.pnl < 0) pairPerformance[trade.pair].losses += 1;
    });

    const topPairs = Object.entries(pairPerformance)
      .sort(([, a], [, b]) => b.pnl - a.pnl)
      .slice(0, 6);

    // Daily P&L for chart
    const dailyPnL = {};
    filteredTrades.forEach(trade => {
      if (!dailyPnL[trade.date]) {
        dailyPnL[trade.date] = 0;
      }
      dailyPnL[trade.date] += trade.pnl || 0;
    });

    const chartData = Object.entries(dailyPnL)
      .sort(([a], [b]) => new Date(a) - new Date(b))
      .map(([date, pnl]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        pnl: parseFloat(pnl.toFixed(2))
      }));

    // Cumulative P&L
    let cumulative = 0;
    const cumulativeData = chartData.map(item => {
      cumulative += item.pnl;
      return { ...item, cumulative: parseFloat(cumulative.toFixed(2)) };
    });

    // Pie chart data
    const pieData = topPairs.map(([pair, data]) => ({
      name: pair,
      value: Math.abs(data.pnl),
      color: data.pnl >= 0 ? '#10b981' : '#ef4444'
    }));

    const avgWin = winningTrades.length > 0 
      ? winningTrades.reduce((sum, t) => sum + t.pnl, 0) / winningTrades.length 
      : 0;
    
    const avgLoss = losingTrades.length > 0 
      ? Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0) / losingTrades.length)
      : 0;

    const profitFactor = avgLoss > 0 ? (avgWin / avgLoss).toFixed(2) : 'N/A';

    // === ADVANCED ANALYTICS ===

    // 1. Time of Day Analysis (hourly breakdown)
    const timeOfDayData = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      trades: 0,
      wins: 0,
      losses: 0,
      pnl: 0
    }));

    filteredTrades.forEach(trade => {
      if (trade.time) {
        const hour = parseInt(trade.time.split(':')[0]);
        if (hour >= 0 && hour < 24) {
          timeOfDayData[hour].trades++;
          timeOfDayData[hour].pnl += trade.pnl || 0;
          if (trade.pnl > 0) timeOfDayData[hour].wins++;
          else if (trade.pnl < 0) timeOfDayData[hour].losses++;
        }
      }
    });

    const timeOfDayAnalysis = timeOfDayData.map(d => ({
      ...d,
      winRate: d.trades > 0 ? ((d.wins / d.trades) * 100).toFixed(1) : 0,
      hourLabel: `${d.hour.toString().padStart(2, '0')}:00`
    }));

    // 2. Weekday Analysis
    const weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const weekdayData = weekdayNames.map(day => ({
      day,
      trades: 0,
      wins: 0,
      losses: 0,
      pnl: 0
    }));

    filteredTrades.forEach(trade => {
      const dayIndex = new Date(trade.date).getDay();
      weekdayData[dayIndex].trades++;
      weekdayData[dayIndex].pnl += trade.pnl || 0;
      if (trade.pnl > 0) weekdayData[dayIndex].wins++;
      else if (trade.pnl < 0) weekdayData[dayIndex].losses++;
    });

    const weekdayAnalysis = weekdayData.map(d => ({
      ...d,
      winRate: d.trades > 0 ? ((d.wins / d.trades) * 100).toFixed(1) : 0,
      avgPnl: d.trades > 0 ? (d.pnl / d.trades).toFixed(2) : 0
    }));

    // 3. Trading Session Analysis (GMT-based)
    const sessions = [
      { name: 'Asian', start: 0, end: 8, emoji: '🌏' },
      { name: 'London', start: 8, end: 16, emoji: '🇬🇧' },
      { name: 'New York', start: 13, end: 21, emoji: '🗽' },
      { name: 'Pacific', start: 21, end: 24, emoji: '🌊' }
    ];

    const sessionData = sessions.map(session => ({
      ...session,
      trades: 0,
      wins: 0,
      losses: 0,
      pnl: 0
    }));

    filteredTrades.forEach(trade => {
      if (trade.time) {
        const hour = parseInt(trade.time.split(':')[0]);
        sessionData.forEach(session => {
          if (hour >= session.start && hour < session.end) {
            session.trades++;
            session.pnl += trade.pnl || 0;
            if (trade.pnl > 0) session.wins++;
            else if (trade.pnl < 0) session.losses++;
          }
        });
      }
    });

    const sessionAnalysis = sessionData.map(s => ({
      ...s,
      winRate: s.trades > 0 ? ((s.wins / s.trades) * 100).toFixed(1) : 0,
      avgPnl: s.trades > 0 ? (s.pnl / s.trades).toFixed(2) : 0
    })).filter(s => s.trades > 0);

    // 4. Monthly P&L Calendar
    const monthlyData = {};
    filteredTrades.forEach(trade => {
      const monthKey = trade.date.substring(0, 7); // YYYY-MM
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { pnl: 0, trades: 0, wins: 0 };
      }
      monthlyData[monthKey].pnl += trade.pnl || 0;
      monthlyData[monthKey].trades++;
      if (trade.pnl > 0) monthlyData[monthKey].wins++;
    });

    const monthlyCalendar = Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        ...data,
        winRate: data.trades > 0 ? ((data.wins / data.trades) * 100).toFixed(1) : 0,
        monthLabel: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // 5. Drawdown Analysis (equity curve)
    const sortedTrades = [...filteredTrades].sort((a, b) =>
      new Date(a.date + ' ' + (a.time || '00:00')) - new Date(b.date + ' ' + (b.time || '00:00'))
    );

    let runningEquity = 0;
    let peak = 0;
    const drawdownData = sortedTrades.map(trade => {
      runningEquity += trade.pnl || 0;
      if (runningEquity > peak) peak = runningEquity;
      const drawdown = runningEquity - peak;
      const drawdownPercent = peak > 0 ? (drawdown / peak) * 100 : 0;

      return {
        date: trade.date,
        equity: parseFloat(runningEquity.toFixed(2)),
        drawdown: parseFloat(drawdown.toFixed(2)),
        drawdownPercent: parseFloat(drawdownPercent.toFixed(2)),
        peak: parseFloat(peak.toFixed(2))
      };
    });

    const maxDrawdownPoint = drawdownData.reduce((max, curr) =>
      curr.drawdown < max.drawdown ? curr : max,
      { drawdown: 0 }
    );

    // 6. Trade Duration Analysis
    const durationBuckets = [
      { label: '< 1 hour', max: 1 },
      { label: '1-4 hours', min: 1, max: 4 },
      { label: '4-24 hours', min: 4, max: 24 },
      { label: '1-7 days', min: 24, max: 168 },
      { label: '> 7 days', min: 168 }
    ];

    const durationData = durationBuckets.map(bucket => ({
      ...bucket,
      trades: 0,
      wins: 0,
      pnl: 0
    }));

    filteredTrades.forEach(trade => {
      if (trade.entry_time && trade.exit_time) {
        const entryDate = new Date(trade.date + ' ' + trade.entry_time);
        const exitDate = new Date(trade.exit_date ? trade.exit_date + ' ' + trade.exit_time : trade.date + ' ' + trade.exit_time);
        const durationHours = (exitDate - entryDate) / (1000 * 60 * 60);

        durationBuckets.forEach((bucket, index) => {
          const inBucket =
            (bucket.max && durationHours < bucket.max && (!bucket.min || durationHours >= bucket.min)) ||
            (bucket.min && !bucket.max && durationHours >= bucket.min);

          if (inBucket) {
            durationData[index].trades++;
            durationData[index].pnl += trade.pnl || 0;
            if (trade.pnl > 0) durationData[index].wins++;
          }
        });
      }
    });

    const durationAnalysis = durationData.map(d => ({
      ...d,
      winRate: d.trades > 0 ? ((d.wins / d.trades) * 100).toFixed(1) : 0,
      avgPnl: d.trades > 0 ? (d.pnl / d.trades).toFixed(2) : 0
    })).filter(d => d.trades > 0);

    // 7. Best/Worst Hours
    const activeHours = timeOfDayAnalysis.filter(h => h.trades >= 3);
    const bestHour = activeHours.reduce((best, curr) =>
      curr.pnl > best.pnl ? curr : best,
      { pnl: -Infinity, hour: 0 }
    );
    const worstHour = activeHours.reduce((worst, curr) =>
      curr.pnl < worst.pnl ? curr : worst,
      { pnl: Infinity, hour: 0 }
    );

    // 8. Best/Worst Days
    const activeDays = weekdayAnalysis.filter(d => d.trades >= 3);
    const bestDay = activeDays.reduce((best, curr) =>
      curr.pnl > best.pnl ? curr : best,
      { pnl: -Infinity, day: 'N/A' }
    );
    const worstDay = activeDays.reduce((worst, curr) =>
      curr.pnl < worst.pnl ? curr : worst,
      { pnl: Infinity, day: 'N/A' }
    );

    return {
      totalPnL,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate,
      totalBalance,
      avgWin,
      avgLoss,
      profitFactor,
      topPairs,
      chartData: cumulativeData,
      pieData,
      totalTrades: filteredTrades.length,
      trades: filteredTrades,
      // Advanced Analytics
      timeOfDayAnalysis,
      weekdayAnalysis,
      sessionAnalysis,
      monthlyCalendar,
      drawdownData,
      maxDrawdownPoint,
      durationAnalysis,
      bestHour,
      worstHour,
      bestDay,
      worstDay
    };
  }, [filteredAndSearchedTrades, selectedAccount, accounts]);

  // Calculate advanced risk metrics
  const riskMetrics = useMemo(() => {
    const filteredTrades = filteredAndSearchedTrades;

    if (filteredTrades.length === 0) {
      return {
        maxDrawdown: 0,
        maxDrawdownPercent: 0,
        sharpeRatio: 0,
        sortinoRatio: 0,
        calmarRatio: 0,
        mae: 0,
        mfe: 0,
        avgRiskReward: 0,
        longestWinStreak: 0,
        longestLoseStreak: 0,
        currentStreak: 0,
        currentStreakType: 'none',
        avgTradeDuration: 0,
        bestTrade: null,
        worstTrade: null,
        expectancy: 0,
        recoveryFactor: 0,
        profitableMonths: 0,
        totalMonths: 0,
        volatility: 0,
        valueAtRisk: 0,
        drawdownData: [],
        rrDistribution: []
      };
    }

    // Sort trades chronologically for calculations
    const chronologicalTrades = [...filteredTrades].sort((a, b) => {
      const dateCompare = new Date(a.date) - new Date(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.id - b.id;
    });

    // Calculate equity curve and drawdown
    let peak = 0;
    let maxDrawdown = 0;
    let maxDrawdownPercent = 0;
    let equity = 0;
    const equityCurve = [];
    const drawdownData = [];

    chronologicalTrades.forEach((trade, index) => {
      equity += trade.pnl || 0;

      if (equity > peak) {
        peak = equity;
      }

      const drawdown = peak - equity;
      const drawdownPercent = peak !== 0 ? (drawdown / Math.abs(peak)) * 100 : 0;

      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }

      if (drawdownPercent > maxDrawdownPercent) {
        maxDrawdownPercent = drawdownPercent;
      }

      equityCurve.push(equity);
      drawdownData.push({
        date: trade.date,
        drawdown: -Math.abs(drawdown),
        drawdownPercent: -Math.abs(drawdownPercent)
      });
    });

    // Calculate returns for Sharpe/Sortino
    const returns = [];
    for (let i = 0; i < equityCurve.length; i++) {
      if (i === 0) {
        returns.push(equityCurve[i]);
      } else {
        returns.push(equityCurve[i] - equityCurve[i - 1]);
      }
    }

    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const volatility = Math.sqrt(variance);

    // Sharpe Ratio (assuming risk-free rate of 0 for simplicity)
    const sharpeRatio = volatility !== 0 ? (avgReturn / volatility) : 0;

    // Sortino Ratio (downside deviation only)
    const negativeReturns = returns.filter(r => r < 0);
    const downsideVariance = negativeReturns.length > 0
      ? negativeReturns.reduce((sum, r) => sum + Math.pow(r, 2), 0) / negativeReturns.length
      : 0;
    const downsideDeviation = Math.sqrt(downsideVariance);
    const sortinoRatio = downsideDeviation !== 0 ? (avgReturn / downsideDeviation) : 0;

    // Calmar Ratio (return / max drawdown)
    const totalReturn = equityCurve[equityCurve.length - 1] || 0;
    const calmarRatio = maxDrawdown !== 0 ? (totalReturn / maxDrawdown) : 0;

    // MAE (Maximum Adverse Excursion) and MFE (Maximum Favorable Excursion)
    // Simplified: using actual trade P&L
    const winningTrades = chronologicalTrades.filter(t => t.pnl > 0);
    const losingTrades = chronologicalTrades.filter(t => t.pnl < 0);

    const mae = losingTrades.length > 0
      ? Math.min(...losingTrades.map(t => t.pnl))
      : 0;

    const mfe = winningTrades.length > 0
      ? Math.max(...winningTrades.map(t => t.pnl))
      : 0;

    // Win/Loss Streaks
    let currentStreak = 0;
    let currentStreakType = 'none';
    let longestWinStreak = 0;
    let longestLoseStreak = 0;
    let tempWinStreak = 0;
    let tempLoseStreak = 0;

    chronologicalTrades.forEach(trade => {
      if (trade.pnl > 0) {
        tempWinStreak++;
        tempLoseStreak = 0;
        if (tempWinStreak > longestWinStreak) {
          longestWinStreak = tempWinStreak;
        }
      } else if (trade.pnl < 0) {
        tempLoseStreak++;
        tempWinStreak = 0;
        if (tempLoseStreak > longestLoseStreak) {
          longestLoseStreak = tempLoseStreak;
        }
      }
    });

    // Current streak (based on most recent trades)
    const lastTrade = chronologicalTrades[chronologicalTrades.length - 1];
    if (lastTrade) {
      if (lastTrade.pnl > 0) {
        currentStreakType = 'win';
        for (let i = chronologicalTrades.length - 1; i >= 0; i--) {
          if (chronologicalTrades[i].pnl > 0) {
            currentStreak++;
          } else {
            break;
          }
        }
      } else if (lastTrade.pnl < 0) {
        currentStreakType = 'loss';
        for (let i = chronologicalTrades.length - 1; i >= 0; i--) {
          if (chronologicalTrades[i].pnl < 0) {
            currentStreak++;
          } else {
            break;
          }
        }
      }
    }

    // Risk/Reward Ratio
    const avgWin = winningTrades.length > 0
      ? winningTrades.reduce((sum, t) => sum + t.pnl, 0) / winningTrades.length
      : 0;

    const avgLoss = losingTrades.length > 0
      ? Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0) / losingTrades.length)
      : 0;

    const avgRiskReward = avgLoss !== 0 ? avgWin / avgLoss : 0;

    // R/R Distribution for chart
    const rrDistribution = chronologicalTrades.map(trade => ({
      date: trade.date,
      rr: trade.pnl || 0,
      type: trade.pnl > 0 ? 'Win' : trade.pnl < 0 ? 'Loss' : 'Breakeven'
    }));

    // Best and Worst Trades
    const bestTrade = chronologicalTrades.reduce((best, trade) =>
      (trade.pnl > (best?.pnl || -Infinity)) ? trade : best, null);

    const worstTrade = chronologicalTrades.reduce((worst, trade) =>
      (trade.pnl < (worst?.pnl || Infinity)) ? trade : worst, null);

    // Average Trade Duration (simplified: days between first and last trade / number of trades)
    if (chronologicalTrades.length > 1) {
      const firstDate = new Date(chronologicalTrades[0].date);
      const lastDate = new Date(chronologicalTrades[chronologicalTrades.length - 1].date);
      const daysDiff = (lastDate - firstDate) / (1000 * 60 * 60 * 24);
      var avgTradeDuration = daysDiff / chronologicalTrades.length;
    } else {
      var avgTradeDuration = 0;
    }

    // Expectancy: Average expected profit per trade
    const winRate = winningTrades.length / chronologicalTrades.length;
    const lossRate = 1 - winRate;
    const expectancy = (winRate * avgWin) - (lossRate * avgLoss);

    // Recovery Factor: Total Profit / Max Drawdown
    const recoveryFactor = maxDrawdown !== 0 ? (totalReturn / maxDrawdown) : 0;

    // Value at Risk (95% confidence - simplified using percentile)
    const sortedReturns = [...returns].sort((a, b) => a - b);
    const varIndex = Math.floor(sortedReturns.length * 0.05);
    const valueAtRisk = sortedReturns[varIndex] || 0;

    // Monthly profitability
    const monthlyPnL = {};
    chronologicalTrades.forEach(trade => {
      const monthKey = trade.date.substring(0, 7); // YYYY-MM
      if (!monthlyPnL[monthKey]) {
        monthlyPnL[monthKey] = 0;
      }
      monthlyPnL[monthKey] += trade.pnl || 0;
    });

    const profitableMonths = Object.values(monthlyPnL).filter(pnl => pnl > 0).length;
    const totalMonths = Object.keys(monthlyPnL).length;

    return {
      maxDrawdown: parseFloat(maxDrawdown.toFixed(2)),
      maxDrawdownPercent: parseFloat(maxDrawdownPercent.toFixed(2)),
      sharpeRatio: parseFloat(sharpeRatio.toFixed(2)),
      sortinoRatio: parseFloat(sortinoRatio.toFixed(2)),
      calmarRatio: parseFloat(calmarRatio.toFixed(2)),
      mae: parseFloat(mae.toFixed(2)),
      mfe: parseFloat(mfe.toFixed(2)),
      avgRiskReward: parseFloat(avgRiskReward.toFixed(2)),
      longestWinStreak,
      longestLoseStreak,
      currentStreak,
      currentStreakType,
      avgTradeDuration: parseFloat(avgTradeDuration.toFixed(1)),
      bestTrade,
      worstTrade,
      expectancy: parseFloat(expectancy.toFixed(2)),
      recoveryFactor: parseFloat(recoveryFactor.toFixed(2)),
      profitableMonths,
      totalMonths,
      volatility: parseFloat(volatility.toFixed(2)),
      valueAtRisk: parseFloat(valueAtRisk.toFixed(2)),
      drawdownData: drawdownData.slice(-30), // Last 30 data points for chart
      rrDistribution: rrDistribution.slice(-50) // Last 50 trades for R/R chart
    };
  }, [filteredAndSearchedTrades]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      // Dynamic import XLSX only when needed
      const XLSX = await import('xlsx');
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const newTrades = jsonData.map((row) => ({
        date: row.Date || row.date || new Date().toISOString().split('T')[0],
        pair: row.Pair || row.pair || row.Symbol || row.symbol || 'Unknown',
        type: (row.Type || row.type || row.Side || row.side || 'buy').toLowerCase(),
        size: parseFloat(row.Size || row.size || row.Lots || row.lots || 0),
        entryPrice: parseFloat(row['Entry Price'] || row.entryPrice || row.Open || row.open || 0),
        exitPrice: parseFloat(row['Exit Price'] || row.exitPrice || row.Close || row.close || 0),
        pnl: parseFloat(row.PnL || row.pnl || row['P&L'] || row.Profit || row.profit || 0),
        accountId: parseInt(selectedAccount === 'all' ? (accounts[0]?.id || 1) : selectedAccount)
      }));

      if (isOnline) {
        await apiCall('/api/trades/bulk', 'POST', { trades: newTrades });
        await loadDataFromAPI(apiUrl, authToken);
      } else {
        setTrades([...trades, ...newTrades.map((t, i) => ({ ...t, id: trades.length + i + 1, account: t.accountId }))]);
      }

      setShowUpload(false);
      showNotification(`Successfully imported ${newTrades.length} trades`, 'success');
      e.target.value = '';
    } catch (error) {
      showNotification('Error importing file. Please check the format.', 'error');
    }
  };

  // Handle one-click trade execution
  const handleOneClickTrade = async (trade) => {
    const newTrade = {
      ...trade,
      id: Date.now(),
      outcome: 'pending',
      pnl: 0,
      entryPrice: 0,
      exitPrice: 0,
      commission: 0,
      strategy: '',
      emotion: 'neutral',
      notes: trade.notes || '',
      screenshot_url: null
    };

    if (isOnline && authToken) {
      try {
        const response = await apiCall('/api/trades', 'POST', newTrade);
        if (response.success && response.trade) {
          setTrades([...trades, response.trade]);
          showNotification(`${trade.type.toUpperCase()} order opened: ${trade.pair} ${trade.size} lots`, 'success');
        }
      } catch (error) {
        console.error('One-click trade error:', error);
        showNotification('Failed to execute trade', 'error');
      }
    } else {
      setTrades([...trades, newTrade]);
      showNotification(`${trade.type.toUpperCase()} order opened (offline): ${trade.pair} ${trade.size} lots`, 'success');
    }
  };

  // Handle partial close
  const handlePartialClose = async ({ tradeId, closeLots, closePercent, remainingLots }) => {
    const trade = trades.find(t => t.id === tradeId);
    if (!trade) return;

    // Create a new trade entry for the closed portion
    const closedTrade = {
      ...trade,
      id: Date.now(),
      size: closeLots,
      notes: `Partial close (${closePercent.toFixed(0)}%) of trade #${tradeId}. ${trade.notes || ''}`.trim(),
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0].substring(0, 5)
    };

    // Update the original trade with remaining size
    const updatedTrade = {
      ...trade,
      size: remainingLots,
      notes: `${trade.notes || ''} [Partially closed: ${closeLots} lots at ${closePercent.toFixed(0)}%]`.trim()
    };

    if (isOnline && authToken) {
      try {
        // Save closed portion
        const closeResponse = await apiCall('/api/trades', 'POST', closedTrade);
        // Update original with remaining
        const updateResponse = await apiCall(`/api/trades/${tradeId}`, 'PUT', updatedTrade);

        if (closeResponse.success && updateResponse.success) {
          const updatedTrades = trades.map(t =>
            t.id === tradeId ? updateResponse.trade : t
          );
          if (closeResponse.trade) {
            updatedTrades.push(closeResponse.trade);
          }
          setTrades(updatedTrades);
          showNotification(`Closed ${closeLots} lots (${closePercent.toFixed(0)}%). ${remainingLots} lots remaining.`, 'success');
        }
      } catch (error) {
        console.error('Partial close error:', error);
        showNotification('Failed to close position', 'error');
      }
    } else {
      const updatedTrades = trades.map(t =>
        t.id === tradeId ? updatedTrade : t
      );
      updatedTrades.push(closedTrade);
      setTrades(updatedTrades);
      showNotification(`Closed ${closeLots} lots (${closePercent.toFixed(0)}%) - offline`, 'success');
    }
  };

  const handleManualSubmit = async () => {
    if (!manualTrade.size || !manualTrade.entryPrice || !manualTrade.exitPrice || !manualTrade.pnl) {
      showNotification('Please fill in all required fields', 'error');
      return;
    }

    const newTrade = {
      ...manualTrade,
      size: parseFloat(manualTrade.size),
      entryPrice: parseFloat(manualTrade.entryPrice),
      exitPrice: parseFloat(manualTrade.exitPrice),
      pnl: parseFloat(manualTrade.pnl),
      accountId: parseInt(manualTrade.accountId)
    };

    try {
      let createdTradeId = null;

      if (isOnline) {
        const response = await apiCall('/api/trades', 'POST', newTrade);
        if (response.success && response.trade) {
          createdTradeId = response.trade.id;
        }
        await loadDataFromAPI(apiUrl, authToken);
      } else {
        const newId = trades.length + 1;
        setTrades([...trades, { ...newTrade, id: newId, account: newTrade.accountId }]);
        createdTradeId = newId;
      }

      setShowManualEntry(false);
      showNotification('Trade added successfully! Add a screenshot?', 'success');

      // Show screenshot prompt
      if (createdTradeId) {
        setNewTradeId(createdTradeId);
        setTimeout(() => setShowScreenshotPrompt(true), 300);
      }

      setManualTrade({
        date: new Date().toISOString().split('T')[0],
        pair: 'EUR/USD',
        type: 'buy',
        size: '',
        entryPrice: '',
        exitPrice: '',
        pnl: '',
        accountId: accounts[0]?.id || 1
      });
    } catch (error) {
      showNotification('Error adding trade: ' + error.message, 'error');
    }
  };

  const handleEditTrade = async () => {
    if (!selectedTrade || !selectedTrade.size || !selectedTrade.entryPrice || !selectedTrade.exitPrice || !selectedTrade.pnl) {
      showNotification('Please fill in all required fields', 'error');
      return;
    }

    const updatedTrade = {
      ...selectedTrade,
      size: parseFloat(selectedTrade.size),
      entryPrice: parseFloat(selectedTrade.entryPrice),
      exitPrice: parseFloat(selectedTrade.exitPrice),
      pnl: parseFloat(selectedTrade.pnl),
      accountId: parseInt(selectedTrade.account)
    };

    try {
      if (isOnline) {
        await apiCall(`/api/trades/${selectedTrade.id}`, 'PUT', updatedTrade);
        await loadDataFromAPI(apiUrl, authToken);
      } else {
        setTrades(trades.map(t => 
          t.id === selectedTrade.id ? { ...t, ...updatedTrade, account: updatedTrade.accountId } : t
        ));
      }

      setShowEditTrade(false);
      setSelectedTrade(null);
      showNotification('Trade updated successfully', 'success');
    } catch (error) {
      showNotification('Error updating trade: ' + error.message, 'error');
    }
  };

  const handleDeleteTrade = async () => {
    if (!selectedTrade) return;

    try {
      if (isOnline) {
        await apiCall(`/api/trades/${selectedTrade.id}`, 'DELETE');
        await loadDataFromAPI(apiUrl, authToken);
      } else {
        setTrades(trades.filter(t => t.id !== selectedTrade.id));
      }

      setShowDeleteConfirm(false);
      setSelectedTrade(null);
      showNotification('Trade deleted successfully', 'success');
    } catch (error) {
      showNotification('Error deleting trade: ' + error.message, 'error');
    }
  };

  const updateTradeJournal = async (tradeId, journalData) => {
    try {
      if (isOnline) {
        // Convert camelCase to snake_case for API
        const apiPayload = {
          notes: journalData.notes,
          tags: journalData.tags,
          rating: journalData.rating,
          setupQuality: journalData.setupQuality,
          executionQuality: journalData.executionQuality,
          emotions: journalData.emotions,
          lessonsLearned: journalData.lessonsLearned,
          screenshotUrl: journalData.screenshotUrl
        };
        await apiCall(`/api/trades/${tradeId}/journal`, 'PATCH', apiPayload);
        await loadDataFromAPI(apiUrl, authToken);
        showNotification('Journal updated successfully', 'success');
      } else {
        // Update local state in offline mode
        setTrades(trades.map(t =>
          t.id === tradeId ? { ...t, ...journalData } : t
        ));
        showNotification('Journal updated (offline)', 'success');
      }
    } catch (error) {
      showNotification('Failed to update journal: ' + error.message, 'error');
    }
  };

  const openEditModal = (trade) => {
    setSelectedTrade({ ...trade });
    setShowEditTrade(true);
  };

  const openDeleteConfirm = (trade) => {
    setSelectedTrade(trade);
    setShowDeleteConfirm(true);
  };

  const clearFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      pair: '',
      type: '',
      minPnl: '',
      maxPnl: '',
      searchTerm: ''
    });
  };

  const hasActiveFilters = () => {
    return filters.dateFrom || filters.dateTo || filters.pair || filters.type || 
           filters.minPnl !== '' || filters.maxPnl !== '' || filters.searchTerm;
  };

  const handleExport = async () => {
    try {
      // Dynamic import XLSX only when exporting
      const XLSX = await import('xlsx');
      const exportData = filteredAndSearchedTrades.map(t => ({
        Date: t.date,
        Pair: t.pair,
        Type: t.type,
        Size: t.size,
        'Entry Price': t.entryPrice,
        'Exit Price': t.exitPrice,
        'P&L': t.pnl,
        Account: accounts.find(a => a.id === t.account)?.name || 'Unknown'
      }));
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Trades');
      XLSX.writeFile(wb, `fx-trades-${new Date().toISOString().split('T')[0]}.xlsx`);
      showNotification('Data exported successfully', 'success');
    } catch (error) {
      showNotification('Export failed', 'error');
    }
  };

  const saveApiConfig = () => {
    localStorage.setItem('fx_api_url', apiUrl);
    localStorage.setItem('fx_api_key', apiKey);
    setShowSettings(false);
    if (apiUrl && apiKey) {
      loadDataFromAPI(apiUrl, authToken);
    }
  };

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
        <ForexLoader message="Initializing FX Trading Platform" />
      </Suspense>
    );
  }

  // Show landing page if not authenticated
  if (!isAuthenticated) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center"><div className="text-white text-xl">Loading...</div></div>}>
        <LandingPage onLoginClick={() => setShowLoginModal(true)} />
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onLogin={handleLoginSuccess}
          apiUrl={apiUrl}
        />
      </Suspense>
    );
  }

  // Show loading while fetching data
  if (isLoading) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
        <ForexLoader message="Loading your trading data..." />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Animated background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-slate-950 to-blue-900/20 pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-700/10 via-transparent to-transparent pointer-events-none" />
      
      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-xl shadow-2xl backdrop-blur-xl border transform transition-all duration-300 ${
          notification.type === 'success' 
            ? 'bg-green-500/20 border-green-500/50 text-green-100' 
            : 'bg-red-500/20 border-red-500/50 text-red-100'
        }`}>
          <div className="flex items-center gap-3">
            {notification.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
            <span className="font-medium">{notification.message}</span>
          </div>
        </div>
      )}

      <div className="relative w-full min-h-screen p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-4 mb-3 flex-wrap">
              {/* Logo or Platform Name */}
              {platformSettings.logo_url ? (
                <img
                  src={`${apiUrl}/api/r2/${platformSettings.logo_url}`}
                  alt={platformSettings.platform_name || 'Platform Logo'}
                  className="h-12 sm:h-14 lg:h-16 object-contain"
                />
              ) : (
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                  {platformSettings.platform_name || 'FX Trading Analytics'}
                </h1>
              )}
              <div className={`px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm ${
                isOnline
                  ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}>
                <div className="flex items-center gap-2">
                  {isOnline ? <Wifi size={16} /> : <WifiOff size={16} />}
                  {isOnline ? 'Live' : 'Demo Mode'}
                </div>
              </div>
            </div>
            <p className="text-slate-400 text-base sm:text-lg">Professional trading performance analytics and insights</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/20"
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? (
                <Sun className="text-yellow-400" size={24} />
              ) : (
                <Moon className="text-slate-700" size={24} />
              )}
            </button>

            <button
              onClick={() => setShowSettings(true)}
              className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/20"
            >
              <Settings className="text-slate-300" size={24} />
            </button>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all duration-200"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {currentUser?.username?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-white font-medium text-sm">{currentUser?.username}</div>
                  <div className="text-slate-400 text-xs capitalize">{currentUser?.role}</div>
                </div>
              </button>

              {/* User Dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-slate-800 border border-white/10 rounded-xl shadow-2xl z-50 py-2">
                  <div className="px-4 py-3 border-b border-white/10">
                    <p className="text-white font-medium">{currentUser?.fullName || currentUser?.username}</p>
                    <p className="text-slate-400 text-sm">{currentUser?.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      handleLogout();
                    }}
                    className="w-full px-4 py-2 text-left text-red-400 hover:bg-red-500/10 transition-all flex items-center gap-2"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 p-1 bg-slate-800/50 rounded-xl border border-slate-700/50 backdrop-blur-sm w-full max-w-5xl">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 px-3 sm:px-5 py-3 rounded-lg font-bold transition-all duration-200 text-sm sm:text-base ${
              activeTab === 'overview'
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                : 'text-slate-100 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex-1 px-3 sm:px-5 py-3 rounded-lg font-bold transition-all duration-200 text-sm sm:text-base ${
              activeTab === 'analytics'
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                : 'text-slate-100 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('risk')}
            className={`flex-1 px-3 sm:px-5 py-3 rounded-lg font-bold transition-all duration-200 text-sm sm:text-base ${
              activeTab === 'risk'
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                : 'text-slate-100 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            Risk
          </button>
          <button
            onClick={() => setActiveTab('journal')}
            className={`flex-1 px-3 sm:px-5 py-3 rounded-lg font-bold transition-all duration-200 text-sm sm:text-base ${
              activeTab === 'journal'
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                : 'text-slate-100 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            Journal
          </button>
          <button
            onClick={() => setActiveTab('psychology')}
            className={`flex-1 px-3 sm:px-5 py-3 rounded-lg font-bold transition-all duration-200 text-sm sm:text-base ${
              activeTab === 'psychology'
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                : 'text-slate-100 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            Psychology
          </button>
          <button
            onClick={() => setActiveTab('trades')}
            className={`flex-1 px-3 sm:px-5 py-3 rounded-lg font-bold transition-all duration-200 text-sm sm:text-base ${
              activeTab === 'trades'
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                : 'text-slate-100 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            Trades
          </button>

          {/* Admin Tab - Only visible to admins */}
          {currentUser?.role === 'admin' && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex-1 px-3 sm:px-5 py-3 rounded-lg font-bold transition-all duration-200 text-sm sm:text-base ${
                activeTab === 'admin'
                  ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg'
                  : 'text-slate-100 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Shield className="inline mr-1" size={16} />
              Admin
            </button>
          )}
        </div>

        {/* Action Bar & Search/Filter Controls */}
<div className="space-y-4 mb-8">
  {/* Search Bar */}
  <div className="relative flex-1 max-w-md">
    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
    <input
      type="text"
      placeholder="Search trades by pair, date, or type..."
      value={filters.searchTerm}
      onChange={(e) => setFilters({...filters, searchTerm: e.target.value})}
      className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
    />
  </div>

  {/* Action Buttons */}
  <div className="flex flex-wrap gap-3">
    <select 
      value={selectedAccount}
      onChange={(e) => setSelectedAccount(e.target.value)}
      className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all hover:bg-white/10 min-w-[200px] flex-shrink-0"
    >
      <option value="all">All Accounts ({accounts.length})</option>
      {accounts.map(acc => (
        <option key={acc.id} value={acc.id}>
          {acc.name} - {acc.broker}
        </option>
      ))}
    </select>

    <button
      onClick={() => setShowFilters(!showFilters)}
      className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all duration-200 hover:scale-105 shadow-lg flex-shrink-0 whitespace-nowrap ${
        hasActiveFilters() 
          ? 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white shadow-amber-500/50' 
          : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
      }`}
    >
      <Filter size={20} />
      <span className="font-medium">Filters</span>
      {hasActiveFilters() && (
        <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs font-bold">
          {Object.values(filters).filter(v => v !== '').length}
        </span>
      )}
    </button>

    <button
      onClick={() => setShowUpload(true)}
      className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-purple-500/50 flex-shrink-0 whitespace-nowrap"
    >
      <Upload size={20} />
      <span className="font-medium">Import</span>
      <span className="font-medium hidden md:inline">&nbsp;CSV/Excel</span>
    </button>

  <button
    onClick={() => setShowManualEntry(true)}
    className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-blue-500/50 flex-shrink-0 whitespace-nowrap"
  >
    <Plus size={20} />
    <span className="font-medium">Add Trade</span>
  </button>

  {trades.length > 0 && (
    <button
      onClick={handleExport}
      className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-green-500/50 flex-shrink-0 whitespace-nowrap"
    >
      <Download size={20} />
      <span className="font-medium">Export</span>
      <span className="font-medium hidden md:inline">&nbsp;Data</span>
    </button>
  )}
</div>

  {/* Advanced Filter Panel */}
  {showFilters && (
    <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 mb-8 animate-in slide-in-from-top duration-300">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Filter size={24} className="text-purple-400" />
          Advanced Filters
        </h3>
        {hasActiveFilters() && (
          <button
            onClick={clearFilters}
            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-all text-sm font-medium"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Date Range */}
        <div>
          <label className="block text-slate-300 mb-2 font-medium">Date From</label>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          />
        </div>

        <div>
          <label className="block text-slate-300 mb-2 font-medium">Date To</label>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Pair Filter */}
        <div>
          <label className="block text-slate-300 mb-2 font-medium">Currency Pair</label>
          <input
            type="text"
            value={filters.pair}
            onChange={(e) => setFilters({...filters, pair: e.target.value})}
            placeholder="e.g., EUR/USD"
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Type Filter */}
        <div>
          <label className="block text-slate-300 mb-2 font-medium">Trade Type</label>
          <select
            value={filters.type}
            onChange={(e) => setFilters({...filters, type: e.target.value})}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          >
            <option value="">All Types</option>
            <option value="buy">Buy</option>
            <option value="sell">Sell</option>
          </select>
        </div>

        {/* P&L Min */}
        <div>
          <label className="block text-slate-300 mb-2 font-medium">Min P&L ($)</label>
          <input
            type="number"
            step="0.01"
            value={filters.minPnl}
            onChange={(e) => setFilters({...filters, minPnl: e.target.value})}
            placeholder="e.g., -100"
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          />
        </div>

        {/* P&L Max */}
        <div>
          <label className="block text-slate-300 mb-2 font-medium">Max P&L ($)</label>
          <input
            type="number"
            step="0.01"
            value={filters.maxPnl}
            onChange={(e) => setFilters({...filters, maxPnl: e.target.value})}
            placeholder="e.g., 1000"
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Filter Results Summary */}
      <div className="mt-6 pt-6 border-t border-white/10">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-300">
            Showing <span className="text-white font-bold">{filteredAndSearchedTrades.length}</span> of <span className="text-slate-400">{trades.length}</span> trades
          </span>
          {hasActiveFilters() && (
            <span className="text-amber-400 font-medium">
              {Object.values(filters).filter(v => v !== '').length} active filter{Object.values(filters).filter(v => v !== '').length > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
    </div>
  )}
</div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 mb-8">
              <div className="group relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-purple-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/20 hover:scale-105">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-slate-300 font-medium">Total Balance</span>
                  <DollarSign className="text-purple-400 group-hover:scale-110 transition-transform" size={24} />
                </div>
                <div className="text-3xl sm:text-4xl font-bold text-white mb-2">
                  ${analytics.totalBalance.toLocaleString()}
                </div>
                <div className="text-sm text-slate-400">{accounts.length} Active Accounts</div>
              </div>

              <div className="group relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-green-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-green-500/20 hover:scale-105">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-slate-300 font-medium">Total P&L</span>
                  {analytics.totalPnL >= 0 ? (
                    <TrendingUp className="text-green-400 group-hover:scale-110 transition-transform" size={24} />
                  ) : (
                    <TrendingDown className="text-red-400 group-hover:scale-110 transition-transform" size={24} />
                  )}
                </div>
                <div className={`text-3xl sm:text-4xl font-bold mb-2 ${analytics.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ${Math.abs(analytics.totalPnL).toFixed(2)}
                </div>
                <div className={`text-sm font-medium ${analytics.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {analytics.totalPnL >= 0 ? '+' : '-'}{((Math.abs(analytics.totalPnL) / analytics.totalBalance) * 100).toFixed(2)}% ROI
                </div>
              </div>

              <div className="group relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-blue-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20 hover:scale-105">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-slate-300 font-medium">Win Rate</span>
                  <Target className="text-blue-400 group-hover:scale-110 transition-transform" size={24} />
                </div>
                <div className="text-3xl sm:text-4xl font-bold text-white mb-2">
                  {analytics.winRate}%
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-green-400 font-medium">{analytics.winningTrades}W</span>
                  <span className="text-slate-500">/</span>
                  <span className="text-red-400 font-medium">{analytics.losingTrades}L</span>
                </div>
              </div>

              <div className="group relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-amber-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-amber-500/20 hover:scale-105">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-slate-300 font-medium">Profit Factor</span>
                  <Zap className="text-amber-400 group-hover:scale-110 transition-transform" size={24} />
                </div>
                <div className="text-3xl sm:text-4xl font-bold text-white mb-2">
                  {analytics.profitFactor}
                </div>
                <div className="text-sm text-slate-400">
                  Avg Win: ${analytics.avgWin.toFixed(0)} / Loss: ${analytics.avgLoss.toFixed(0)}
                </div>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 mb-8">
              {/* Cumulative P&L Chart */}
              <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <div className="flex items-center gap-3 mb-6">
                  <Activity className="text-purple-400" size={24} />
                  <h2 className="text-xl font-bold text-white">Cumulative P&L</h2>
                </div>
                {analytics.chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={analytics.chartData}>
                      <defs>
                        <linearGradient id="colorPnl" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                      <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                      <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1e293b', 
                          border: '1px solid #334155', 
                          borderRadius: '12px',
                          color: '#fff'
                        }} 
                      />
                      <Area type="monotone" dataKey="cumulative" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorPnl)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-slate-400">
                    No trade data available
                  </div>
                )}
              </div>

              {/* Pair Performance Pie Chart */}
              <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <div className="flex items-center gap-3 mb-6">
                  <Target className="text-pink-400" size={24} />
                  <h2 className="text-xl font-bold text-white">Top Pairs Performance</h2>
                </div>
                {analytics.pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analytics.pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {analytics.pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1e293b', 
                          border: '1px solid #334155', 
                          borderRadius: '12px',
                          color: '#fff'
                        }} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-slate-400">
                    No pair data available
                  </div>
                )}
              </div>
            </div>

            {/* Recent Trades */}
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <div className="flex items-center gap-3 mb-6">
                <Calendar className="text-blue-400" size={24} />
                <h2 className="text-xl font-bold text-white">Recent Trades</h2>
              </div>
              
              {trades.length === 0 ? (
                <div className="text-center py-16">
                  <Activity className="mx-auto text-slate-600 mb-4" size={64} />
                  <h3 className="text-2xl font-bold text-slate-300 mb-2">No Trades Yet</h3>
                  <p className="text-slate-400 mb-6">Start by importing your trading data or adding trades manually</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left text-slate-400 pb-4 font-medium">Date</th>
                        <th className="text-left text-slate-400 pb-4 font-medium">Pair</th>
                        <th className="text-left text-slate-400 pb-4 font-medium">Type</th>
                        <th className="text-right text-slate-400 pb-4 font-medium">Size</th>
                        <th className="text-right text-slate-400 pb-4 font-medium">Entry</th>
                        <th className="text-right text-slate-400 pb-4 font-medium">Exit</th>
                        <th className="text-right text-slate-400 pb-4 font-medium">P&L</th>
                        <th className="text-center text-slate-400 pb-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedTrades.slice(0, 10).map(trade => (
                        <tr key={trade.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="py-4 text-slate-200">{trade.date}</td>
                          <td className="py-4 text-white font-semibold">{trade.pair}</td>
                          <td className="py-4">
                            <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
                              trade.type === 'buy' 
                                ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                                : 'bg-red-500/20 text-red-300 border border-red-500/30'
                            }`}>
                              {trade.type.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-4 text-right text-slate-200">{trade.size}</td>
                          <td className="py-4 text-right text-slate-200">{trade.entryPrice.toFixed(5)}</td>
                          <td className="py-4 text-right text-slate-200">{trade.exitPrice.toFixed(5)}</td>
                          <td className={`py-4 text-right font-bold text-lg ${
                            trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                          </td>
                          <td className="py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => openEditModal(trade)}
                                className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-all duration-200 hover:scale-110"
                                title="Edit trade"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => openDeleteConfirm(trade)}
                                className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-all duration-200 hover:scale-110"
                                title="Delete trade"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Economic Calendar */}
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 mt-8">
              <Suspense fallback={<div className="flex items-center justify-center min-h-[200px]"><div className="text-slate-400">Loading Calendar...</div></div>}>
                <EconomicCalendar theme="dark" />
              </Suspense>
            </div>
          </>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><div className="text-slate-400">Loading Analytics...</div></div>}>
            <AnalyticsTab analytics={analytics} />
          </Suspense>
        )}

        {/* All Trades Tab */}
        {activeTab === 'trades' && (
          <>
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Activity className="text-green-400" size={24} />
                <h2 className="text-xl font-bold text-white">All Trades ({analytics.totalTrades})</h2>
              </div>
            </div>
            
            {trades.length === 0 ? (
              <div className="text-center py-16">
                <Activity className="mx-auto text-slate-600 mb-4" size={64} />
                <h3 className="text-2xl font-bold text-slate-300 mb-2">No Trades Yet</h3>
                <p className="text-slate-400">Start by importing your trading data or adding trades manually</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left text-slate-400 pb-4 font-medium">Date</th>
                      <th className="text-left text-slate-400 pb-4 font-medium">Pair</th>
                      <th className="text-left text-slate-400 pb-4 font-medium">Type</th>
                      <th className="text-right text-slate-400 pb-4 font-medium">Size</th>
                      <th className="text-right text-slate-400 pb-4 font-medium">Entry</th>
                      <th className="text-right text-slate-400 pb-4 font-medium">Exit</th>
                      <th className="text-right text-slate-400 pb-4 font-medium">P&L</th>
                      <th className="text-left text-slate-400 pb-4 font-medium">Account</th>
                      <th className="text-center text-slate-400 pb-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedTrades.map(trade => (
                      <tr key={trade.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="py-4 text-slate-200">{trade.date}</td>
                        <td className="py-4 text-white font-semibold">{trade.pair}</td>
                        <td className="py-4">
                          <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
                            trade.type === 'buy' 
                              ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                              : 'bg-red-500/20 text-red-300 border border-red-500/30'
                          }`}>
                            {trade.type.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-4 text-right text-slate-200">{trade.size}</td>
                        <td className="py-4 text-right text-slate-200">{trade.entryPrice.toFixed(5)}</td>
                        <td className="py-4 text-right text-slate-200">{trade.exitPrice.toFixed(5)}</td>
                        <td className={`py-4 text-right font-bold text-lg ${
                          trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                        </td>
                        <td className="py-4 text-slate-300">
                          {accounts.find(a => a.id === trade.account)?.name || 'Unknown'}
                        </td>
                        <td className="py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => openEditModal(trade)}
                              className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-all duration-200 hover:scale-110"
                              title="Edit trade"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => openDeleteConfirm(trade)}
                              className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-all duration-200 hover:scale-110"
                              title="Delete trade"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {sortedTrades.length > 0 && (
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 px-6">
                {/* Items per page selector */}
                <div className="flex items-center gap-3">
                  <span className="text-slate-300 text-sm">Rows per page:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={200}>200</option>
                  </select>
                </div>

                {/* Page info */}
                <div className="text-slate-300 text-sm">
                  Showing <span className="text-white font-bold">{((currentPage - 1) * itemsPerPage) + 1}</span> to{' '}
                  <span className="text-white font-bold">{Math.min(currentPage * itemsPerPage, sortedTrades.length)}</span> of{' '}
                  <span className="text-white font-bold">{sortedTrades.length}</span> trades
                </div>

                {/* Pagination buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-800/50 disabled:cursor-not-allowed text-white rounded-lg transition-all text-sm font-medium"
                    title="First page"
                  >
                    ««
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-800/50 disabled:cursor-not-allowed text-white rounded-lg transition-all text-sm font-medium"
                    title="Previous page"
                  >
                    «
                  </button>
                  
                  {/* Page numbers */}
                  <div className="hidden sm:flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-2 rounded-lg transition-all text-sm font-medium ${
                            currentPage === pageNum
                              ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                              : 'bg-slate-800 hover:bg-slate-700 text-white'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  {/* Mobile page indicator */}
                  <div className="sm:hidden px-3 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium">
                    {currentPage} / {totalPages}
                  </div>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-800/50 disabled:cursor-not-allowed text-white rounded-lg transition-all text-sm font-medium"
                    title="Next page"
                  >
                    »
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-800/50 disabled:cursor-not-allowed text-white rounded-lg transition-all text-sm font-medium"
                    title="Last page"
                  >
                    »»
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Trade Copier */}
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 mt-6">
            <Suspense fallback={<div className="flex items-center justify-center min-h-[200px]"><div className="text-slate-400">Loading Trade Copier...</div></div>}>
              <TradeCopier accounts={accounts} onCopyTrade={(copiedTrade) => {
                setTrades(prev => [...prev, copiedTrade]);
                saveTrades([...trades, copiedTrade]);
              }} theme="dark" />
            </Suspense>
          </div>
          </>
        )}

        {/* Risk Analysis Tab */}
        {activeTab === 'risk' && (
          <div className="space-y-6">
            {/* Risk Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Maximum Drawdown Card */}
              <div className="bg-gradient-to-br from-red-500/10 to-red-600/5 backdrop-blur-xl rounded-2xl p-6 border border-red-500/20 hover:border-red-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-red-500/10">
                <div className="flex items-center justify-between mb-3">
                  <TrendingDown className="text-red-400" size={24} />
                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                    riskMetrics.maxDrawdownPercent < 10 ? 'bg-green-500/20 text-green-300' :
                    riskMetrics.maxDrawdownPercent < 20 ? 'bg-amber-500/20 text-amber-300' :
                    'bg-red-500/20 text-red-300'
                  }`}>
                    {riskMetrics.maxDrawdownPercent < 10 ? 'Good' :
                     riskMetrics.maxDrawdownPercent < 20 ? 'Moderate' : 'High Risk'}
                  </div>
                </div>
                <h3 className="text-slate-400 text-sm font-medium mb-2">Maximum Drawdown</h3>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold text-white">${Math.abs(riskMetrics.maxDrawdown).toFixed(2)}</p>
                  <p className="text-lg font-semibold text-red-400">({riskMetrics.maxDrawdownPercent.toFixed(1)}%)</p>
                </div>
                <p className="text-slate-500 text-xs mt-2">Peak-to-trough decline</p>
              </div>

              {/* Sharpe Ratio Card */}
              <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 backdrop-blur-xl rounded-2xl p-6 border border-blue-500/20 hover:border-blue-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10">
                <div className="flex items-center justify-between mb-3">
                  <Target className="text-blue-400" size={24} />
                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                    riskMetrics.sharpeRatio > 1 ? 'bg-green-500/20 text-green-300' :
                    riskMetrics.sharpeRatio > 0 ? 'bg-amber-500/20 text-amber-300' :
                    'bg-red-500/20 text-red-300'
                  }`}>
                    {riskMetrics.sharpeRatio > 1 ? 'Excellent' :
                     riskMetrics.sharpeRatio > 0 ? 'Fair' : 'Poor'}
                  </div>
                </div>
                <h3 className="text-slate-400 text-sm font-medium mb-2">Sharpe Ratio</h3>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold text-white">{riskMetrics.sharpeRatio.toFixed(2)}</p>
                </div>
                <p className="text-slate-500 text-xs mt-2">Risk-adjusted returns</p>
              </div>

              {/* Expectancy Card */}
              <div className={`bg-gradient-to-br backdrop-blur-xl rounded-2xl p-6 border transition-all duration-300 hover:shadow-lg ${
                riskMetrics.expectancy > 0
                  ? 'from-green-500/10 to-green-600/5 border-green-500/20 hover:border-green-500/40 hover:shadow-green-500/10'
                  : 'from-red-500/10 to-red-600/5 border-red-500/20 hover:border-red-500/40 hover:shadow-red-500/10'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <Zap className={riskMetrics.expectancy > 0 ? 'text-green-400' : 'text-red-400'} size={24} />
                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                    riskMetrics.expectancy > 0 ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                  }`}>
                    {riskMetrics.expectancy > 0 ? 'Positive Edge' : 'Negative Edge'}
                  </div>
                </div>
                <h3 className="text-slate-400 text-sm font-medium mb-2">Expectancy</h3>
                <div className="flex items-baseline gap-2">
                  <p className={`text-3xl font-bold ${riskMetrics.expectancy > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ${riskMetrics.expectancy.toFixed(2)}
                  </p>
                </div>
                <p className="text-slate-500 text-xs mt-2">Expected profit per trade</p>
              </div>

              {/* Risk/Reward Ratio Card */}
              <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10">
                <div className="flex items-center justify-between mb-3">
                  <BarChart3 className="text-purple-400" size={24} />
                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                    riskMetrics.avgRiskReward > 2 ? 'bg-green-500/20 text-green-300' :
                    riskMetrics.avgRiskReward > 1 ? 'bg-amber-500/20 text-amber-300' :
                    'bg-red-500/20 text-red-300'
                  }`}>
                    {riskMetrics.avgRiskReward > 2 ? 'Excellent' :
                     riskMetrics.avgRiskReward > 1 ? 'Good' : 'Poor'}
                  </div>
                </div>
                <h3 className="text-slate-400 text-sm font-medium mb-2">Avg Risk/Reward</h3>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold text-white">{riskMetrics.avgRiskReward.toFixed(2)}</p>
                  <p className="text-lg font-semibold text-purple-400">: 1</p>
                </div>
                <p className="text-slate-500 text-xs mt-2">Average win vs average loss</p>
              </div>

              {/* Win Streak Card */}
              <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 backdrop-blur-xl rounded-2xl p-6 border border-green-500/20 hover:border-green-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/10">
                <div className="flex items-center justify-between mb-3">
                  <TrendingUp className="text-green-400" size={24} />
                  <div className="px-3 py-1 rounded-full text-xs font-bold bg-green-500/20 text-green-300">
                    Longest: {riskMetrics.longestWinStreak}
                  </div>
                </div>
                <h3 className="text-slate-400 text-sm font-medium mb-2">Current Streak</h3>
                <div className="flex items-baseline gap-2">
                  <p className={`text-3xl font-bold ${
                    riskMetrics.currentStreakType === 'win' ? 'text-green-400' :
                    riskMetrics.currentStreakType === 'loss' ? 'text-red-400' :
                    'text-slate-400'
                  }`}>
                    {riskMetrics.currentStreak}
                  </p>
                  <p className="text-lg font-semibold text-slate-400">
                    {riskMetrics.currentStreakType === 'win' ? 'Wins' :
                     riskMetrics.currentStreakType === 'loss' ? 'Losses' :
                     'None'}
                  </p>
                </div>
                <p className="text-slate-500 text-xs mt-2">Consecutive {riskMetrics.currentStreakType === 'win' ? 'winning' : riskMetrics.currentStreakType === 'loss' ? 'losing' : 'active'} trades</p>
              </div>

              {/* Volatility Card */}
              <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 backdrop-blur-xl rounded-2xl p-6 border border-amber-500/20 hover:border-amber-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/10">
                <div className="flex items-center justify-between mb-3">
                  <Activity className="text-amber-400" size={24} />
                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                    riskMetrics.volatility < 50 ? 'bg-green-500/20 text-green-300' :
                    riskMetrics.volatility < 100 ? 'bg-amber-500/20 text-amber-300' :
                    'bg-red-500/20 text-red-300'
                  }`}>
                    {riskMetrics.volatility < 50 ? 'Low' :
                     riskMetrics.volatility < 100 ? 'Moderate' : 'High'}
                  </div>
                </div>
                <h3 className="text-slate-400 text-sm font-medium mb-2">Volatility</h3>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold text-white">${Math.abs(riskMetrics.volatility).toFixed(2)}</p>
                </div>
                <p className="text-slate-500 text-xs mt-2">Standard deviation of returns</p>
              </div>
            </div>

            {/* Additional Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                <h4 className="text-slate-400 text-xs font-medium mb-1">Sortino Ratio</h4>
                <p className="text-2xl font-bold text-white">{riskMetrics.sortinoRatio.toFixed(2)}</p>
              </div>
              <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                <h4 className="text-slate-400 text-xs font-medium mb-1">Calmar Ratio</h4>
                <p className="text-2xl font-bold text-white">{riskMetrics.calmarRatio.toFixed(2)}</p>
              </div>
              <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                <h4 className="text-slate-400 text-xs font-medium mb-1">Recovery Factor</h4>
                <p className="text-2xl font-bold text-white">{riskMetrics.recoveryFactor.toFixed(2)}</p>
              </div>
              <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                <h4 className="text-slate-400 text-xs font-medium mb-1">Avg Duration</h4>
                <p className="text-2xl font-bold text-white">{riskMetrics.avgTradeDuration.toFixed(1)}d</p>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Drawdown Chart */}
              <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white">Drawdown History</h3>
                  <TrendingDown className="text-red-400" size={20} />
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={riskMetrics.drawdownData}>
                    <defs>
                      <linearGradient id="drawdownGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis
                      dataKey="date"
                      stroke="#e2e8f0"
                      tick={{ fill: '#e2e8f0', fontSize: 12 }}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis
                      stroke="#e2e8f0"
                      tick={{ fill: '#e2e8f0', fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                      labelStyle={{ color: '#e2e8f0' }}
                      formatter={(value) => [`$${Math.abs(value).toFixed(2)}`, 'Drawdown']}
                    />
                    <Area
                      type="monotone"
                      dataKey="drawdown"
                      stroke="#ef4444"
                      strokeWidth={2}
                      fill="url(#drawdownGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* R/R Distribution Chart */}
              <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white">Trade Distribution</h3>
                  <BarChart3 className="text-purple-400" size={20} />
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={riskMetrics.rrDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis
                      dataKey="date"
                      stroke="#e2e8f0"
                      tick={{ fill: '#e2e8f0', fontSize: 10 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      stroke="#e2e8f0"
                      tick={{ fill: '#e2e8f0', fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                      labelStyle={{ color: '#e2e8f0' }}
                      formatter={(value, name, props) => [`$${value.toFixed(2)}`, props.payload.type]}
                    />
                    <Bar
                      dataKey="rr"
                      radius={[8, 8, 0, 0]}
                    >
                      {riskMetrics.rrDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.type === 'Win' ? '#10b981' : entry.type === 'Loss' ? '#ef4444' : '#64748b'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Best/Worst Trades */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Best Trade */}
              {riskMetrics.bestTrade && (
                <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 backdrop-blur-xl rounded-2xl p-6 border border-green-500/20">
                  <div className="flex items-center gap-3 mb-4">
                    <TrendingUp className="text-green-400" size={24} />
                    <h3 className="text-xl font-bold text-white">Best Trade</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-400">P&L:</span>
                      <span className="text-2xl font-bold text-green-400">${riskMetrics.bestTrade.pnl.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Pair:</span>
                      <span className="text-white font-semibold">{riskMetrics.bestTrade.pair}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Date:</span>
                      <span className="text-white">{riskMetrics.bestTrade.date}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Type:</span>
                      <span className="text-white uppercase">{riskMetrics.bestTrade.type}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Worst Trade */}
              {riskMetrics.worstTrade && (
                <div className="bg-gradient-to-br from-red-500/10 to-red-600/5 backdrop-blur-xl rounded-2xl p-6 border border-red-500/20">
                  <div className="flex items-center gap-3 mb-4">
                    <TrendingDown className="text-red-400" size={24} />
                    <h3 className="text-xl font-bold text-white">Worst Trade</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-400">P&L:</span>
                      <span className="text-2xl font-bold text-red-400">${riskMetrics.worstTrade.pnl.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Pair:</span>
                      <span className="text-white font-semibold">{riskMetrics.worstTrade.pair}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Date:</span>
                      <span className="text-white">{riskMetrics.worstTrade.date}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Type:</span>
                      <span className="text-white uppercase">{riskMetrics.worstTrade.type}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Advanced Metrics Summary */}
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <h3 className="text-xl font-bold text-white mb-6">Advanced Risk Metrics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <h4 className="text-slate-400 text-sm font-medium mb-2">MAE (Worst Loss)</h4>
                  <p className="text-2xl font-bold text-red-400">${Math.abs(riskMetrics.mae).toFixed(2)}</p>
                </div>
                <div>
                  <h4 className="text-slate-400 text-sm font-medium mb-2">MFE (Best Win)</h4>
                  <p className="text-2xl font-bold text-green-400">${riskMetrics.mfe.toFixed(2)}</p>
                </div>
                <div>
                  <h4 className="text-slate-400 text-sm font-medium mb-2">Longest Loss Streak</h4>
                  <p className="text-2xl font-bold text-white">{riskMetrics.longestLoseStreak}</p>
                </div>
                <div>
                  <h4 className="text-slate-400 text-sm font-medium mb-2">Value at Risk (95%)</h4>
                  <p className="text-2xl font-bold text-white">${Math.abs(riskMetrics.valueAtRisk).toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Journal Tab */}
        {activeTab === 'journal' && (
          <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><div className="text-slate-400">Loading Journal...</div></div>}>
            <JournalTab
              trades={sortedTrades}
              onUpdate={updateTradeJournal}
              apiUrl={apiUrl}
            />
          </Suspense>
        )}

        {/* Psychology Coach Tab */}
        {activeTab === 'psychology' && (
          <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><div className="text-slate-400">Loading Psychology Coach...</div></div>}>
            <PsychologyCoach
              trades={sortedTrades}
            />
          </Suspense>
        )}

        {/* Admin Portal Tab */}
        {activeTab === 'admin' && currentUser?.role === 'admin' && (
          <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><div className="text-slate-400">Loading Admin Portal...</div></div>}>
            <AdminPortal
              apiUrl={apiUrl}
              apiKey={apiKey}
              currentUser={currentUser}
            />
          </Suspense>
        )}

        {/* Keyboard Shortcuts Help Modal */}
        {showShortcutsHelp && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-slate-900 rounded-2xl p-8 max-w-2xl w-full border border-white/10 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-1">⌨️ Keyboard Shortcuts</h3>
                  <p className="text-slate-400 text-sm">Work faster with these shortcuts</p>
                </div>
                <button onClick={() => setShowShortcutsHelp(false)} className="text-slate-400 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                {/* Navigation */}
                <div>
                  <h4 className="text-lg font-semibold text-purple-400 mb-3 flex items-center gap-2">
                    <BarChart3 size={20} />
                    Navigation
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                      <span className="text-slate-300">Switch to Overview</span>
                      <kbd className="px-3 py-1 bg-slate-700 text-white rounded text-sm font-mono border border-slate-600">1</kbd>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                      <span className="text-slate-300">Switch to Trades</span>
                      <kbd className="px-3 py-1 bg-slate-700 text-white rounded text-sm font-mono border border-slate-600">2</kbd>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                      <span className="text-slate-300">Switch to Analytics</span>
                      <kbd className="px-3 py-1 bg-slate-700 text-white rounded text-sm font-mono border border-slate-600">3</kbd>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                      <span className="text-slate-300">Switch to Risk Analysis</span>
                      <kbd className="px-3 py-1 bg-slate-700 text-white rounded text-sm font-mono border border-slate-600">4</kbd>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                      <span className="text-slate-300">Switch to Journal</span>
                      <kbd className="px-3 py-1 bg-slate-700 text-white rounded text-sm font-mono border border-slate-600">5</kbd>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div>
                  <h4 className="text-lg font-semibold text-green-400 mb-3 flex items-center gap-2">
                    <Zap size={20} />
                    Actions
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                      <span className="text-slate-300">New Trade</span>
                      <kbd className="px-3 py-1 bg-slate-700 text-white rounded text-sm font-mono border border-slate-600">N</kbd>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                      <span className="text-slate-300">Export Data</span>
                      <kbd className="px-3 py-1 bg-slate-700 text-white rounded text-sm font-mono border border-slate-600">E</kbd>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                      <span className="text-slate-300">Toggle Filters</span>
                      <kbd className="px-3 py-1 bg-slate-700 text-white rounded text-sm font-mono border border-slate-600">F</kbd>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                      <span className="text-slate-300">Position Size Calculator</span>
                      <kbd className="px-3 py-1 bg-slate-700 text-white rounded text-sm font-mono border border-slate-600">C</kbd>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                      <span className="text-slate-300">One-Click Trading Panel</span>
                      <kbd className="px-3 py-1 bg-slate-700 text-white rounded text-sm font-mono border border-slate-600">Q</kbd>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                      <span className="text-slate-300">Trailing Stop Visualizer</span>
                      <kbd className="px-3 py-1 bg-slate-700 text-white rounded text-sm font-mono border border-slate-600">T</kbd>
                    </div>
                  </div>
                </div>

                {/* Search & Navigation */}
                <div>
                  <h4 className="text-lg font-semibold text-blue-400 mb-3 flex items-center gap-2">
                    <Search size={20} />
                    Search & Pagination
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                      <span className="text-slate-300">Focus Search</span>
                      <div className="flex gap-2">
                        <kbd className="px-3 py-1 bg-slate-700 text-white rounded text-sm font-mono border border-slate-600">S</kbd>
                        <span className="text-slate-500">or</span>
                        <div className="flex gap-1">
                          <kbd className="px-2 py-1 bg-slate-700 text-white rounded text-sm font-mono border border-slate-600">⌘</kbd>
                          <kbd className="px-2 py-1 bg-slate-700 text-white rounded text-sm font-mono border border-slate-600">K</kbd>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                      <span className="text-slate-300">Previous Page</span>
                      <kbd className="px-3 py-1 bg-slate-700 text-white rounded text-sm font-mono border border-slate-600">←</kbd>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                      <span className="text-slate-300">Next Page</span>
                      <kbd className="px-3 py-1 bg-slate-700 text-white rounded text-sm font-mono border border-slate-600">→</kbd>
                    </div>
                  </div>
                </div>

                {/* General */}
                <div>
                  <h4 className="text-lg font-semibold text-yellow-400 mb-3 flex items-center gap-2">
                    <Activity size={20} />
                    General
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                      <span className="text-slate-300">Show This Help</span>
                      <kbd className="px-3 py-1 bg-slate-700 text-white rounded text-sm font-mono border border-slate-600">?</kbd>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                      <span className="text-slate-300">Close Modals</span>
                      <kbd className="px-3 py-1 bg-slate-700 text-white rounded text-sm font-mono border border-slate-600">Esc</kbd>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                <p className="text-purple-300 text-sm">
                  💡 <strong>Pro Tip:</strong> Shortcuts won't work while typing in input fields. Press <kbd className="px-2 py-0.5 bg-slate-700 text-white rounded text-xs font-mono">Esc</kbd> to close any modal first.
                </p>
              </div>

              <button
                onClick={() => setShowShortcutsHelp(false)}
                className="w-full mt-6 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl transition-all font-medium shadow-lg"
              >
                Got it!
              </button>
            </div>
          </div>
        )}

        {/* Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-slate-900 rounded-2xl p-8 max-w-md w-full border border-white/10 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">API Configuration</h3>
                <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>
              <p className="text-slate-400 mb-6">
                Connect to your Cloudflare Worker for persistent storage and auto-sync capabilities.
              </p>
              <div className="space-y-5">
                <div>
                  <label className="block text-slate-300 mb-2 font-medium">Worker URL</label>
                  <input
                    type="text"
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                    placeholder="https://your-worker.workers.dev"
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-2 font-medium">API Key</label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="your-secret-api-key"
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setShowSettings(false)}
                  className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={saveApiConfig}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl transition-all font-medium shadow-lg"
                >
                  Save & Connect
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Upload Modal */}
        {showUpload && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-slate-900 rounded-2xl p-8 max-w-md w-full border border-white/10 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">Import Trading Data</h3>
                <button onClick={() => setShowUpload(false)} className="text-slate-400 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>
              <p className="text-slate-400 mb-6">
                Upload CSV or Excel file with columns: Date, Pair, Type, Size, Entry Price, Exit Price, P&L
              </p>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-purple-600 file:text-white file:font-medium hover:file:bg-purple-700 file:cursor-pointer cursor-pointer transition-all"
              />
              <button
                onClick={() => setShowUpload(false)}
                className="w-full mt-6 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Manual Entry Modal */}
        {showManualEntry && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-slate-900 rounded-2xl p-8 max-w-7xl w-full border border-white/10 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-white">Add New Trade</h3>
                  <p className="text-slate-400 text-sm mt-1">View live chart while entering trade details</p>
                </div>
                <button onClick={() => setShowManualEntry(false)} className="text-slate-400 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left: Trade Form */}
                <div>
              {/* Trade Template Manager */}
              <Suspense fallback={<div className="h-20 bg-slate-800/30 rounded-lg animate-pulse" />}>
                <TradeTemplateManager
                  currentTrade={manualTrade}
                  onLoadTemplate={(template) => {
                    setManualTrade({
                      ...manualTrade,
                      pair: template.pair,
                      type: template.type,
                      size: template.size,
                      accountId: template.accountId
                    });
                    showNotification(`Template "${template.name}" loaded!`, 'success');
                  }}
                  accounts={accounts}
                  theme={theme}
                />
              </Suspense>

              <div className="space-y-4 mt-4">
                <div>
                  <label className="block text-slate-300 mb-2 font-medium">Date</label>
                  <input
                    type="date"
                    value={manualTrade.date}
                    onChange={(e) => setManualTrade({...manualTrade, date: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-2 font-medium">Currency Pair</label>
                  <input
                    type="text"
                    value={manualTrade.pair}
                    onChange={(e) => setManualTrade({...manualTrade, pair: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="EUR/USD"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 mb-2 font-medium">Type</label>
                    <select
                      value={manualTrade.type}
                      onChange={(e) => setManualTrade({...manualTrade, type: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    >
                      <option value="buy">Buy</option>
                      <option value="sell">Sell</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-2 font-medium">Size (Lots)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={manualTrade.size}
                      onChange={(e) => setManualTrade({...manualTrade, size: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="0.10"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 mb-2 font-medium">Entry Price</label>
                    <input
                      type="number"
                      step="0.00001"
                      value={manualTrade.entryPrice}
                      onChange={(e) => setManualTrade({...manualTrade, entryPrice: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="1.08500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-2 font-medium">Exit Price</label>
                    <input
                      type="number"
                      step="0.00001"
                      value={manualTrade.exitPrice}
                      onChange={(e) => setManualTrade({...manualTrade, exitPrice: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="1.08700"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-300 mb-2 font-medium">P&L ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={manualTrade.pnl}
                    onChange={(e) => setManualTrade({...manualTrade, pnl: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="200.00"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-2 font-medium">Account</label>
                  <select
                    value={manualTrade.accountId}
                    onChange={(e) => setManualTrade({...manualTrade, accountId: parseInt(e.target.value)})}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  >
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setShowManualEntry(false)}
                  className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setTradeToReview(manualTrade);
                    setShowAIReview(true);
                  }}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white rounded-xl transition-all font-medium shadow-lg flex items-center justify-center gap-2"
                >
                  <Brain size={18} />
                  AI Review
                </button>
                <button
                  onClick={handleManualSubmit}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl transition-all font-medium shadow-lg"
                >
                  Add Trade
                </button>
              </div>
            </div>

            {/* Right: TradingView Chart */}
            <div className="hidden lg:block">
              <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-white font-medium flex items-center gap-2">
                    <BarChart3 size={18} className="text-purple-400" />
                    Live Chart
                  </h4>
                  {manualTrade.pair && (
                    <span className="text-sm text-slate-400 bg-slate-800 px-3 py-1 rounded-full">
                      {manualTrade.pair}
                    </span>
                  )}
                </div>
                <Suspense fallback={
                  <div className="flex items-center justify-center p-8 bg-slate-800/50 rounded-lg" style={{ height: '500px' }}>
                    <div className="text-slate-400 text-sm">Loading chart...</div>
                  </div>
                }>
                  <TradingViewWidget
                    symbol={manualTrade.pair || 'EURUSD'}
                    interval="60"
                    theme={theme}
                    height={500}
                  />
                </Suspense>
                <p className="text-xs text-slate-500 mt-2 text-center">
                  Chart updates automatically when you change the currency pair
                </p>
              </div>
            </div>
          </div>
            </div>
          </div>
        )}

        {/* Edit Trade Modal */}
        {showEditTrade && selectedTrade && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-slate-900 rounded-2xl p-8 max-w-7xl w-full border border-white/10 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-white">Edit Trade</h3>
                  <p className="text-slate-400 text-sm mt-1">Modify trade details with live chart reference</p>
                </div>
                <button onClick={() => { setShowEditTrade(false); setSelectedTrade(null); }} className="text-slate-400 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left: Trade Form */}
                <div>
              <div className="space-y-4">
                <div>
                  <label className="block text-slate-300 mb-2 font-medium">Date</label>
                  <input
                    type="date"
                    value={selectedTrade.date}
                    onChange={(e) => setSelectedTrade({...selectedTrade, date: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-2 font-medium">Currency Pair</label>
                  <input
                    type="text"
                    value={selectedTrade.pair}
                    onChange={(e) => setSelectedTrade({...selectedTrade, pair: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="EUR/USD"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 mb-2 font-medium">Type</label>
                    <select
                      value={selectedTrade.type}
                      onChange={(e) => setSelectedTrade({...selectedTrade, type: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="buy">Buy</option>
                      <option value="sell">Sell</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-2 font-medium">Size (Lots)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={selectedTrade.size}
                      onChange={(e) => setSelectedTrade({...selectedTrade, size: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="0.10"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 mb-2 font-medium">Entry Price</label>
                    <input
                      type="number"
                      step="0.00001"
                      value={selectedTrade.entryPrice}
                      onChange={(e) => setSelectedTrade({...selectedTrade, entryPrice: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="1.08500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-2 font-medium">Exit Price</label>
                    <input
                      type="number"
                      step="0.00001"
                      value={selectedTrade.exitPrice}
                      onChange={(e) => setSelectedTrade({...selectedTrade, exitPrice: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="1.08700"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-300 mb-2 font-medium">P&L ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={selectedTrade.pnl}
                    onChange={(e) => setSelectedTrade({...selectedTrade, pnl: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="200.00"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-2 font-medium">Account</label>
                  <select
                    value={selectedTrade.account}
                    onChange={(e) => setSelectedTrade({...selectedTrade, account: parseInt(e.target.value)})}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => { setShowEditTrade(false); setSelectedTrade(null); }}
                  className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditTrade}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl transition-all font-medium shadow-lg"
                >
                  Update Trade
                </button>
              </div>
            </div>

            {/* Right: TradingView Chart */}
            <div className="hidden lg:block">
              <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-white font-medium flex items-center gap-2">
                    <BarChart3 size={18} className="text-blue-400" />
                    Live Chart
                  </h4>
                  {selectedTrade.pair && (
                    <span className="text-sm text-slate-400 bg-slate-800 px-3 py-1 rounded-full">
                      {selectedTrade.pair}
                    </span>
                  )}
                </div>
                <Suspense fallback={
                  <div className="flex items-center justify-center p-8 bg-slate-800/50 rounded-lg" style={{ height: '500px' }}>
                    <div className="text-slate-400 text-sm">Loading chart...</div>
                  </div>
                }>
                  <TradingViewWidget
                    symbol={selectedTrade.pair || 'EURUSD'}
                    interval="60"
                    theme={theme}
                    height={500}
                  />
                </Suspense>
                <p className="text-xs text-slate-500 mt-2 text-center">
                  Chart updates automatically when you change the currency pair
                </p>
              </div>
            </div>
          </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && selectedTrade && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-slate-900 rounded-2xl p-8 max-w-md w-full border border-red-500/30 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                    <AlertCircle className="text-red-400" size={24} />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Delete Trade</h3>
                </div>
                <button onClick={() => { setShowDeleteConfirm(false); setSelectedTrade(null); }} className="text-slate-400 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>
              
              <div className="mb-6">
                <p className="text-slate-300 mb-4">Are you sure you want to delete this trade? This action cannot be undone.</p>
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-slate-400">Date:</span>
                      <span className="text-white ml-2 font-medium">{selectedTrade.date}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Pair:</span>
                      <span className="text-white ml-2 font-medium">{selectedTrade.pair}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Type:</span>
                      <span className="text-white ml-2 font-medium">{selectedTrade.type.toUpperCase()}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">P&L:</span>
                      <span className={`ml-2 font-bold ${selectedTrade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {selectedTrade.pnl >= 0 ? '+' : ''}${selectedTrade.pnl.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setShowDeleteConfirm(false); setSelectedTrade(null); }}
                  className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteTrade}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl transition-all font-medium shadow-lg"
                >
                  Delete Trade
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Screenshot Capture Prompt (Auto-opens after trade creation) */}
        {showScreenshotPrompt && newTradeId && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-slate-900 rounded-2xl p-8 max-w-2xl w-full border border-white/10 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Camera size={24} className="text-purple-400" />
                    Add Trade Screenshot
                  </h3>
                  <p className="text-slate-400 text-sm mt-1">Capture and upload your chart for better trade analysis</p>
                </div>
                <button
                  onClick={() => {
                    setShowScreenshotPrompt(false);
                    setNewTradeId(null);
                  }}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <Suspense fallback={
                <div className="flex items-center justify-center p-8">
                  <Loader className="text-purple-400 animate-spin" size={40} />
                </div>
              }>
                <QuickScreenshotCapture
                  tradeId={newTradeId}
                  apiUrl={apiUrl}
                  authToken={authToken}
                  theme={theme}
                  autoFocus={true}
                  onScreenshotReady={(url) => {
                    showNotification('Screenshot uploaded successfully!', 'success');
                    loadDataFromAPI(apiUrl, authToken);
                  }}
                  onClose={() => {
                    setShowScreenshotPrompt(false);
                    setNewTradeId(null);
                  }}
                />
              </Suspense>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowScreenshotPrompt(false);
                    setNewTradeId(null);
                  }}
                  className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all font-medium"
                >
                  Skip for Now
                </button>
              </div>

              <div className="mt-4 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                <p className="text-purple-300 text-sm flex items-center gap-2">
                  <Info size={14} />
                  <span>💡 <strong>Pro Tip:</strong> Take a screenshot of your chart (PrtScn), then paste it here with Ctrl+V for quick capture!</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Position Size Calculator (Floating Widget) */}
        <Suspense fallback={null}>
          <PositionSizeCalculator
            isVisible={showCalculator}
            onClose={() => setShowCalculator(false)}
            accountBalance={analytics.totalBalance || 10000}
            theme={theme}
          />
        </Suspense>

        {/* One-Click Trading Panel */}
        <Suspense fallback={null}>
          <OneClickTrading
            isVisible={showOneClickTrading}
            onClose={() => setShowOneClickTrading(false)}
            onExecuteTrade={handleOneClickTrade}
            accounts={accounts}
            theme={theme}
          />
        </Suspense>

        {/* Trailing Stop Visualizer */}
        {showTrailingStop && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-slate-900 rounded-2xl max-w-2xl w-full border border-white/10 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-slate-700">
                <h2 className="text-xl font-bold text-white">Trailing Stop Calculator</h2>
                <button
                  onClick={() => setShowTrailingStop(false)}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <X className="text-slate-400" size={20} />
                </button>
              </div>
              <Suspense fallback={<div className="p-6 text-center text-slate-400">Loading...</div>}>
                <TrailingStopVisualizer isEmbedded={true} theme={theme} />
              </Suspense>
            </div>
          </div>
        )}

        {/* Partial Close Modal */}
        <Suspense fallback={null}>
          <PartialCloseModal
            isOpen={!!partialCloseTarget}
            onClose={() => setPartialCloseTarget(null)}
            trade={partialCloseTarget}
            onPartialClose={handlePartialClose}
            theme={theme}
          />
        </Suspense>

        {/* AI Trade Review Modal */}
        {showAIReview && tradeToReview && (
          <Suspense fallback={null}>
            <AITradeReview
              trade={tradeToReview}
              onClose={() => {
                setShowAIReview(false);
                setTradeToReview(null);
              }}
              theme="dark"
            />
          </Suspense>
        )}
      </div>
    </div>
  );
};

export default FXTradingDashboard;