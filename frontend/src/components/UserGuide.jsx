import React, { useState, useMemo, useEffect } from 'react';
import {
  BookOpen, Search, CheckCircle, Circle, ChevronDown, ChevronRight,
  Home, TrendingUp, BarChart3, Database, FlaskConical, LineChart,
  Settings, Smartphone, Lightbulb, AlertCircle, Copy, Check,
  Zap, Target, Brain, Shield, Download, Calendar, Tag, Star,
  Camera, Filter, DollarSign, Activity, Award, HelpCircle, Keyboard
} from 'lucide-react';

const UserGuide = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('getting-started');
  const [expandedSections, setExpandedSections] = useState(['getting-started-basics']);
  const [completedSections, setCompletedSections] = useState(() => {
    const saved = localStorage.getItem('userGuideProgress');
    return saved ? JSON.parse(saved) : [];
  });
  const [copiedCode, setCopiedCode] = useState(null);
  const [viewMode, setViewMode] = useState('guided'); // 'guided' or 'reference'

  // Save progress to localStorage
  useEffect(() => {
    localStorage.setItem('userGuideProgress', JSON.stringify(completedSections));
  }, [completedSections]);

  const toggleSection = (sectionId) => {
    setExpandedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const markAsCompleted = (sectionId) => {
    setCompletedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Guide content structure
  const guideContent = {
    categories: [
      {
        id: 'getting-started',
        title: 'Getting Started',
        icon: Home,
        color: 'text-blue-400',
        sections: [
          {
            id: 'getting-started-basics',
            title: 'Platform Basics',
            content: (
              <div className="space-y-4">
                <p className="text-slate-300">
                  Welcome to your FX Trading Dashboard! This platform helps you track trades,
                  analyze performance, and improve your trading skills.
                </p>

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Lightbulb className="text-blue-400 flex-shrink-0 mt-1" size={20} />
                    <div>
                      <h4 className="text-blue-400 font-semibold mb-2">Pro Tip</h4>
                      <p className="text-slate-300 text-sm">
                        Start by connecting your MetaTrader 5 account to automatically sync your trades!
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-white font-semibold">Dashboard Navigation:</h4>
                  <div className="grid gap-2">
                    {[
                      { name: 'Overview', desc: 'Quick stats and recent performance', icon: Home },
                      { name: 'Analytics', desc: 'Deep dive into your trading metrics', icon: BarChart3 },
                      { name: 'Trades', desc: 'View and filter all your trades', icon: TrendingUp },
                      { name: 'Journal', desc: 'Log trades manually with notes', icon: BookOpen },
                      { name: 'Psychology', desc: 'AI-powered trading coach', icon: Brain },
                    ].map(item => (
                      <div key={item.name} className="flex items-start gap-3 bg-slate-800/50 rounded-lg p-3">
                        <item.icon className="text-violet-400 flex-shrink-0 mt-1" size={18} />
                        <div>
                          <div className="text-white font-medium">{item.name}</div>
                          <div className="text-slate-400 text-sm">{item.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          },
          {
            id: 'getting-started-accounts',
            title: 'Multi-Account Setup',
            content: (
              <div className="space-y-4">
                <p className="text-slate-300">
                  Connect multiple MT5 accounts and switch between them seamlessly.
                </p>

                <div className="bg-slate-800 rounded-lg p-4 space-y-3">
                  <h4 className="text-white font-semibold flex items-center gap-2">
                    <span className="bg-violet-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">1</span>
                    Navigate to Settings
                  </h4>
                  <p className="text-slate-400 text-sm ml-8">
                    Click the Settings icon in the top navigation bar.
                  </p>
                </div>

                <div className="bg-slate-800 rounded-lg p-4 space-y-3">
                  <h4 className="text-white font-semibold flex items-center gap-2">
                    <span className="bg-violet-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">2</span>
                    Add MT5 Account
                  </h4>
                  <p className="text-slate-400 text-sm ml-8">
                    Enter your MT5 account number and a friendly name (e.g., "Main Account", "Practice Account").
                  </p>
                </div>

                <div className="bg-slate-800 rounded-lg p-4 space-y-3">
                  <h4 className="text-white font-semibold flex items-center gap-2">
                    <span className="bg-violet-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">3</span>
                    Configure MT5 EA
                  </h4>
                  <p className="text-slate-400 text-sm ml-8">
                    Install the EA on your MT5 terminal to enable automatic trade syncing.
                  </p>
                  <div className="ml-8 bg-slate-900 rounded-lg p-3 font-mono text-sm text-slate-300 relative">
                    <div>Webhook URL: {'{your-api-url}'}/webhook/mt5</div>
                    <button
                      onClick={() => copyToClipboard('Webhook URL: {your-api-url}/webhook/mt5', 'webhook')}
                      className="absolute top-2 right-2 text-slate-400 hover:text-white transition-colors"
                    >
                      {copiedCode === 'webhook' ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>

                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="text-green-400 flex-shrink-0 mt-1" size={20} />
                    <div>
                      <h4 className="text-green-400 font-semibold mb-2">Auto-Detection</h4>
                      <p className="text-slate-300 text-sm">
                        Our EA v2.0 automatically detects your account number - no manual entry needed!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )
          },
          {
            id: 'getting-started-first-trade',
            title: 'Logging Your First Trade',
            content: (
              <div className="space-y-4">
                <p className="text-slate-300">
                  Learn how to manually log a trade in your journal with all the details.
                </p>

                <div className="space-y-3">
                  <h4 className="text-white font-semibold">Quick Entry Steps:</h4>

                  <div className="space-y-2">
                    {[
                      { step: '1', title: 'Go to Journal Tab', desc: 'Click the Journal icon in navigation' },
                      { step: '2', title: 'Click "Add Trade"', desc: 'Opens the trade entry form' },
                      { step: '3', title: 'Fill Basic Details', desc: 'Symbol, direction (Buy/Sell), entry price' },
                      { step: '4', title: 'Add Trade Info', desc: 'Exit price, lot size, profit/loss' },
                      { step: '5', title: 'Enhance with Extras', desc: 'Add tags, emotions, screenshots, notes' },
                      { step: '6', title: 'Rate Your Trade', desc: 'Rate setup quality and execution (1-5 stars)' },
                    ].map(item => (
                      <div key={item.step} className="flex items-start gap-3 bg-slate-800/50 rounded-lg p-3">
                        <div className="bg-violet-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0">
                          {item.step}
                        </div>
                        <div>
                          <div className="text-white font-medium">{item.title}</div>
                          <div className="text-slate-400 text-sm">{item.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="text-amber-400 flex-shrink-0 mt-1" size={20} />
                    <div>
                      <h4 className="text-amber-400 font-semibold mb-2">Important</h4>
                      <p className="text-slate-300 text-sm">
                        Consistent journaling is key! Log trades immediately after closing to capture emotions and insights.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )
          }
        ]
      },
      {
        id: 'trading-journal',
        title: 'Trading Journal',
        icon: BookOpen,
        color: 'text-green-400',
        sections: [
          {
            id: 'journal-features',
            title: 'Journal Features',
            content: (
              <div className="space-y-4">
                <p className="text-slate-300">
                  The trading journal is your personal trading diary. Track every detail that matters.
                </p>

                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { icon: Tag, title: 'Strategy Tags', desc: 'Categorize trades by strategy type (scalping, swing, etc.)' },
                    { icon: Star, title: 'Trade Ratings', desc: 'Rate setup quality and execution (1-5 stars)' },
                    { icon: Camera, title: 'Screenshots', desc: 'Upload chart screenshots for visual reference' },
                    { icon: Brain, title: 'Emotions Tracking', desc: 'Log your emotional state during the trade' },
                  ].map(feature => (
                    <div key={feature.title} className="bg-slate-800 rounded-lg p-4">
                      <feature.icon className="text-violet-400 mb-3" size={24} />
                      <h4 className="text-white font-semibold mb-2">{feature.title}</h4>
                      <p className="text-slate-400 text-sm">{feature.desc}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-violet-500/10 border border-violet-500/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Lightbulb className="text-violet-400 flex-shrink-0 mt-1" size={20} />
                    <div>
                      <h4 className="text-violet-400 font-semibold mb-2">Pro Tip</h4>
                      <p className="text-slate-300 text-sm">
                        Use the "Notes" field to document your thought process, market conditions, and lessons learned.
                        This becomes invaluable when reviewing past trades!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )
          },
          {
            id: 'journal-screenshots',
            title: 'Adding Screenshots',
            content: (
              <div className="space-y-4">
                <p className="text-slate-300">
                  Visual records help you remember exact market conditions and trade setups.
                </p>

                <div className="bg-slate-800 rounded-lg p-4 space-y-3">
                  <h4 className="text-white font-semibold">Two Ways to Add Screenshots:</h4>

                  <div className="space-y-3">
                    <div className="bg-slate-900 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Camera className="text-violet-400" size={18} />
                        <span className="text-white font-medium">Method 1: Upload Files</span>
                      </div>
                      <p className="text-slate-400 text-sm">
                        Click the "Upload Screenshot" button in the trade form and select your image files.
                        Supports PNG, JPG, GIF formats.
                      </p>
                    </div>

                    <div className="bg-slate-900 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="text-violet-400" size={18} />
                        <span className="text-white font-medium">Method 2: Quick Capture</span>
                      </div>
                      <p className="text-slate-400 text-sm">
                        Use the built-in screenshot tool to capture your MT5 charts directly.
                        Click "Quick Capture" and select the area to screenshot.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800 rounded-lg p-4">
                  <h4 className="text-white font-semibold mb-3">Best Practices:</h4>
                  <ul className="space-y-2 text-slate-300 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="text-green-400 flex-shrink-0 mt-0.5" size={16} />
                      <span>Include entry point, stop loss, and take profit levels in your screenshots</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="text-green-400 flex-shrink-0 mt-0.5" size={16} />
                      <span>Capture multiple timeframes to show overall market context</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="text-green-400 flex-shrink-0 mt-0.5" size={16} />
                      <span>Screenshot both your entry and exit to see price evolution</span>
                    </li>
                  </ul>
                </div>
              </div>
            )
          }
        ]
      },
      {
        id: 'analytics',
        title: 'Analytics Dashboard',
        icon: BarChart3,
        color: 'text-purple-400',
        sections: [
          {
            id: 'analytics-overview',
            title: 'Understanding Your Metrics',
            content: (
              <div className="space-y-4">
                <p className="text-slate-300">
                  The analytics dashboard provides deep insights into your trading performance.
                </p>

                <div className="space-y-3">
                  <h4 className="text-white font-semibold">Key Metrics Explained:</h4>

                  <div className="space-y-2">
                    {[
                      {
                        metric: 'Win Rate',
                        desc: 'Percentage of winning trades. Good traders typically have 45-60% win rate.',
                        formula: '(Winning Trades ÷ Total Trades) × 100'
                      },
                      {
                        metric: 'Profit Factor',
                        desc: 'Ratio of gross profit to gross loss. Above 1.5 is considered good.',
                        formula: 'Gross Profit ÷ Gross Loss'
                      },
                      {
                        metric: 'Sharpe Ratio',
                        desc: 'Risk-adjusted return metric. Higher is better (>1.0 is good, >2.0 is excellent).',
                        formula: '(Average Return - Risk-Free Rate) ÷ Standard Deviation'
                      },
                      {
                        metric: 'Max Drawdown',
                        desc: 'Largest peak-to-trough decline. Lower is better. Keep below 20%.',
                        formula: 'Largest Percentage Drop from Peak'
                      },
                      {
                        metric: 'Calmar Ratio',
                        desc: 'Return vs max drawdown. Higher is better (>3.0 is excellent).',
                        formula: 'Annual Return ÷ Max Drawdown'
                      },
                    ].map(item => (
                      <div key={item.metric} className="bg-slate-800 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-white font-semibold">{item.metric}</h4>
                          <code className="text-xs bg-slate-900 px-2 py-1 rounded text-violet-400">
                            {item.formula}
                          </code>
                        </div>
                        <p className="text-slate-400 text-sm">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Lightbulb className="text-blue-400 flex-shrink-0 mt-1" size={20} />
                    <div>
                      <h4 className="text-blue-400 font-semibold mb-2">Pro Tip</h4>
                      <p className="text-slate-300 text-sm">
                        Focus on consistency over individual metrics. A 50% win rate with good risk management
                        beats a 70% win rate with poor risk/reward ratios!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )
          },
          {
            id: 'analytics-charts',
            title: 'Reading Your Charts',
            content: (
              <div className="space-y-4">
                <p className="text-slate-300">
                  Learn how to interpret the various charts and visualizations.
                </p>

                <div className="space-y-3">
                  {[
                    {
                      title: 'Equity Curve',
                      desc: 'Shows your account balance over time. Ideally should trend upward with minimal volatility.',
                      tips: ['Look for consistent growth', 'Watch for large drawdowns', 'Identify winning/losing streaks']
                    },
                    {
                      title: 'Monthly Returns',
                      desc: 'Bar chart showing profit/loss by month. Helps identify seasonal patterns.',
                      tips: ['Check for consistency', 'Identify best/worst months', 'Spot trading patterns']
                    },
                    {
                      title: 'Win/Loss Distribution',
                      desc: 'Pie chart of winning vs losing trades. Visual win rate representation.',
                      tips: ['Balanced is good', 'Too many losses? Review strategy', 'Focus on profit quality']
                    },
                    {
                      title: 'Symbol Performance',
                      desc: 'Shows which currency pairs you profit from most.',
                      tips: ['Focus on your best pairs', 'Avoid consistently losing pairs', 'Diversify wisely']
                    },
                  ].map(chart => (
                    <div key={chart.title} className="bg-slate-800 rounded-lg p-4">
                      <h4 className="text-white font-semibold mb-2">{chart.title}</h4>
                      <p className="text-slate-400 text-sm mb-3">{chart.desc}</p>
                      <div className="bg-slate-900 rounded-lg p-3">
                        <div className="text-violet-400 text-xs font-semibold mb-2">KEY INSIGHTS:</div>
                        <ul className="space-y-1">
                          {chart.tips.map((tip, idx) => (
                            <li key={idx} className="text-slate-300 text-sm flex items-start gap-2">
                              <span className="text-violet-400 flex-shrink-0">•</span>
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          }
        ]
      },
      {
        id: 'backtesting',
        title: 'Backtesting System',
        icon: FlaskConical,
        color: 'text-cyan-400',
        sections: [
          {
            id: 'backtest-intro',
            title: 'What is Backtesting?',
            content: (
              <div className="space-y-4">
                <p className="text-slate-300">
                  Backtesting lets you test trading strategies on historical data before risking real money.
                </p>

                <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Database className="text-cyan-400 flex-shrink-0 mt-1" size={24} />
                    <div>
                      <h4 className="text-cyan-400 font-semibold mb-2">Why Backtest?</h4>
                      <ul className="space-y-2 text-slate-300 text-sm">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="text-green-400 flex-shrink-0 mt-0.5" size={16} />
                          <span>Validate strategy profitability before going live</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="text-green-400 flex-shrink-0 mt-0.5" size={16} />
                          <span>Optimize entry/exit rules with real historical data</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="text-green-400 flex-shrink-0 mt-0.5" size={16} />
                          <span>Understand strategy behavior in different market conditions</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="text-green-400 flex-shrink-0 mt-0.5" size={16} />
                          <span>Calculate risk metrics (max drawdown, Sharpe ratio, etc.)</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  {[
                    { step: '1', title: 'Upload Data', icon: Database, desc: 'Import historical OHLCV data' },
                    { step: '2', title: 'Build Strategy', icon: FlaskConical, desc: 'Configure your trading rules' },
                    { step: '3', title: 'Analyze Results', icon: LineChart, desc: 'Review performance metrics' },
                  ].map(item => (
                    <div key={item.step} className="bg-slate-800 rounded-lg p-4 text-center">
                      <div className="bg-cyan-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mx-auto mb-3">
                        {item.step}
                      </div>
                      <item.icon className="text-cyan-400 mx-auto mb-2" size={24} />
                      <h4 className="text-white font-semibold mb-1">{item.title}</h4>
                      <p className="text-slate-400 text-sm">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )
          },
          {
            id: 'backtest-data',
            title: 'Uploading Historical Data',
            content: (
              <div className="space-y-4">
                <p className="text-slate-300">
                  Learn how to prepare and upload CSV files with historical price data.
                </p>

                <div className="bg-slate-800 rounded-lg p-4">
                  <h4 className="text-white font-semibold mb-3">CSV Format Requirements:</h4>
                  <div className="bg-slate-900 rounded-lg p-3 font-mono text-sm text-slate-300 overflow-x-auto">
                    <div>timestamp,open,high,low,close,volume</div>
                    <div>2024-01-01 00:00:00,1.0850,1.0875,1.0840,1.0860,1000</div>
                    <div>2024-01-01 01:00:00,1.0860,1.0890,1.0855,1.0880,1200</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-white font-semibold">Column Definitions:</h4>
                  <div className="grid gap-2">
                    {[
                      { col: 'timestamp', desc: 'Date and time (YYYY-MM-DD HH:MM:SS format)' },
                      { col: 'open', desc: 'Opening price for the candle' },
                      { col: 'high', desc: 'Highest price during the period' },
                      { col: 'low', desc: 'Lowest price during the period' },
                      { col: 'close', desc: 'Closing price for the candle' },
                      { col: 'volume', desc: 'Trading volume (optional, can be 0)' },
                    ].map(item => (
                      <div key={item.col} className="flex items-start gap-3 bg-slate-800/50 rounded-lg p-3">
                        <code className="text-cyan-400 font-semibold flex-shrink-0">{item.col}</code>
                        <span className="text-slate-400 text-sm">{item.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="text-amber-400 flex-shrink-0 mt-1" size={20} />
                    <div>
                      <h4 className="text-amber-400 font-semibold mb-2">Important Notes</h4>
                      <ul className="space-y-1 text-slate-300 text-sm">
                        <li>• Data must be in chronological order (oldest first)</li>
                        <li>• Timestamp format must be consistent</li>
                        <li>• Missing candles will be filled automatically</li>
                        <li>• Recommended: At least 1000 candles for accurate backtesting</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )
          },
          {
            id: 'backtest-strategies',
            title: 'Building Strategies',
            content: (
              <div className="space-y-4">
                <p className="text-slate-300">
                  Create trading strategies using three different approaches.
                </p>

                <div className="space-y-3">
                  {[
                    {
                      title: 'Indicator-Based Strategies',
                      icon: Activity,
                      desc: 'Use pre-built technical indicators like RSI, MACD, Moving Averages',
                      example: 'Buy when RSI < 30 (oversold), Sell when RSI > 70 (overbought)',
                      color: 'violet'
                    },
                    {
                      title: 'Rules-Based Builder',
                      icon: Target,
                      desc: 'Visual strategy builder with IF-THEN rules',
                      example: 'IF (SMA_50 crosses above SMA_200) THEN Buy',
                      color: 'blue'
                    },
                    {
                      title: 'Custom JavaScript Code',
                      icon: Zap,
                      desc: 'Write advanced strategies with full control',
                      example: 'Complex algorithms, multiple conditions, custom indicators',
                      color: 'green'
                    },
                  ].map(strategy => (
                    <div key={strategy.title} className={`bg-slate-800 rounded-lg p-4 border-l-4 border-${strategy.color}-500`}>
                      <div className="flex items-start gap-3 mb-3">
                        <strategy.icon className={`text-${strategy.color}-400 flex-shrink-0`} size={24} />
                        <div>
                          <h4 className="text-white font-semibold">{strategy.title}</h4>
                          <p className="text-slate-400 text-sm mt-1">{strategy.desc}</p>
                        </div>
                      </div>
                      <div className="bg-slate-900 rounded-lg p-3">
                        <div className="text-xs text-slate-500 mb-1">Example:</div>
                        <div className="text-slate-300 text-sm">{strategy.example}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-violet-500/10 border border-violet-500/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Lightbulb className="text-violet-400 flex-shrink-0 mt-1" size={20} />
                    <div>
                      <h4 className="text-violet-400 font-semibold mb-2">Pro Tip</h4>
                      <p className="text-slate-300 text-sm">
                        Start with simple indicator-based strategies to learn the platform, then progress to
                        more complex rules-based or custom code strategies.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )
          }
        ]
      },
      {
        id: 'advanced',
        title: 'Advanced Features',
        icon: Zap,
        color: 'text-yellow-400',
        sections: [
          {
            id: 'advanced-pwa',
            title: 'PWA Installation',
            content: (
              <div className="space-y-4">
                <p className="text-slate-300">
                  Install the platform as a Progressive Web App for native app experience.
                </p>

                <div className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Smartphone className="text-violet-400 flex-shrink-0 mt-1" size={24} />
                    <div>
                      <h4 className="text-violet-400 font-semibold mb-2">PWA Benefits</h4>
                      <ul className="space-y-2 text-slate-300 text-sm">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="text-green-400 flex-shrink-0 mt-0.5" size={16} />
                          <span>Works offline with cached data</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="text-green-400 flex-shrink-0 mt-0.5" size={16} />
                          <span>Native app-like experience on mobile and desktop</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="text-green-400 flex-shrink-0 mt-0.5" size={16} />
                          <span>Faster load times with service worker caching</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="text-green-400 flex-shrink-0 mt-0.5" size={16} />
                          <span>Add to home screen for quick access</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-white font-semibold">Installation Steps:</h4>

                  <div className="bg-slate-800 rounded-lg p-4">
                    <h5 className="text-white font-medium mb-3 flex items-center gap-2">
                      <Download className="text-violet-400" size={18} />
                      Desktop (Chrome/Edge)
                    </h5>
                    <ol className="space-y-2 text-slate-300 text-sm ml-6 list-decimal">
                      <li>Look for the install icon in the address bar</li>
                      <li>Click "Install FX Trading Dashboard"</li>
                      <li>App opens in standalone window</li>
                    </ol>
                  </div>

                  <div className="bg-slate-800 rounded-lg p-4">
                    <h5 className="text-white font-medium mb-3 flex items-center gap-2">
                      <Smartphone className="text-violet-400" size={18} />
                      Mobile (iOS Safari)
                    </h5>
                    <ol className="space-y-2 text-slate-300 text-sm ml-6 list-decimal">
                      <li>Tap the Share button</li>
                      <li>Scroll and tap "Add to Home Screen"</li>
                      <li>Tap "Add" to confirm</li>
                      <li>App appears on home screen</li>
                    </ol>
                  </div>

                  <div className="bg-slate-800 rounded-lg p-4">
                    <h5 className="text-white font-medium mb-3 flex items-center gap-2">
                      <Smartphone className="text-violet-400" size={18} />
                      Mobile (Android Chrome)
                    </h5>
                    <ol className="space-y-2 text-slate-300 text-sm ml-6 list-decimal">
                      <li>Tap the menu (three dots)</li>
                      <li>Select "Add to Home Screen"</li>
                      <li>Confirm installation</li>
                      <li>App appears on home screen</li>
                    </ol>
                  </div>
                </div>
              </div>
            )
          },
          {
            id: 'advanced-psychology',
            title: 'AI Psychology Coach',
            content: (
              <div className="space-y-4">
                <p className="text-slate-300">
                  Get personalized coaching based on your trading patterns and emotional state.
                </p>

                <div className="bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Brain className="text-pink-400 flex-shrink-0 mt-1" size={24} />
                    <div>
                      <h4 className="text-pink-400 font-semibold mb-2">AI-Powered Insights</h4>
                      <p className="text-slate-300 text-sm">
                        Our AI analyzes your trading journal, emotions, and performance patterns to provide
                        personalized coaching and actionable recommendations.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    {
                      title: 'Emotion Analysis',
                      desc: 'Identifies patterns between emotions and trade outcomes',
                      icon: Brain
                    },
                    {
                      title: 'Behavioral Patterns',
                      desc: 'Spots recurring mistakes and bad habits',
                      icon: Target
                    },
                    {
                      title: 'Performance Coaching',
                      desc: 'Suggests improvements based on your data',
                      icon: TrendingUp
                    },
                    {
                      title: 'Risk Management',
                      desc: 'Alerts you to over-trading or position sizing issues',
                      icon: Shield
                    },
                  ].map(feature => (
                    <div key={feature.title} className="bg-slate-800 rounded-lg p-4">
                      <feature.icon className="text-pink-400 mb-2" size={20} />
                      <h4 className="text-white font-semibold mb-1 text-sm">{feature.title}</h4>
                      <p className="text-slate-400 text-xs">{feature.desc}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Lightbulb className="text-blue-400 flex-shrink-0 mt-1" size={20} />
                    <div>
                      <h4 className="text-blue-400 font-semibold mb-2">Pro Tip</h4>
                      <p className="text-slate-300 text-sm">
                        The more detailed your journal entries (especially emotions and notes), the better
                        the AI can coach you. Consistency is key!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )
          },
          {
            id: 'advanced-settings',
            title: 'Settings & Customization',
            content: (
              <div className="space-y-4">
                <p className="text-slate-300">
                  Customize the platform to match your preferences and workflow.
                </p>

                <div className="space-y-3">
                  {[
                    {
                      title: 'Theme Settings',
                      icon: Settings,
                      options: ['Dark mode (default)', 'Light mode', 'Auto (system preference)']
                    },
                    {
                      title: 'Account Management',
                      icon: User,
                      options: ['Add/remove MT5 accounts', 'Set default account', 'Update account names']
                    },
                    {
                      title: 'Notification Preferences',
                      icon: AlertCircle,
                      options: ['Email notifications', 'Trade alerts', 'Performance milestones']
                    },
                    {
                      title: 'Data & Privacy',
                      icon: Shield,
                      options: ['Export your data', 'Delete account', 'Privacy settings']
                    },
                  ].map(section => (
                    <div key={section.title} className="bg-slate-800 rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <section.icon className="text-violet-400" size={20} />
                        <h4 className="text-white font-semibold">{section.title}</h4>
                      </div>
                      <ul className="space-y-1 ml-8">
                        {section.options.map((opt, idx) => (
                          <li key={idx} className="text-slate-400 text-sm flex items-start gap-2">
                            <span className="text-violet-400">•</span>
                            <span>{opt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )
          }
        ]
      },
      {
        id: 'tips-tricks',
        title: 'Tips & Tricks',
        icon: Lightbulb,
        color: 'text-orange-400',
        sections: [
          {
            id: 'tips-shortcuts',
            title: 'Keyboard Shortcuts',
            content: (
              <div className="space-y-4">
                <p className="text-slate-300">
                  Speed up your workflow with keyboard shortcuts.
                </p>

                <div className="grid md:grid-cols-2 gap-3">
                  {[
                    { keys: 'F', action: 'Quick filter trades (in Trades tab)' },
                    { keys: 'Ctrl + K', action: 'Open command palette (coming soon)' },
                    { keys: 'Ctrl + S', action: 'Save current trade/form' },
                    { keys: 'Esc', action: 'Close modals and dialogs' },
                    { keys: 'Ctrl + /', action: 'Toggle dark/light mode' },
                    { keys: 'Ctrl + P', action: 'Print current view' },
                  ].map(shortcut => (
                    <div key={shortcut.keys} className="bg-slate-800 rounded-lg p-3 flex items-center gap-3">
                      <kbd className="bg-slate-900 px-3 py-1.5 rounded text-violet-400 font-mono text-sm font-semibold border border-slate-700">
                        {shortcut.keys}
                      </kbd>
                      <span className="text-slate-300 text-sm">{shortcut.action}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          },
          {
            id: 'tips-best-practices',
            title: 'Best Practices',
            content: (
              <div className="space-y-4">
                <p className="text-slate-300">
                  Follow these best practices to get the most out of the platform.
                </p>

                <div className="space-y-3">
                  {[
                    {
                      title: 'Daily Review Routine',
                      icon: Calendar,
                      tips: [
                        'Review yesterday\'s trades every morning',
                        'Update journal notes while memory is fresh',
                        'Check analytics for weekly/monthly trends',
                        'Set goals for the day'
                      ]
                    },
                    {
                      title: 'Journal Consistency',
                      icon: BookOpen,
                      tips: [
                        'Log trades immediately after closing',
                        'Always add emotions and notes',
                        'Upload screenshots for every major trade',
                        'Tag trades with strategy used'
                      ]
                    },
                    {
                      title: 'Performance Tracking',
                      icon: TrendingUp,
                      tips: [
                        'Review analytics at least weekly',
                        'Focus on metrics that matter (Sharpe, drawdown)',
                        'Identify your best trading times/pairs',
                        'Track improvement over time'
                      ]
                    },
                    {
                      title: 'Risk Management',
                      icon: Shield,
                      tips: [
                        'Never risk more than 1-2% per trade',
                        'Use stop losses on every trade',
                        'Monitor overall exposure across accounts',
                        'Review max drawdown regularly'
                      ]
                    },
                  ].map(practice => (
                    <div key={practice.title} className="bg-slate-800 rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <practice.icon className="text-orange-400" size={20} />
                        <h4 className="text-white font-semibold">{practice.title}</h4>
                      </div>
                      <ul className="space-y-2 ml-8">
                        {practice.tips.map((tip, idx) => (
                          <li key={idx} className="text-slate-300 text-sm flex items-start gap-2">
                            <CheckCircle className="text-green-400 flex-shrink-0 mt-0.5" size={16} />
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )
          }
        ]
      },
      {
        id: 'troubleshooting',
        title: 'Troubleshooting',
        icon: HelpCircle,
        color: 'text-red-400',
        sections: [
          {
            id: 'troubleshooting-common',
            title: 'Common Issues',
            content: (
              <div className="space-y-4">
                <p className="text-slate-300">
                  Solutions to frequently encountered problems.
                </p>

                <div className="space-y-3">
                  {[
                    {
                      problem: 'Trades not syncing from MT5',
                      solutions: [
                        'Verify EA is installed and active on MT5',
                        'Check webhook URL is configured correctly',
                        'Ensure MT5 account number matches in Settings',
                        'Check internet connection on MT5 terminal'
                      ]
                    },
                    {
                      problem: 'Cannot log in to dashboard',
                      solutions: [
                        'Verify email and password are correct',
                        'Clear browser cache and cookies',
                        'Try incognito/private browsing mode',
                        'Reset password if forgotten'
                      ]
                    },
                    {
                      problem: 'Metrics showing incorrect values',
                      solutions: [
                        'Ensure all trades have correct profit/loss values',
                        'Check for duplicate trades in database',
                        'Refresh the page to recalculate',
                        'Verify trade dates are accurate'
                      ]
                    },
                    {
                      problem: 'PWA not installing',
                      solutions: [
                        'Use supported browser (Chrome, Edge, Safari)',
                        'Ensure you\'re on HTTPS (not HTTP)',
                        'Clear browser cache and reload',
                        'Check browser allows PWA installations'
                      ]
                    },
                  ].map(issue => (
                    <div key={issue.problem} className="bg-slate-800 rounded-lg p-4 border-l-4 border-red-500">
                      <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                        <AlertCircle className="text-red-400" size={18} />
                        {issue.problem}
                      </h4>
                      <div className="ml-7">
                        <div className="text-green-400 text-xs font-semibold mb-2">SOLUTIONS:</div>
                        <ol className="space-y-1.5 list-decimal ml-4">
                          {issue.solutions.map((solution, idx) => (
                            <li key={idx} className="text-slate-300 text-sm">{solution}</li>
                          ))}
                        </ol>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <HelpCircle className="text-blue-400 flex-shrink-0 mt-1" size={20} />
                    <div>
                      <h4 className="text-blue-400 font-semibold mb-2">Still Need Help?</h4>
                      <p className="text-slate-300 text-sm">
                        Contact support with details about your issue. Include error messages and screenshots
                        to help us assist you faster.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )
          }
        ]
      }
    ]
  };

  // Calculate progress
  const totalSections = guideContent.categories.reduce((sum, cat) => sum + cat.sections.length, 0);
  const completedCount = completedSections.length;
  const progressPercent = Math.round((completedCount / totalSections) * 100);

  // Filter content based on search
  const filteredCategories = useMemo(() => {
    if (!searchTerm) return guideContent.categories;

    const term = searchTerm.toLowerCase();
    return guideContent.categories
      .map(category => ({
        ...category,
        sections: category.sections.filter(section =>
          section.title.toLowerCase().includes(term) ||
          section.id.toLowerCase().includes(term)
        )
      }))
      .filter(category => category.sections.length > 0);
  }, [searchTerm, guideContent.categories]);

  // Get current category data
  const currentCategory = guideContent.categories.find(cat => cat.id === selectedCategory);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <div className="bg-slate-900/50 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-violet-500 p-2 rounded-lg">
                <BookOpen size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold">User Guide</h1>
                <p className="text-slate-400 text-sm">Master your FX trading platform</p>
              </div>
            </div>

            {/* Progress Badge */}
            <div className="hidden md:flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-slate-400">Your Progress</div>
                <div className="text-lg font-semibold text-violet-400">
                  {completedCount}/{totalSections} sections
                </div>
              </div>
              <div className="relative w-16 h-16">
                <svg className="transform -rotate-90 w-16 h-16">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="transparent"
                    className="text-slate-700"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="transparent"
                    strokeDasharray={`${2 * Math.PI * 28}`}
                    strokeDashoffset={`${2 * Math.PI * 28 * (1 - progressPercent / 100)}`}
                    className="text-violet-500 transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold">{progressPercent}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search topics, features, or keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          {/* View Mode Toggle */}
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => setViewMode('guided')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'guided'
                  ? 'bg-violet-500 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Guided Tour
            </button>
            <button
              onClick={() => setViewMode('reference')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'reference'
                  ? 'bg-violet-500 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Quick Reference
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800/50 rounded-lg p-4 sticky top-32">
              <h3 className="text-sm font-semibold text-slate-400 uppercase mb-3">Categories</h3>
              <div className="space-y-1">
                {filteredCategories.map(category => {
                  const Icon = category.icon;
                  const isActive = selectedCategory === category.id;
                  const categorySections = category.sections.map(s => s.id);
                  const completedInCategory = categorySections.filter(id => completedSections.includes(id)).length;

                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-violet-500 text-white'
                          : 'text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={18} className={isActive ? 'text-white' : category.color} />
                        <span className="font-medium text-sm">{category.title}</span>
                      </div>
                      {completedInCategory > 0 && (
                        <span className={`text-xs ${isActive ? 'text-violet-200' : 'text-slate-500'}`}>
                          {completedInCategory}/{category.sections.length}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3">
            {currentCategory && (
              <div className="space-y-4">
                {/* Category Header */}
                <div className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <currentCategory.icon className={currentCategory.color} size={32} />
                    <h2 className="text-3xl font-bold">{currentCategory.title}</h2>
                  </div>
                  <p className="text-slate-400">
                    {currentCategory.sections.length} sections in this category
                  </p>
                </div>

                {/* Sections */}
                {currentCategory.sections.map(section => {
                  const isExpanded = expandedSections.includes(section.id);
                  const isCompleted = completedSections.includes(section.id);

                  return (
                    <div
                      key={section.id}
                      className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden"
                    >
                      {/* Section Header */}
                      <button
                        onClick={() => toggleSection(section.id)}
                        className="w-full flex items-center justify-between p-4 hover:bg-slate-700/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {isExpanded ? (
                            <ChevronDown className="text-violet-400" size={20} />
                          ) : (
                            <ChevronRight className="text-slate-400" size={20} />
                          )}
                          <h3 className="text-lg font-semibold text-white">{section.title}</h3>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsCompleted(section.id);
                          }}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            isCompleted
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-slate-700 text-slate-400 hover:text-white'
                          }`}
                        >
                          {isCompleted ? (
                            <>
                              <CheckCircle size={16} />
                              <span>Completed</span>
                            </>
                          ) : (
                            <>
                              <Circle size={16} />
                              <span>Mark Complete</span>
                            </>
                          )}
                        </button>
                      </button>

                      {/* Section Content */}
                      {isExpanded && (
                        <div className="p-6 pt-0 border-t border-slate-700">
                          {section.content}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {filteredCategories.length === 0 && (
              <div className="text-center py-12">
                <Search className="mx-auto text-slate-600 mb-4" size={48} />
                <h3 className="text-xl font-semibold text-slate-400 mb-2">No results found</h3>
                <p className="text-slate-500">
                  Try different keywords or browse categories from the sidebar
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserGuide;
