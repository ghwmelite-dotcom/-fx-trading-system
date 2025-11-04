import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Upload, TrendingUp, TrendingDown, DollarSign, Activity, BarChart3, Calendar, Plus, Download, Settings, Wifi, WifiOff, X, Check, AlertCircle, Zap, Target } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import * as XLSX from 'xlsx';

const COLORS = ['#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

const FXTradingDashboard = () => {
  const [trades, setTrades] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState('all');
  const [showUpload, setShowUpload] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [notification, setNotification] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);

  // API Configuration
  const [apiUrl, setApiUrl] = useState('');
  const [apiKey, setApiKey] = useState('');

  // Load config and data on mount
  useEffect(() => {
    const savedUrl = localStorage.getItem('fx_api_url') || '';
    const savedKey = localStorage.getItem('fx_api_key') || '';
    setApiUrl(savedUrl);
    setApiKey(savedKey);
    
    if (savedUrl && savedKey) {
      loadDataFromAPI(savedUrl, savedKey);
    } else {
      setIsLoading(false);
    }
  }, []);

  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  // API helper function
  const apiCall = async (endpoint, method = 'GET', body = null) => {
    if (!apiUrl || !apiKey) {
      throw new Error('API not configured');
    }

    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey
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
  const loadDataFromAPI = async (url, key) => {
    try {
      setIsLoading(true);
      const [tradesData, accountsData] = await Promise.all([
        fetch(`${url}/api/trades`, {
          headers: { 'X-API-Key': key }
        }).then(r => r.json()),
        fetch(`${url}/api/accounts`, {
          headers: { 'X-API-Key': key }
        }).then(r => r.json())
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
        account: t.account_id
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

  // Calculate comprehensive analytics
  const analytics = useMemo(() => {
    const filteredTrades = selectedAccount === 'all' 
      ? trades 
      : trades.filter(t => t.account === parseInt(selectedAccount));

    const totalPnL = filteredTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const winningTrades = filteredTrades.filter(t => (t.pnl || 0) > 0);
    const losingTrades = filteredTrades.filter(t => (t.pnl || 0) < 0);
    const winRate = filteredTrades.length > 0 
      ? (winningTrades.length / filteredTrades.length * 100).toFixed(1)
      : 0;

    const totalBalance = selectedAccount === 'all'
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
      totalTrades: filteredTrades.length
    };
  }, [trades, selectedAccount, accounts]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
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
        await loadDataFromAPI(apiUrl, apiKey);
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
      if (isOnline) {
        await apiCall('/api/trades', 'POST', newTrade);
        await loadDataFromAPI(apiUrl, apiKey);
      } else {
        setTrades([...trades, { ...newTrade, id: trades.length + 1, account: newTrade.accountId }]);
      }

      setShowManualEntry(false);
      showNotification('Trade added successfully', 'success');
      
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

  const handleExport = () => {
    const exportData = trades.map(t => ({
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
  };

  const saveApiConfig = () => {
    localStorage.setItem('fx_api_url', apiUrl);
    localStorage.setItem('fx_api_key', apiKey);
    setShowSettings(false);
    if (apiUrl && apiKey) {
      loadDataFromAPI(apiUrl, apiKey);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading your trading data...</div>
      </div>
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

      <div className="relative w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-6">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-4 mb-3 flex-wrap">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                FX Trading Analytics
              </h1>
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
          <button
            onClick={() => setShowSettings(true)}
            className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/20"
          >
            <Settings className="text-slate-300" size={24} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 p-1 bg-slate-800/50 rounded-xl border border-slate-700/50 backdrop-blur-sm w-full max-w-2xl">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 px-4 sm:px-6 py-3 rounded-lg font-bold transition-all duration-200 ${
              activeTab === 'overview'
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                : 'text-slate-100 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex-1 px-4 sm:px-6 py-3 rounded-lg font-bold transition-all duration-200 ${
              activeTab === 'analytics'
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                : 'text-slate-100 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('trades')}
            className={`flex-1 px-4 sm:px-6 py-3 rounded-lg font-bold transition-all duration-200 ${
              activeTab === 'trades'
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                : 'text-slate-100 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            All Trades
          </button>
        </div>

        {/* Action Bar - FIXED: Better responsive text and spacing */}
<div className="flex flex-wrap gap-3 mb-8">
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
                      </tr>
                    </thead>
                    <tbody>
                      {trades.slice(-10).reverse().map(trade => (
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
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Top Performing Pairs */}
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <div className="flex items-center gap-3 mb-6">
                <BarChart3 className="text-purple-400" size={24} />
                <h2 className="text-xl font-bold text-white">Currency Pair Analysis</h2>
              </div>
              <div className="space-y-4">
                {analytics.topPairs.map(([pair, data], index) => (
                  <div key={pair} className="p-4 bg-white/5 rounded-xl border border-white/10 hover:border-purple-500/30 transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${
                          data.pnl >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          #{index + 1}
                        </div>
                        <div>
                          <div className="text-white font-bold text-lg">{pair}</div>
                          <div className="text-slate-400 text-sm">{data.count} trades</div>
                        </div>
                      </div>
                      <div className={`text-right`}>
                        <div className={`text-2xl font-bold ${data.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {data.pnl >= 0 ? '+' : ''}${data.pnl.toFixed(2)}
                        </div>
                        <div className="text-slate-400 text-sm">
                          {data.wins}W / {data.losses}L
                        </div>
                      </div>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${data.pnl >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                        style={{ width: `${(data.wins / data.count) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Daily P&L Bar Chart */}
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <div className="flex items-center gap-3 mb-6">
                <BarChart3 className="text-blue-400" size={24} />
                <h2 className="text-xl font-bold text-white">Daily Performance</h2>
              </div>
              {analytics.chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={analytics.chartData}>
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
                    <Bar dataKey="pnl" fill="#8b5cf6" radius={[8, 8, 0, 0]}>
                      {analytics.chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#10b981' : '#ef4444'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[400px] flex items-center justify-center text-slate-400">
                  No trade data available
                </div>
              )}
            </div>
          </div>
        )}

        {/* All Trades Tab */}
        {activeTab === 'trades' && (
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
                    </tr>
                  </thead>
                  <tbody>
                    {trades.slice().reverse().map(trade => (
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
            <div className="bg-slate-900 rounded-2xl p-8 max-w-md w-full border border-white/10 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">Add New Trade</h3>
                <button onClick={() => setShowManualEntry(false)} className="text-slate-400 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>
              <div className="space-y-4">
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
                  onClick={handleManualSubmit}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl transition-all font-medium shadow-lg"
                >
                  Add Trade
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FXTradingDashboard;