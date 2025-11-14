import { useState, useEffect, useMemo } from 'react';
import { Download, Trash2, TrendingUp, TrendingDown, Target, Award, AlertCircle, ChevronLeft, ChevronRight, Calendar, DollarSign, Percent, BarChart3, Activity } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart } from 'recharts';

const BacktestResults = ({ apiUrl, authToken }) => {
  const [backtests, setBacktests] = useState([]);
  const [selectedBacktest, setSelectedBacktest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Trade list pagination
  const [currentPage, setCurrentPage] = useState(1);
  const tradesPerPage = 20;

  useEffect(() => {
    loadBacktests();
  }, []);

  const loadBacktests = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!authToken) {
        setError('Please log in to access backtesting features');
        setLoading(false);
        return;
      }

      const response = await fetch(`${apiUrl}/api/backtest/results`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 401) {
          throw new Error('Authentication required. Please log in.');
        }
        throw new Error(errorData.error || 'Failed to load backtests');
      }

      const data = await response.json();
      setBacktests(data.data || []);

      // Auto-select first backtest if available
      if (data.data && data.data.length > 0) {
        setSelectedBacktest(data.data[0]);
      }
    } catch (err) {
      setError(err.message || 'Failed to load backtests');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (backtestId) => {
    if (!confirm('Delete this backtest? This cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/api/backtest/results/${backtestId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      if (!response.ok) throw new Error('Failed to delete backtest');

      setSuccess('Backtest deleted successfully');

      // Reload backtests
      loadBacktests();

      // Clear selected if it was deleted
      if (selectedBacktest && selectedBacktest.id === backtestId) {
        setSelectedBacktest(null);
      }
    } catch (err) {
      setError('Delete failed: ' + err.message);
    }
  };

  const handleExport = () => {
    if (!selectedBacktest || !selectedBacktest.trades) return;

    // Create CSV content
    const headers = ['Entry Date', 'Exit Date', 'Pair', 'Type', 'Entry Price', 'Exit Price', 'Lots', 'P&L', 'R-Multiple', 'Pips'];
    const rows = selectedBacktest.trades.map(trade => [
      trade.entryTime,
      trade.exitTime,
      trade.symbol,
      trade.type,
      trade.entryPrice,
      trade.exitPrice,
      trade.lots,
      trade.pnl,
      trade.rMultiple || 0,
      trade.pips || 0
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backtest_${selectedBacktest.name}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    setSuccess('Backtest results exported to CSV');
  };

  // Calculate equity curve data
  const equityCurveData = useMemo(() => {
    if (!selectedBacktest || !selectedBacktest.trades) return [];

    let equity = selectedBacktest.initialCapital || 10000;
    let peak = equity;
    const data = [];

    selectedBacktest.trades.forEach((trade, index) => {
      equity += trade.pnl;
      if (equity > peak) peak = equity;

      const drawdown = peak - equity;
      const drawdownPercent = peak > 0 ? (drawdown / peak) * 100 : 0;

      data.push({
        trade: index + 1,
        date: new Date(trade.exitTime).toLocaleDateString(),
        equity: parseFloat(equity.toFixed(2)),
        drawdown: parseFloat(drawdown.toFixed(2)),
        drawdownPercent: parseFloat(drawdownPercent.toFixed(2))
      });
    });

    return data;
  }, [selectedBacktest]);

  // Calculate monthly returns
  const monthlyReturns = useMemo(() => {
    if (!selectedBacktest || !selectedBacktest.trades) return [];

    const monthlyData = {};

    selectedBacktest.trades.forEach(trade => {
      const date = new Date(trade.exitTime);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthKey,
          pnl: 0,
          trades: 0,
          wins: 0,
          losses: 0
        };
      }

      monthlyData[monthKey].pnl += trade.pnl;
      monthlyData[monthKey].trades++;
      if (trade.pnl > 0) monthlyData[monthKey].wins++;
      if (trade.pnl < 0) monthlyData[monthKey].losses++;
    });

    return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
  }, [selectedBacktest]);

  // Paginate trades
  const paginatedTrades = useMemo(() => {
    if (!selectedBacktest || !selectedBacktest.trades) return [];

    const startIndex = (currentPage - 1) * tradesPerPage;
    const endIndex = startIndex + tradesPerPage;
    return selectedBacktest.trades.slice(startIndex, endIndex);
  }, [selectedBacktest, currentPage]);

  const totalPages = selectedBacktest && selectedBacktest.trades
    ? Math.ceil(selectedBacktest.trades.length / tradesPerPage)
    : 0;

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 dark:bg-gray-800 border border-gray-700 dark:border-gray-600 rounded-lg p-3 shadow-xl">
          <p className="text-white font-medium mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  // Format percentage
  const formatPercent = (value) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading backtest results...</p>
        </div>
      </div>
    );
  }

  if (backtests.length === 0) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400 text-lg">No backtest results yet</p>
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
          Run a backtest to see results here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Backtest Results</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Analyze and compare strategy performance
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
          <Download className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
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

      {/* Backtest Selector */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Select Backtest
        </label>
        <div className="flex gap-3">
          <select
            value={selectedBacktest?.id || ''}
            onChange={(e) => {
              const backtest = backtests.find(b => b.id === Number(e.target.value));
              setSelectedBacktest(backtest);
              setCurrentPage(1);
            }}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            {backtests.map((backtest) => (
              <option key={backtest.id} value={backtest.id}>
                {backtest.name} - {backtest.symbol} {backtest.timeframe} ({new Date(backtest.created_at).toLocaleDateString()})
              </option>
            ))}
          </select>
          {selectedBacktest && (
            <button
              onClick={() => handleDelete(selectedBacktest.id)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2"
              title="Delete backtest"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          )}
        </div>
      </div>

      {selectedBacktest && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 backdrop-blur-xl rounded-xl p-4 border border-blue-500/30">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="text-blue-400" size={20} />
                <h3 className="text-blue-300 font-semibold text-sm">Total Return</h3>
              </div>
              <div className={`text-2xl font-bold mb-1 ${selectedBacktest.totalReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatPercent(selectedBacktest.totalReturn || 0)}
              </div>
              <div className="text-blue-400 text-sm">
                {formatCurrency(selectedBacktest.netProfit || 0)}
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 backdrop-blur-xl rounded-xl p-4 border border-purple-500/30">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="text-purple-400" size={20} />
                <h3 className="text-purple-300 font-semibold text-sm">Total Trades</h3>
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {selectedBacktest.totalTrades || 0}
              </div>
              <div className="text-purple-400 text-sm">
                {selectedBacktest.winningTrades || 0}W / {selectedBacktest.losingTrades || 0}L
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 backdrop-blur-xl rounded-xl p-4 border border-green-500/30">
              <div className="flex items-center gap-2 mb-2">
                <Percent className="text-green-400" size={20} />
                <h3 className="text-green-300 font-semibold text-sm">Win Rate</h3>
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {selectedBacktest.winRate ? selectedBacktest.winRate.toFixed(1) : '0.0'}%
              </div>
              <div className="text-green-400 text-sm">
                Avg Win: {formatCurrency(selectedBacktest.avgWin || 0)}
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 backdrop-blur-xl rounded-xl p-4 border border-yellow-500/30">
              <div className="flex items-center gap-2 mb-2">
                <Target className="text-yellow-400" size={20} />
                <h3 className="text-yellow-300 font-semibold text-sm">Profit Factor</h3>
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {selectedBacktest.profitFactor ? selectedBacktest.profitFactor.toFixed(2) : 'N/A'}
              </div>
              <div className="text-yellow-400 text-sm">
                {selectedBacktest.profitFactor >= 1.5 ? 'Excellent' : selectedBacktest.profitFactor >= 1 ? 'Good' : 'Poor'}
              </div>
            </div>

            <div className="bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 backdrop-blur-xl rounded-xl p-4 border border-cyan-500/30">
              <div className="flex items-center gap-2 mb-2">
                <Award className="text-cyan-400" size={20} />
                <h3 className="text-cyan-300 font-semibold text-sm">Sharpe Ratio</h3>
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {selectedBacktest.sharpeRatio ? selectedBacktest.sharpeRatio.toFixed(2) : 'N/A'}
              </div>
              <div className="text-cyan-400 text-sm">
                {selectedBacktest.sharpeRatio >= 1 ? 'Good' : 'Moderate'}
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-500/20 to-red-600/10 backdrop-blur-xl rounded-xl p-4 border border-red-500/30">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="text-red-400" size={20} />
                <h3 className="text-red-300 font-semibold text-sm">Max Drawdown</h3>
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {selectedBacktest.maxDrawdown ? selectedBacktest.maxDrawdown.toFixed(2) : '0'}%
              </div>
              <div className="text-red-400 text-sm">
                {formatCurrency(selectedBacktest.maxDrawdownAmount || 0)}
              </div>
            </div>
          </div>

          {/* Equity Curve */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                Equity Curve & Drawdown
              </h3>
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>

            {equityCurveData.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={equityCurveData}>
                  <defs>
                    <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                  <XAxis
                    dataKey="date"
                    stroke="#9ca3af"
                    style={{ fontSize: '12px' }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis
                    yAxisId="left"
                    stroke="#9ca3af"
                    style={{ fontSize: '12px' }}
                    label={{ value: 'Equity ($)', angle: -90, position: 'insideLeft' }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#9ca3af"
                    style={{ fontSize: '12px' }}
                    label={{ value: 'Drawdown (%)', angle: 90, position: 'insideRight' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="equity"
                    stroke="#8b5cf6"
                    fill="url(#colorEquity)"
                    name="Equity"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="drawdownPercent"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={false}
                    name="Drawdown %"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[400px] flex items-center justify-center text-gray-400 dark:text-gray-600">
                No equity data available
              </div>
            )}
          </div>

          {/* Performance Metrics */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              Performance Metrics
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Trade Statistics */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-700 dark:text-gray-300 text-sm uppercase tracking-wide">Trade Statistics</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Trades</span>
                    <span className="font-medium text-gray-900 dark:text-white">{selectedBacktest.totalTrades || 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Winning Trades</span>
                    <span className="font-medium text-green-600 dark:text-green-400">{selectedBacktest.winningTrades || 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Losing Trades</span>
                    <span className="font-medium text-red-600 dark:text-red-400">{selectedBacktest.losingTrades || 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Avg Win</span>
                    <span className="font-medium text-green-600 dark:text-green-400">{formatCurrency(selectedBacktest.avgWin || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Avg Loss</span>
                    <span className="font-medium text-red-600 dark:text-red-400">{formatCurrency(selectedBacktest.avgLoss || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Largest Win</span>
                    <span className="font-medium text-green-600 dark:text-green-400">{formatCurrency(selectedBacktest.largestWin || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Largest Loss</span>
                    <span className="font-medium text-red-600 dark:text-red-400">{formatCurrency(selectedBacktest.largestLoss || 0)}</span>
                  </div>
                </div>
              </div>

              {/* Returns */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-700 dark:text-gray-300 text-sm uppercase tracking-wide">Returns</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Return</span>
                    <span className={`font-medium ${selectedBacktest.totalReturn >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {formatPercent(selectedBacktest.totalReturn || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Net Profit</span>
                    <span className={`font-medium ${selectedBacktest.netProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {formatCurrency(selectedBacktest.netProfit || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Gross Profit</span>
                    <span className="font-medium text-green-600 dark:text-green-400">{formatCurrency(selectedBacktest.grossProfit || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Gross Loss</span>
                    <span className="font-medium text-red-600 dark:text-red-400">{formatCurrency(selectedBacktest.grossLoss || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Expectancy</span>
                    <span className={`font-medium ${selectedBacktest.expectancy >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {formatCurrency(selectedBacktest.expectancy || 0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Risk Metrics */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-700 dark:text-gray-300 text-sm uppercase tracking-wide">Risk Metrics</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Win Rate</span>
                    <span className="font-medium text-gray-900 dark:text-white">{selectedBacktest.winRate?.toFixed(2) || '0'}%</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Profit Factor</span>
                    <span className="font-medium text-gray-900 dark:text-white">{selectedBacktest.profitFactor?.toFixed(2) || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Sharpe Ratio</span>
                    <span className="font-medium text-gray-900 dark:text-white">{selectedBacktest.sharpeRatio?.toFixed(2) || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Sortino Ratio</span>
                    <span className="font-medium text-gray-900 dark:text-white">{selectedBacktest.sortinoRatio?.toFixed(2) || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Calmar Ratio</span>
                    <span className="font-medium text-gray-900 dark:text-white">{selectedBacktest.calmarRatio?.toFixed(2) || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Max Drawdown</span>
                    <span className="font-medium text-red-600 dark:text-red-400">{selectedBacktest.maxDrawdown?.toFixed(2) || '0'}%</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Recovery Factor</span>
                    <span className="font-medium text-gray-900 dark:text-white">{selectedBacktest.recoveryFactor?.toFixed(2) || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Monthly Returns Table */}
          {monthlyReturns.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                Monthly Returns
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Month</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">P&L</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Trades</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Win Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyReturns.map((month) => {
                      const winRate = month.trades > 0 ? (month.wins / month.trades) * 100 : 0;
                      return (
                        <tr key={month.month} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="py-3 px-4 text-sm text-gray-900 dark:text-white font-medium">
                            {new Date(month.month + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
                          </td>
                          <td className={`py-3 px-4 text-sm text-right font-medium ${month.pnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {formatCurrency(month.pnl)}
                          </td>
                          <td className="py-3 px-4 text-sm text-right text-gray-600 dark:text-gray-400">
                            {month.trades}
                          </td>
                          <td className={`py-3 px-4 text-sm text-right font-medium ${winRate >= 50 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {winRate.toFixed(1)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Trade List */}
          {selectedBacktest.trades && selectedBacktest.trades.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                Trade List
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">#</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Entry Date</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Exit Date</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Pair</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Type</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Entry</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Exit</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">P&L</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">R-Multiple</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedTrades.map((trade, index) => (
                      <tr key={index} className={`border-b border-gray-100 dark:border-gray-700/50 ${trade.pnl >= 0 ? 'bg-green-50/30 dark:bg-green-900/10' : 'bg-red-50/30 dark:bg-red-900/10'}`}>
                        <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                          {(currentPage - 1) * tradesPerPage + index + 1}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                          {new Date(trade.entryTime).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                          {new Date(trade.exitTime).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">
                          {trade.symbol}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            trade.type === 'BUY' || trade.type === 'LONG'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                          }`}>
                            {trade.type}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-right text-gray-900 dark:text-white">
                          {trade.entryPrice.toFixed(5)}
                        </td>
                        <td className="py-3 px-4 text-sm text-right text-gray-900 dark:text-white">
                          {trade.exitPrice.toFixed(5)}
                        </td>
                        <td className={`py-3 px-4 text-sm text-right font-medium ${trade.pnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {formatCurrency(trade.pnl)}
                        </td>
                        <td className={`py-3 px-4 text-sm text-right font-medium ${trade.rMultiple >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {trade.rMultiple ? (trade.rMultiple >= 0 ? '+' : '') + trade.rMultiple.toFixed(2) + 'R' : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Showing {(currentPage - 1) * tradesPerPage + 1} to {Math.min(currentPage * tradesPerPage, selectedBacktest.trades.length)} of {selectedBacktest.trades.length} trades
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <div className="px-4 py-2 bg-purple-600 text-white rounded-lg">
                      {currentPage} / {totalPages}
                    </div>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Strategy Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">Strategy Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-blue-800 dark:text-blue-300">
              <div>
                <span className="font-medium">Name:</span> {selectedBacktest.name}
              </div>
              <div>
                <span className="font-medium">Symbol:</span> {selectedBacktest.symbol}
              </div>
              <div>
                <span className="font-medium">Timeframe:</span> {selectedBacktest.timeframe}
              </div>
              <div>
                <span className="font-medium">Initial Capital:</span> {formatCurrency(selectedBacktest.initialCapital || 0)}
              </div>
              <div>
                <span className="font-medium">Period:</span> {selectedBacktest.startDate} to {selectedBacktest.endDate}
              </div>
              <div>
                <span className="font-medium">Created:</span> {new Date(selectedBacktest.created_at).toLocaleString()}
              </div>
            </div>
            {selectedBacktest.description && (
              <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
                <span className="font-medium">Description:</span> {selectedBacktest.description}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default BacktestResults;
