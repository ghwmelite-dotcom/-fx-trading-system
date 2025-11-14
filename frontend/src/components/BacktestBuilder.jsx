import { useState, useEffect } from 'react';
import { Play, Settings, Code, TrendingUp, AlertCircle, CheckCircle, Info, Zap, Target, DollarSign } from 'lucide-react';

const BacktestBuilder = ({ apiUrl, authToken, onBacktestComplete }) => {
  // Strategy type state
  const [strategyType, setStrategyType] = useState('indicator'); // indicator, rules, code

  // Strategy configuration
  const [strategyName, setStrategyName] = useState('');
  const [strategyDescription, setStrategyDescription] = useState('');

  // Pre-built indicator settings
  const [indicatorType, setIndicatorType] = useState('ma_crossover');
  const [maFastPeriod, setMaFastPeriod] = useState(10);
  const [maSlowPeriod, setMaSlowPeriod] = useState(50);
  const [rsiPeriod, setRsiPeriod] = useState(14);
  const [rsiOverbought, setRsiOverbought] = useState(70);
  const [rsiOversold, setRsiOversold] = useState(30);
  const [macdFast, setMacdFast] = useState(12);
  const [macdSlow, setMacdSlow] = useState(26);
  const [macdSignal, setMacdSignal] = useState(9);
  const [bbPeriod, setBbPeriod] = useState(20);
  const [bbStdDev, setBbStdDev] = useState(2);
  const [stochKPeriod, setStochKPeriod] = useState(14);
  const [stochDPeriod, setStochDPeriod] = useState(3);
  const [stochOverbought, setStochOverbought] = useState(80);
  const [stochOversold, setStochOversold] = useState(20);

  // Rules-based builder
  const [entryRules, setEntryRules] = useState([
    { field: 'close', operator: '>', value: '', logic: 'AND' }
  ]);
  const [exitRules, setExitRules] = useState([
    { field: 'close', operator: '<', value: '', logic: 'AND' }
  ]);

  // Custom code
  const [customCode, setCustomCode] = useState(`// Entry Signal Function
function shouldEnter(bar, previousBars) {
  // Return true to enter long, false otherwise
  // bar has: { open, high, low, close, volume, timestamp }
  // previousBars is an array of past bars

  return false;
}

// Exit Signal Function
function shouldExit(bar, previousBars, position) {
  // Return true to exit position
  // position has: { entryPrice, entryTime, type }

  return false;
}`);

  // Position sizing
  const [positionSizingType, setPositionSizingType] = useState('fixed'); // fixed, percentage, risk
  const [fixedLots, setFixedLots] = useState(0.1);
  const [riskPercentage, setRiskPercentage] = useState(1);

  // Stop loss / Take profit
  const [stopLossType, setStopLossType] = useState('fixed'); // fixed, atr, percentage, rr
  const [stopLossPips, setStopLossPips] = useState(50);
  const [stopLossAtrMultiplier, setStopLossAtrMultiplier] = useState(2);
  const [stopLossPercentage, setStopLossPercentage] = useState(1);

  const [takeProfitType, setTakeProfitType] = useState('rr'); // fixed, atr, percentage, rr
  const [takeProfitPips, setTakeProfitPips] = useState(100);
  const [takeProfitAtrMultiplier, setTakeProfitAtrMultiplier] = useState(3);
  const [takeProfitPercentage, setTakeProfitPercentage] = useState(2);
  const [rrRatio, setRrRatio] = useState(2);

  // Risk management
  const [maxPositions, setMaxPositions] = useState(1);
  const [riskPerTrade, setRiskPerTrade] = useState(1);

  // Backtest configuration
  const [datasets, setDatasets] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [initialCapital, setInitialCapital] = useState(10000);

  // Execution parameters
  const [spreadPips, setSpreadPips] = useState(2);
  const [commissionPerTrade, setCommissionPerTrade] = useState(7);
  const [slippagePips, setSlippagePips] = useState(1);
  const [considerMarketHours, setConsiderMarketHours] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [loadingDatasets, setLoadingDatasets] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  // Load available datasets
  useEffect(() => {
    loadDatasets();
  }, []);

  const loadDatasets = async () => {
    setLoadingDatasets(true);
    try {
      const response = await fetch(`${apiUrl}/api/backtest/data`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      if (!response.ok) throw new Error('Failed to load datasets');

      const data = await response.json();
      setDatasets(data.data || []);
    } catch (err) {
      setError('Failed to load datasets: ' + err.message);
    } finally {
      setLoadingDatasets(false);
    }
  };

  // Add entry rule
  const addEntryRule = () => {
    setEntryRules([...entryRules, { field: 'close', operator: '>', value: '', logic: 'AND' }]);
  };

  // Remove entry rule
  const removeEntryRule = (index) => {
    setEntryRules(entryRules.filter((_, i) => i !== index));
  };

  // Update entry rule
  const updateEntryRule = (index, key, value) => {
    const newRules = [...entryRules];
    newRules[index][key] = value;
    setEntryRules(newRules);
  };

  // Add exit rule
  const addExitRule = () => {
    setExitRules([...exitRules, { field: 'close', operator: '<', value: '', logic: 'AND' }]);
  };

  // Remove exit rule
  const removeExitRule = (index) => {
    setExitRules(exitRules.filter((_, i) => i !== index));
  };

  // Update exit rule
  const updateExitRule = (index, key, value) => {
    const newRules = [...exitRules];
    newRules[index][key] = value;
    setExitRules(newRules);
  };

  // Validate form
  const validateForm = () => {
    const errors = {};

    if (!strategyName.trim()) {
      errors.strategyName = 'Strategy name is required';
    }

    if (!selectedDataset) {
      errors.selectedDataset = 'Please select a dataset';
    }

    if (!startDate) {
      errors.startDate = 'Start date is required';
    }

    if (!endDate) {
      errors.endDate = 'End date is required';
    }

    if (startDate && endDate && startDate >= endDate) {
      errors.dateRange = 'End date must be after start date';
    }

    if (initialCapital <= 0) {
      errors.initialCapital = 'Initial capital must be positive';
    }

    if (strategyType === 'rules') {
      if (entryRules.some(rule => !rule.value)) {
        errors.entryRules = 'All entry rule values must be filled';
      }
      if (exitRules.some(rule => !rule.value)) {
        errors.exitRules = 'All exit rule values must be filled';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit backtest
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setError('Please fix validation errors');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Build strategy configuration based on type
      let strategyConfig = {};

      if (strategyType === 'indicator') {
        strategyConfig = {
          type: 'indicator',
          indicator: indicatorType,
          params: getIndicatorParams()
        };
      } else if (strategyType === 'rules') {
        strategyConfig = {
          type: 'rules',
          entryRules,
          exitRules
        };
      } else if (strategyType === 'code') {
        strategyConfig = {
          type: 'code',
          code: customCode
        };
      }

      // Build position sizing config
      const positionSizing = {
        type: positionSizingType,
        fixedLots: positionSizingType === 'fixed' ? fixedLots : undefined,
        riskPercentage: positionSizingType === 'percentage' || positionSizingType === 'risk' ? riskPercentage : undefined
      };

      // Build stop loss config
      const stopLoss = {
        type: stopLossType,
        pips: stopLossType === 'fixed' ? stopLossPips : undefined,
        atrMultiplier: stopLossType === 'atr' ? stopLossAtrMultiplier : undefined,
        percentage: stopLossType === 'percentage' ? stopLossPercentage : undefined
      };

      // Build take profit config
      const takeProfit = {
        type: takeProfitType,
        pips: takeProfitType === 'fixed' ? takeProfitPips : undefined,
        atrMultiplier: takeProfitType === 'atr' ? takeProfitAtrMultiplier : undefined,
        percentage: takeProfitType === 'percentage' ? takeProfitPercentage : undefined,
        rrRatio: takeProfitType === 'rr' ? rrRatio : undefined
      };

      // Parse dataset selection (format: "SYMBOL-TIMEFRAME")
      const [symbol, timeframe] = selectedDataset.split('-');

      const backtestConfig = {
        name: strategyName,
        description: strategyDescription,
        strategy: strategyConfig,
        positionSizing,
        stopLoss,
        takeProfit,
        maxPositions,
        riskPerTrade,
        symbol,
        timeframe,
        startDate,
        endDate,
        initialCapital,
        spreadPips,
        commissionPerTrade,
        slippagePips,
        considerMarketHours
      };

      const response = await fetch(`${apiUrl}/api/backtest/run`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(backtestConfig)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Backtest failed');
      }

      const result = await response.json();

      setSuccess(`Backtest completed! ${result.totalTrades} trades simulated.`);

      // Call completion callback with backtest ID
      if (onBacktestComplete && result.backtestId) {
        setTimeout(() => {
          onBacktestComplete(result.backtestId);
        }, 1500);
      }
    } catch (err) {
      setError('Backtest failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Get indicator parameters based on selected indicator type
  const getIndicatorParams = () => {
    switch (indicatorType) {
      case 'ma_crossover':
        return { fastPeriod: maFastPeriod, slowPeriod: maSlowPeriod };
      case 'rsi':
        return { period: rsiPeriod, overbought: rsiOverbought, oversold: rsiOversold };
      case 'macd':
        return { fastPeriod: macdFast, slowPeriod: macdSlow, signalPeriod: macdSignal };
      case 'bollinger':
        return { period: bbPeriod, stdDev: bbStdDev };
      case 'stochastic':
        return { kPeriod: stochKPeriod, dPeriod: stochDPeriod, overbought: stochOverbought, oversold: stochOversold };
      default:
        return {};
    }
  };

  // Render indicator-specific settings
  const renderIndicatorSettings = () => {
    switch (indicatorType) {
      case 'ma_crossover':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fast MA Period
                </label>
                <input
                  type="number"
                  value={maFastPeriod}
                  onChange={(e) => setMaFastPeriod(Number(e.target.value))}
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Slow MA Period
                </label>
                <input
                  type="number"
                  value={maSlowPeriod}
                  onChange={(e) => setMaSlowPeriod(Number(e.target.value))}
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Buy when fast MA crosses above slow MA, sell when it crosses below
            </p>
          </div>
        );

      case 'rsi':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  RSI Period
                </label>
                <input
                  type="number"
                  value={rsiPeriod}
                  onChange={(e) => setRsiPeriod(Number(e.target.value))}
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Overbought Level
                </label>
                <input
                  type="number"
                  value={rsiOverbought}
                  onChange={(e) => setRsiOverbought(Number(e.target.value))}
                  min="0"
                  max="100"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Oversold Level
                </label>
                <input
                  type="number"
                  value={rsiOversold}
                  onChange={(e) => setRsiOversold(Number(e.target.value))}
                  min="0"
                  max="100"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Buy when RSI crosses above oversold level, sell when it crosses below overbought level
            </p>
          </div>
        );

      case 'macd':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fast Period
                </label>
                <input
                  type="number"
                  value={macdFast}
                  onChange={(e) => setMacdFast(Number(e.target.value))}
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Slow Period
                </label>
                <input
                  type="number"
                  value={macdSlow}
                  onChange={(e) => setMacdSlow(Number(e.target.value))}
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Signal Period
                </label>
                <input
                  type="number"
                  value={macdSignal}
                  onChange={(e) => setMacdSignal(Number(e.target.value))}
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Buy when MACD crosses above signal line, sell when it crosses below
            </p>
          </div>
        );

      case 'bollinger':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Period
                </label>
                <input
                  type="number"
                  value={bbPeriod}
                  onChange={(e) => setBbPeriod(Number(e.target.value))}
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Standard Deviations
                </label>
                <input
                  type="number"
                  value={bbStdDev}
                  onChange={(e) => setBbStdDev(Number(e.target.value))}
                  min="0.1"
                  step="0.1"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Buy when price touches lower band, sell when it touches upper band
            </p>
          </div>
        );

      case 'stochastic':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  %K Period
                </label>
                <input
                  type="number"
                  value={stochKPeriod}
                  onChange={(e) => setStochKPeriod(Number(e.target.value))}
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  %D Period
                </label>
                <input
                  type="number"
                  value={stochDPeriod}
                  onChange={(e) => setStochDPeriod(Number(e.target.value))}
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Overbought Level
                </label>
                <input
                  type="number"
                  value={stochOverbought}
                  onChange={(e) => setStochOverbought(Number(e.target.value))}
                  min="0"
                  max="100"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Oversold Level
                </label>
                <input
                  type="number"
                  value={stochOversold}
                  onChange={(e) => setStochOversold(Number(e.target.value))}
                  min="0"
                  max="100"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Buy when %K crosses above oversold level, sell when it crosses below overbought level
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Build Backtest</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Configure and run strategy backtests on historical data
          </p>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
          >
            ×
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-green-800 dark:text-green-200">{success}</p>
          </div>
          <button
            onClick={() => setSuccess(null)}
            className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200"
          >
            ×
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Strategy Configuration */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            Strategy Configuration
          </h3>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Strategy Name *
                </label>
                <input
                  type="text"
                  value={strategyName}
                  onChange={(e) => setStrategyName(e.target.value)}
                  placeholder="My Trading Strategy"
                  className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    validationErrors.strategyName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  required
                />
                {validationErrors.strategyName && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">{validationErrors.strategyName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={strategyDescription}
                  onChange={(e) => setStrategyDescription(e.target.value)}
                  placeholder="Brief description of your strategy"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Strategy Type Tabs */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Strategy Type
              </label>
              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setStrategyType('indicator')}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    strategyType === 'indicator'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <TrendingUp className="w-4 h-4 inline mr-2" />
                  Pre-built Indicators
                </button>
                <button
                  type="button"
                  onClick={() => setStrategyType('rules')}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    strategyType === 'rules'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <Settings className="w-4 h-4 inline mr-2" />
                  Rules Builder
                </button>
                <button
                  type="button"
                  onClick={() => setStrategyType('code')}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    strategyType === 'code'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <Code className="w-4 h-4 inline mr-2" />
                  Custom Code
                </button>
              </div>

              {/* Indicator Type Selection */}
              {strategyType === 'indicator' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Select Indicator
                    </label>
                    <select
                      value={indicatorType}
                      onChange={(e) => setIndicatorType(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="ma_crossover">Moving Average Crossover</option>
                      <option value="rsi">RSI (Relative Strength Index)</option>
                      <option value="macd">MACD</option>
                      <option value="bollinger">Bollinger Bands</option>
                      <option value="stochastic">Stochastic Oscillator</option>
                    </select>
                  </div>

                  {renderIndicatorSettings()}
                </div>
              )}

              {/* Rules Builder */}
              {strategyType === 'rules' && (
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Entry Rules
                      </label>
                      <button
                        type="button"
                        onClick={addEntryRule}
                        className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300"
                      >
                        + Add Rule
                      </button>
                    </div>
                    {entryRules.map((rule, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <select
                          value={rule.field}
                          onChange={(e) => updateEntryRule(index, 'field', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        >
                          <option value="close">Close</option>
                          <option value="open">Open</option>
                          <option value="high">High</option>
                          <option value="low">Low</option>
                          <option value="volume">Volume</option>
                        </select>
                        <select
                          value={rule.operator}
                          onChange={(e) => updateEntryRule(index, 'operator', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        >
                          <option value=">">Greater than</option>
                          <option value="<">Less than</option>
                          <option value=">=">Greater or equal</option>
                          <option value="<=">Less or equal</option>
                          <option value="==">Equal to</option>
                        </select>
                        <input
                          type="number"
                          value={rule.value}
                          onChange={(e) => updateEntryRule(index, 'value', e.target.value)}
                          placeholder="Value"
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        />
                        {index > 0 && (
                          <select
                            value={rule.logic}
                            onChange={(e) => updateEntryRule(index, 'logic', e.target.value)}
                            className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                          >
                            <option value="AND">AND</option>
                            <option value="OR">OR</option>
                          </select>
                        )}
                        {entryRules.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeEntryRule(index)}
                            className="px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                    {validationErrors.entryRules && (
                      <p className="text-sm text-red-600 dark:text-red-400 mt-1">{validationErrors.entryRules}</p>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Exit Rules
                      </label>
                      <button
                        type="button"
                        onClick={addExitRule}
                        className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300"
                      >
                        + Add Rule
                      </button>
                    </div>
                    {exitRules.map((rule, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <select
                          value={rule.field}
                          onChange={(e) => updateExitRule(index, 'field', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        >
                          <option value="close">Close</option>
                          <option value="open">Open</option>
                          <option value="high">High</option>
                          <option value="low">Low</option>
                          <option value="volume">Volume</option>
                        </select>
                        <select
                          value={rule.operator}
                          onChange={(e) => updateExitRule(index, 'operator', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        >
                          <option value=">">Greater than</option>
                          <option value="<">Less than</option>
                          <option value=">=">Greater or equal</option>
                          <option value="<=">Less or equal</option>
                          <option value="==">Equal to</option>
                        </select>
                        <input
                          type="number"
                          value={rule.value}
                          onChange={(e) => updateExitRule(index, 'value', e.target.value)}
                          placeholder="Value"
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        />
                        {index > 0 && (
                          <select
                            value={rule.logic}
                            onChange={(e) => updateExitRule(index, 'logic', e.target.value)}
                            className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                          >
                            <option value="AND">AND</option>
                            <option value="OR">OR</option>
                          </select>
                        )}
                        {exitRules.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeExitRule(index)}
                            className="px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                    {validationErrors.exitRules && (
                      <p className="text-sm text-red-600 dark:text-red-400 mt-1">{validationErrors.exitRules}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Custom Code Editor */}
              {strategyType === 'code' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Custom JavaScript Code
                  </label>
                  <textarea
                    value={customCode}
                    onChange={(e) => setCustomCode(e.target.value)}
                    rows={15}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Write your custom strategy logic..."
                  />
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    Define shouldEnter() and shouldExit() functions. Return true to execute the action.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Position Sizing & Risk Management */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
            Position Sizing & Risk Management
          </h3>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Position Sizing
                </label>
                <select
                  value={positionSizingType}
                  onChange={(e) => setPositionSizingType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="fixed">Fixed Lots</option>
                  <option value="percentage">Account Percentage</option>
                  <option value="risk">Risk-Based</option>
                </select>
              </div>

              {positionSizingType === 'fixed' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Fixed Lot Size
                  </label>
                  <input
                    type="number"
                    value={fixedLots}
                    onChange={(e) => setFixedLots(Number(e.target.value))}
                    min="0.01"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              )}

              {(positionSizingType === 'percentage' || positionSizingType === 'risk') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {positionSizingType === 'percentage' ? 'Account %' : 'Risk %'} per Trade
                  </label>
                  <input
                    type="number"
                    value={riskPercentage}
                    onChange={(e) => setRiskPercentage(Number(e.target.value))}
                    min="0.1"
                    max="100"
                    step="0.1"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Stop Loss Type
                </label>
                <select
                  value={stopLossType}
                  onChange={(e) => setStopLossType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="fixed">Fixed Pips</option>
                  <option value="atr">ATR Multiple</option>
                  <option value="percentage">Percentage</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {stopLossType === 'fixed' ? 'Stop Loss (Pips)' : stopLossType === 'atr' ? 'ATR Multiplier' : 'Percentage'}
                </label>
                <input
                  type="number"
                  value={stopLossType === 'fixed' ? stopLossPips : stopLossType === 'atr' ? stopLossAtrMultiplier : stopLossPercentage}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (stopLossType === 'fixed') setStopLossPips(val);
                    else if (stopLossType === 'atr') setStopLossAtrMultiplier(val);
                    else setStopLossPercentage(val);
                  }}
                  min="0.1"
                  step="0.1"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Take Profit Type
                </label>
                <select
                  value={takeProfitType}
                  onChange={(e) => setTakeProfitType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="fixed">Fixed Pips</option>
                  <option value="atr">ATR Multiple</option>
                  <option value="percentage">Percentage</option>
                  <option value="rr">Risk:Reward Ratio</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {takeProfitType === 'fixed' ? 'Take Profit (Pips)' : takeProfitType === 'atr' ? 'ATR Multiplier' : takeProfitType === 'percentage' ? 'Percentage' : 'R:R Ratio'}
                </label>
                <input
                  type="number"
                  value={takeProfitType === 'fixed' ? takeProfitPips : takeProfitType === 'atr' ? takeProfitAtrMultiplier : takeProfitType === 'percentage' ? takeProfitPercentage : rrRatio}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (takeProfitType === 'fixed') setTakeProfitPips(val);
                    else if (takeProfitType === 'atr') setTakeProfitAtrMultiplier(val);
                    else if (takeProfitType === 'percentage') setTakeProfitPercentage(val);
                    else setRrRatio(val);
                  }}
                  min="0.1"
                  step="0.1"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Max Concurrent Positions
                </label>
                <input
                  type="number"
                  value={maxPositions}
                  onChange={(e) => setMaxPositions(Number(e.target.value))}
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Risk per Trade (%)
                </label>
                <input
                  type="number"
                  value={riskPerTrade}
                  onChange={(e) => setRiskPerTrade(Number(e.target.value))}
                  min="0.1"
                  max="100"
                  step="0.1"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Backtest Configuration */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Backtest Configuration
          </h3>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Dataset *
                </label>
                {loadingDatasets ? (
                  <div className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                    Loading datasets...
                  </div>
                ) : (
                  <select
                    value={selectedDataset}
                    onChange={(e) => setSelectedDataset(e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      validationErrors.selectedDataset ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    required
                  >
                    <option value="">Select dataset...</option>
                    {datasets.map((ds) => (
                      <option key={`${ds.symbol}-${ds.timeframe}`} value={`${ds.symbol}-${ds.timeframe}`}>
                        {ds.symbol} - {ds.timeframe} ({ds.total_bars.toLocaleString()} bars)
                      </option>
                    ))}
                  </select>
                )}
                {validationErrors.selectedDataset && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">{validationErrors.selectedDataset}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Initial Capital *
                </label>
                <input
                  type="number"
                  value={initialCapital}
                  onChange={(e) => setInitialCapital(Number(e.target.value))}
                  min="100"
                  className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    validationErrors.initialCapital ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  required
                />
                {validationErrors.initialCapital && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">{validationErrors.initialCapital}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    validationErrors.startDate ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  required
                />
                {validationErrors.startDate && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">{validationErrors.startDate}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  End Date *
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    validationErrors.endDate ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  required
                />
                {validationErrors.endDate && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">{validationErrors.endDate}</p>
                )}
              </div>
            </div>
            {validationErrors.dateRange && (
              <p className="text-sm text-red-600 dark:text-red-400">{validationErrors.dateRange}</p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Spread (Pips)
                </label>
                <input
                  type="number"
                  value={spreadPips}
                  onChange={(e) => setSpreadPips(Number(e.target.value))}
                  min="0"
                  step="0.1"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Commission per Trade
                </label>
                <input
                  type="number"
                  value={commissionPerTrade}
                  onChange={(e) => setCommissionPerTrade(Number(e.target.value))}
                  min="0"
                  step="0.1"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Slippage (Pips)
                </label>
                <input
                  type="number"
                  value={slippagePips}
                  onChange={(e) => setSlippagePips(Number(e.target.value))}
                  min="0"
                  step="0.1"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="marketHours"
                checked={considerMarketHours}
                onChange={(e) => setConsiderMarketHours(e.target.checked)}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <label htmlFor="marketHours" className="text-sm text-gray-700 dark:text-gray-300">
                Consider market hours (skip overnight/weekend gaps)
              </label>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Running Backtest...
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              Run Backtest
            </>
          )}
        </button>
      </form>

      {/* Info Section */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">Backtesting Tips</h4>
            <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1 list-disc list-inside">
              <li>Use realistic spread and commission settings for accurate results</li>
              <li>Test on at least 6-12 months of data for statistical significance</li>
              <li>Consider out-of-sample testing to avoid overfitting</li>
              <li>Review individual trades to understand strategy behavior</li>
              <li>Backtest results do not guarantee future performance</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BacktestBuilder;
