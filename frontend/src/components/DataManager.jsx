import { useState, useEffect } from 'react';
import { Upload, Database, Trash2, Download, AlertCircle, CheckCircle, Clock } from 'lucide-react';

const DataManager = ({ apiUrl, authToken }) => {
  const [datasets, setDatasets] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Upload form state
  const [selectedFile, setSelectedFile] = useState(null);
  const [symbol, setSymbol] = useState('EURUSD');
  const [timeframe, setTimeframe] = useState('1h');

  useEffect(() => {
    loadDatasets();
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

      const response = await fetch(`${apiUrl}/api/backtest/data`, {
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
      setDatasets(data.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load historical data');
    } finally {
      setLoading(false);
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

      // Reload datasets
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

  const handleDelete = async (symbol, timeframe) => {
    if (!confirm(`Delete all ${symbol} ${timeframe} data? This cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/api/backtest/data/${encodeURIComponent(symbol)}/${encodeURIComponent(timeframe)}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      if (!response.ok) throw new Error('Failed to delete dataset');

      setSuccess(`Deleted ${symbol} ${timeframe} data`);
      loadDatasets();
    } catch (err) {
      setError('Delete failed: ' + err.message);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatNumber = (num) => {
    return num.toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Historical Data</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage historical price data for backtesting
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

      {/* Upload Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Upload Historical Data
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

      {/* Datasets List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Database className="w-5 h-5" />
          Available Datasets
        </h3>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Loading datasets...</p>
          </div>
        ) : datasets.length === 0 ? (
          <div className="text-center py-8">
            <Database className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400">No historical data uploaded yet</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
              Upload CSV files to get started with backtesting
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Symbol</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Timeframe</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Bars</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Date Range</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Source</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {datasets.map((dataset, index) => (
                  <tr key={index} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50">
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
                        {formatNumber(dataset.total_bars)}
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
                        onClick={() => handleDelete(dataset.symbol, dataset.timeframe)}
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

      {/* Help Section */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">CSV Format Guidelines</h4>
        <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1 list-disc list-inside">
          <li>Required columns: timestamp, open, high, low, close</li>
          <li>Optional columns: volume, spread</li>
          <li>Timestamp format: YYYY-MM-DD HH:MM:SS or any standard format</li>
          <li>Prices should be in decimal format (e.g., 1.0950)</li>
          <li>Download sample data from TradingView, MetaTrader, or other platforms</li>
        </ul>
      </div>
    </div>
  );
};

export default DataManager;
