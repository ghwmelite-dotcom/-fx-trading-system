import { useState, useEffect } from 'react';
import {
  Upload,
  Database,
  Trash2,
  Download,
  AlertCircle,
  CheckCircle,
  Clock,
  Globe,
  Key,
  Calendar,
  TrendingUp,
  RefreshCw,
  Info
} from 'lucide-react';

const DataManager = ({ apiUrl, authToken }) => {
  // Tab state
  const [activeTab, setActiveTab] = useState('upload'); // 'upload', 'fetch', 'datasets'

  // Upload state
  const [datasets, setDatasets] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [symbol, setSymbol] = useState('EURUSD');
  const [timeframe, setTimeframe] = useState('1h');

  // Fetch data state
  const [fetching, setFetching] = useState(false);
  const [fetchProgress, setFetchProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [previewData, setPreviewData] = useState(null);
  const [selectedSources, setSelectedSources] = useState(['yahoo']);
  const [fetchSymbol, setFetchSymbol] = useState('EURUSD');
  const [fetchTimeframe, setFetchTimeframe] = useState('1H');
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [apiKeys, setApiKeys] = useState({ alphavantage: '', twelvedata: '' });
  const [showApiKeys, setShowApiKeys] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [fillGaps, setFillGaps] = useState(true);
  const [validateData, setValidateData] = useState(true);
  const [mergeStrategy, setMergeStrategy] = useState('prefer-newest');
  const [sourceStatus, setSourceStatus] = useState(null);

  // Major forex pairs
  const majorPairs = [
    'EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD', 'USDCAD', 'NZDUSD',
    'EURGBP', 'EURJPY', 'GBPJPY', 'AUDJPY', 'EURAUD', 'EURCHF', 'AUDCAD'
  ];

  useEffect(() => {
    loadDatasets();
    loadSourceStatus();
  }, []);

  const loadDatasets = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!authToken) {
        setError('Please log in to access backtesting features');
        setLoading(false);
        return;
      }

      const response = await fetch(`${apiUrl}/api/backtest/data/datasets`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 401) {
          throw new Error('Authentication required. Please log in.');
        }
        throw new Error(errorData.error || 'Failed to load datasets');
      }

      const data = await response.json();
      setDatasets(data.datasets || []);
    } catch (err) {
      setError(err.message || 'Failed to load historical data');
    } finally {
      setLoading(false);
    }
  };

  const loadSourceStatus = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/backtest/data/sources/status`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      if (response.ok) {
        const data = await response.json();
        setSourceStatus(data);
      }
    } catch (err) {
      console.error('Failed to load source status:', err);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.name.endsWith('.csv')) {
        setError('Please select a CSV file');
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!selectedFile) {
      setError('Please select a file');
      return;
    }

    if (!symbol || !timeframe) {
      setError('Please enter symbol and timeframe');
      return;
    }

    setUploading(true);
    setUploadProgress({ status: 'uploading', message: 'Uploading file...' });
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('symbol', symbol.toUpperCase());
      formData.append('timeframe', timeframe);

      const response = await fetch(`${apiUrl}/api/backtest/data/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}` },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();

      setUploadProgress({
        status: 'success',
        message: `Successfully uploaded ${result.inserted} bars`
      });

      setSuccess(`Uploaded ${result.inserted} bars for ${symbol} (${timeframe})`);
      setSelectedFile(null);
      document.getElementById('file-input').value = '';

      setTimeout(() => {
        loadDatasets();
        setUploadProgress(null);
      }, 2000);
    } catch (err) {
      setError('Upload failed: ' + err.message);
      setUploadProgress({ status: 'error', message: err.message });
    } finally {
      setUploading(false);
    }
  };

  const handleFetchData = async (e) => {
    e.preventDefault();

    if (selectedSources.length === 0) {
      setError('Please select at least one data source');
      return;
    }

    // Check if API keys are needed
    const needsAlphaVantage = selectedSources.includes('alphavantage');
    const needsTwelveData = selectedSources.includes('twelvedata');

    if (needsAlphaVantage && !apiKeys.alphavantage) {
      setError('Alpha Vantage API key is required');
      return;
    }

    if (needsTwelveData && !apiKeys.twelvedata) {
      setError('Twelve Data API key is required');
      return;
    }

    setFetching(true);
    setFetchProgress(0);
    setCurrentStep('Fetching data from sources...');
    setError(null);
    setSuccess(null);
    setPreviewData(null);

    try {
      const response = await fetch(`${apiUrl}/api/backtest/data/fetch`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sources: selectedSources,
          symbol: fetchSymbol,
          timeframe: fetchTimeframe,
          startDate: startDate + 'T00:00:00Z',
          endDate: endDate + 'T23:59:59Z',
          apiKeys: {
            alphavantage: apiKeys.alphavantage || undefined,
            twelvedata: apiKeys.twelvedata || undefined
          },
          mergeStrategy,
          fillGaps,
          validateData
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Data fetch failed');
      }

      const result = await response.json();

      setFetchProgress(100);
      setCurrentStep('Complete!');
      setSuccess(result.message);

      // Load updated datasets
      setTimeout(() => {
        loadDatasets();
        setFetching(false);
        setFetchProgress(0);
        setCurrentStep('');
      }, 2000);
    } catch (err) {
      setError('Fetch failed: ' + err.message);
      setFetching(false);
      setFetchProgress(0);
      setCurrentStep('');
    }
  };

  const handleDelete = async (datasetId) => {
    if (!confirm('Delete this dataset? This cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/api/backtest/data/datasets/${datasetId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      if (!response.ok) throw new Error('Failed to delete dataset');

      setSuccess('Dataset deleted successfully');
      loadDatasets();
    } catch (err) {
      setError('Delete failed: ' + err.message);
    }
  };

  const handleSourceToggle = (source) => {
    if (selectedSources.includes(source)) {
      setSelectedSources(selectedSources.filter(s => s !== source));
    } else {
      setSelectedSources([...selectedSources, source]);
    }
  };

  const setDateRange = (months) => {
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - months);
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatNumber = (num) => {
    return num?.toLocaleString() || '0';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Historical Data</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Upload CSV files or fetch data from free APIs
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

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('upload')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'upload'
                ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Upload className="w-4 h-4 inline mr-2" />
            Upload CSV
          </button>
          <button
            onClick={() => setActiveTab('fetch')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'fetch'
                ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Globe className="w-4 h-4 inline mr-2" />
            Fetch from API
          </button>
          <button
            onClick={() => setActiveTab('datasets')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'datasets'
                ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Database className="w-4 h-4 inline mr-2" />
            My Datasets ({datasets.length})
          </button>
        </nav>
      </div>

      {/* Upload Tab */}
      {activeTab === 'upload' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload CSV File
          </h3>

          <form onSubmit={handleUpload} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Symbol
                </label>
                <input
                  type="text"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  placeholder="EURUSD"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Timeframe
                </label>
                <select
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                >
                  <option value="1m">1 Minute</option>
                  <option value="5m">5 Minutes</option>
                  <option value="15m">15 Minutes</option>
                  <option value="30m">30 Minutes</option>
                  <option value="1h">1 Hour</option>
                  <option value="4h">4 Hours</option>
                  <option value="1d">1 Day</option>
                  <option value="1w">1 Week</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                CSV File
              </label>
              <div className="flex items-center gap-4">
                <label className="flex-1 flex items-center justify-center px-4 py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-purple-500 dark:hover:border-purple-400 transition-colors bg-gray-50 dark:bg-gray-700/50">
                  <div className="text-center">
                    <Database className="w-8 h-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedFile ? selectedFile.name : 'Click to select CSV file'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      Format: timestamp, open, high, low, close, volume (optional)
                    </p>
                  </div>
                  <input
                    id="file-input"
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {uploadProgress && (
              <div className={`p-4 rounded-lg flex items-center gap-3 ${
                uploadProgress.status === 'uploading' ? 'bg-blue-50 dark:bg-blue-900/20' :
                uploadProgress.status === 'success' ? 'bg-green-50 dark:bg-green-900/20' :
                'bg-red-50 dark:bg-red-900/20'
              }`}>
                {uploadProgress.status === 'uploading' && <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin" />}
                {uploadProgress.status === 'success' && <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />}
                {uploadProgress.status === 'error' && <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />}
                <p className={`text-sm ${
                  uploadProgress.status === 'uploading' ? 'text-blue-800 dark:text-blue-200' :
                  uploadProgress.status === 'success' ? 'text-green-800 dark:text-green-200' :
                  'text-red-800 dark:text-red-200'
                }`}>
                  {uploadProgress.message}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={uploading || !selectedFile}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4" />
              {uploading ? 'Uploading...' : 'Upload Data'}
            </button>
          </form>
        </div>
      )}

      {/* Fetch from API Tab */}
      {activeTab === 'fetch' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Fetch Historical Data from API
          </h3>

          <form onSubmit={handleFetchData} className="space-y-6">
            {/* Data Sources */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Data Sources (try in order)
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedSources.includes('yahoo')}
                    onChange={() => handleSourceToggle('yahoo')}
                    className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">Yahoo Finance</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Free, unlimited, no API key required</div>
                  </div>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </label>

                <label className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedSources.includes('alphavantage')}
                    onChange={() => handleSourceToggle('alphavantage')}
                    className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">Alpha Vantage</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">25 calls/day free (requires API key)</div>
                  </div>
                  <Key className="w-5 h-5 text-yellow-500" />
                </label>

                <label className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedSources.includes('twelvedata')}
                    onChange={() => handleSourceToggle('twelvedata')}
                    className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">Twelve Data</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">800 calls/day free (requires API key)</div>
                  </div>
                  <Key className="w-5 h-5 text-yellow-500" />
                </label>
              </div>
            </div>

            {/* Symbol Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Currency Pair
              </label>
              <div className="flex gap-2">
                <select
                  value={fetchSymbol}
                  onChange={(e) => setFetchSymbol(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                >
                  {majorPairs.map(pair => (
                    <option key={pair} value={pair}>{pair}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={fetchSymbol}
                  onChange={(e) => setFetchSymbol(e.target.value.toUpperCase())}
                  placeholder="or enter custom"
                  className="w-40 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Timeframe */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Timeframe
              </label>
              <select
                value={fetchTimeframe}
                onChange={(e) => setFetchTimeframe(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
              >
                <option value="1M">1 Minute</option>
                <option value="5M">5 Minutes</option>
                <option value="15M">15 Minutes</option>
                <option value="30M">30 Minutes</option>
                <option value="1H">1 Hour</option>
                <option value="4H">4 Hours</option>
                <option value="1D">Daily</option>
                <option value="1W">Weekly</option>
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date Range
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setDateRange(1)}
                  className="px-3 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                >
                  Last 1 Month
                </button>
                <button
                  type="button"
                  onClick={() => setDateRange(3)}
                  className="px-3 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                >
                  Last 3 Months
                </button>
                <button
                  type="button"
                  onClick={() => setDateRange(6)}
                  className="px-3 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                >
                  Last 6 Months
                </button>
                <button
                  type="button"
                  onClick={() => setDateRange(12)}
                  className="px-3 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                >
                  Last 1 Year
                </button>
              </div>
            </div>

            {/* API Keys */}
            <details open={showApiKeys}>
              <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <Key className="w-4 h-4" />
                API Keys (optional)
              </summary>
              <div className="mt-3 space-y-3 pl-6">
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Alpha Vantage API Key
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={apiKeys.alphavantage}
                      onChange={(e) => setApiKeys({ ...apiKeys, alphavantage: e.target.value })}
                      placeholder="Enter your API key"
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <a
                      href="https://www.alphavantage.co/support/#api-key"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg whitespace-nowrap"
                    >
                      Get Free Key
                    </a>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Twelve Data API Key
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={apiKeys.twelvedata}
                      onChange={(e) => setApiKeys({ ...apiKeys, twelvedata: e.target.value })}
                      placeholder="Enter your API key"
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <a
                      href="https://twelvedata.com/pricing"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg whitespace-nowrap"
                    >
                      Get Free Key
                    </a>
                  </div>
                </div>
              </div>
            </details>

            {/* Advanced Options */}
            <details>
              <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Advanced Options
              </summary>
              <div className="mt-3 space-y-3 pl-6">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={fillGaps}
                    onChange={(e) => setFillGaps(e.target.checked)}
                    className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Fill data gaps automatically
                  </span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={validateData}
                    onChange={(e) => setValidateData(e.target.checked)}
                    className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Validate data quality
                  </span>
                </label>

                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Merge Strategy
                  </label>
                  <select
                    value={mergeStrategy}
                    onChange={(e) => setMergeStrategy(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="prefer-newest">Prefer newest data</option>
                    <option value="prefer-complete">Prefer most complete</option>
                    <option value="first-available">First available</option>
                  </select>
                </div>
              </div>
            </details>

            {/* Progress */}
            {fetching && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <RefreshCw className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin" />
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    {currentStep}
                  </span>
                </div>
                <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                  <div
                    className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${fetchProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Fetch Button */}
            <button
              type="submit"
              disabled={fetching || selectedSources.length === 0}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <TrendingUp className="w-5 h-5" />
              {fetching ? 'Fetching... (this may take a few minutes)' : 'Fetch Historical Data'}
            </button>
          </form>
        </div>
      )}

      {/* Datasets Tab */}
      {activeTab === 'datasets' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Database className="w-5 h-5" />
            My Datasets
          </h3>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Loading datasets...</p>
            </div>
          ) : datasets.length === 0 ? (
            <div className="text-center py-8">
              <Database className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400">No datasets yet</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                Upload CSV files or fetch data from APIs to get started
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Dataset</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Symbol</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Timeframe</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Candles</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Date Range</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Source</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {datasets.map((dataset) => (
                    <tr key={dataset.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {dataset.name}
                        </div>
                        {dataset.gaps_filled > 0 && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {dataset.gaps_filled} gaps filled
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {dataset.symbol}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {dataset.timeframe}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-900 dark:text-white">
                          {formatNumber(dataset.total_candles)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {formatDate(dataset.start_date)} - {formatDate(dataset.end_date)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                          {dataset.data_source}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDelete(dataset.id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors"
                          title="Delete dataset"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Help Section */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2 flex items-center gap-2">
          <Info className="w-4 h-4" />
          Data Source Information
        </h4>
        <div className="text-sm text-blue-800 dark:text-blue-300 space-y-2">
          <div>
            <strong>Yahoo Finance:</strong> Free, unlimited access. No API key required. Best for daily and higher timeframes.
          </div>
          <div>
            <strong>Alpha Vantage:</strong> Free tier includes 25 calls/day, 500 calls/month. Supports intraday data (1min, 5min, 15min, 30min, 60min).
            <a href="https://www.alphavantage.co/support/#api-key" target="_blank" rel="noopener noreferrer" className="ml-1 underline">
              Get free API key
            </a>
          </div>
          <div>
            <strong>Twelve Data:</strong> Free tier includes 800 calls/day. Excellent forex coverage with multiple timeframes.
            <a href="https://twelvedata.com/pricing" target="_blank" rel="noopener noreferrer" className="ml-1 underline">
              Get free API key
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataManager;
