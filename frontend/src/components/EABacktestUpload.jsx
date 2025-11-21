import { useState, useEffect } from 'react';
import {
  Upload,
  FileText,
  Trash2,
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Loader,
  BarChart3,
  Calendar,
  Target,
  Award
} from 'lucide-react';

const EABacktestUpload = ({ apiUrl, authToken }) => {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' or 'results'
  const [selectedFile, setSelectedFile] = useState(null);
  const [eaName, setEaName] = useState('');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/backtest/report/list`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      if (response.ok) {
        const data = await response.json();
        setReports(data.reports || []);
      }
    } catch (err) {
      console.error('Failed to load reports:', err);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.name.toLowerCase().endsWith('.htm') && !file.name.toLowerCase().endsWith('.html')) {
        setError('Please select an HTML file (.htm or .html)');
        return;
      }
      setSelectedFile(file);
      setError(null);

      // Auto-extract EA name from filename
      const name = file.name.replace(/\.(htm|html)$/i, '').replace(/_/g, ' ');
      if (!eaName) {
        setEaName(name);
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file');
      return;
    }

    if (!eaName.trim()) {
      setError('Please enter an EA name');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('ea_name', eaName.trim());
      formData.append('description', description.trim());

      const response = await fetch(`${apiUrl}/api/backtest/report/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`Report uploaded successfully! ${data.trades_count} trades parsed.`);
        setSelectedFile(null);
        setEaName('');
        setDescription('');
        loadReports();

        // Switch to results tab after 2 seconds
        setTimeout(() => {
          setActiveTab('results');
          setSuccess(null);
        }, 2000);
      } else {
        setError(data.error || 'Upload failed');
      }
    } catch (err) {
      setError('Failed to upload report: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (reportId) => {
    if (!confirm('Are you sure you want to delete this backtest report?')) {
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/api/backtest/report/${reportId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      if (response.ok) {
        loadReports();
        if (selectedReport?.id === reportId) {
          setSelectedReport(null);
        }
      }
    } catch (err) {
      console.error('Failed to delete report:', err);
    }
  };

  const viewReport = async (reportId) => {
    try {
      const response = await fetch(`${apiUrl}/api/backtest/report/${reportId}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedReport(data.report);
      }
    } catch (err) {
      console.error('Failed to load report:', err);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value || 0);
  };

  const formatPercent = (value) => {
    return `${(value || 0).toFixed(2)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="text-purple-400" size={28} />
            EA Backtest Reports
          </h2>
          <p className="text-slate-400 mt-1">Upload MT5 Strategy Tester reports for analysis</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-700">
        <button
          onClick={() => setActiveTab('upload')}
          className={`px-4 py-2 font-medium transition-all ${
            activeTab === 'upload'
              ? 'text-purple-400 border-b-2 border-purple-400'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Upload className="inline mr-2" size={18} />
          Upload Report
        </button>
        <button
          onClick={() => setActiveTab('results')}
          className={`px-4 py-2 font-medium transition-all ${
            activeTab === 'results'
              ? 'text-purple-400 border-b-2 border-purple-400'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="inline mr-2" size={18} />
          My Reports ({reports.length})
        </button>
      </div>

      {/* Upload Tab */}
      {activeTab === 'upload' && (
        <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
          {/* Instructions */}
          <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <h3 className="text-white font-medium mb-2 flex items-center gap-2">
              <Activity size={18} className="text-blue-400" />
              How to Upload
            </h3>
            <ol className="text-slate-300 text-sm space-y-1 list-decimal list-inside">
              <li>Run your EA in MT5 Strategy Tester</li>
              <li>Right-click on a result → "Save as Report"</li>
              <li>Save as HTML file</li>
              <li>Upload the .htm file here</li>
            </ol>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-300">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-2 text-green-300">
              <CheckCircle size={18} />
              {success}
            </div>
          )}

          {/* Upload Form */}
          <div className="space-y-4">
            {/* File Input */}
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                MT5 Report File *
              </label>
              <input
                type="file"
                accept=".htm,.html"
                onChange={handleFileSelect}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-purple-600 file:text-white hover:file:bg-purple-700 cursor-pointer"
              />
              {selectedFile && (
                <p className="mt-2 text-sm text-slate-400 flex items-center gap-2">
                  <FileText size={16} className="text-purple-400" />
                  {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>

            {/* EA Name */}
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                EA Name *
              </label>
              <input
                type="text"
                value={eaName}
                onChange={(e) => setEaName(e.target.value)}
                placeholder="e.g., My Trading Bot v1.0"
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add notes about this backtest..."
                rows={3}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Upload Button */}
            <button
              onClick={handleUpload}
              disabled={uploading || !selectedFile}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-slate-700 disabled:to-slate-800 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all duration-200 shadow-lg flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader className="animate-spin" size={20} />
                  <span>Uploading & Parsing...</span>
                </>
              ) : (
                <>
                  <Upload size={20} />
                  <span>Upload Report</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Results Tab */}
      {activeTab === 'results' && (
        <div className="space-y-4">
          {reports.length === 0 ? (
            <div className="bg-slate-800/50 rounded-lg p-12 border border-slate-700 text-center">
              <FileText className="mx-auto text-slate-600 mb-4" size={48} />
              <p className="text-slate-400 mb-2">No backtest reports yet</p>
              <p className="text-slate-500 text-sm">Upload your first MT5 report to get started</p>
              <button
                onClick={() => setActiveTab('upload')}
                className="mt-4 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium"
              >
                Upload Report
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 hover:border-purple-500/50 transition-all cursor-pointer group"
                  onClick={() => viewReport(report.id)}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-white font-medium group-hover:text-purple-400 transition-colors">
                        {report.ea_name}
                      </h3>
                      <p className="text-slate-500 text-xs mt-1">
                        {new Date(report.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(report.id);
                      }}
                      className="p-2 hover:bg-red-500/10 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* Metrics */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Symbol</span>
                      <span className="text-white font-medium">{report.symbol}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Net Profit</span>
                      <span className={`font-medium ${report.total_net_profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {formatCurrency(report.total_net_profit)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Profit Factor</span>
                      <span className="text-white font-medium">{(report.profit_factor || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Win Rate</span>
                      <span className="text-white font-medium">{formatPercent(report.win_rate)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Total Trades</span>
                      <span className="text-white font-medium">{report.total_trades}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Report Details Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
onClick={() => setSelectedReport(null)}>
          <div className="bg-slate-900 rounded-lg border border-slate-700 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-700 flex items-center justify-between sticky top-0 bg-slate-900 z-10">
              <div>
                <h3 className="text-xl font-bold text-white">{selectedReport.ea_name}</h3>
                <p className="text-slate-400 text-sm mt-1">
                  {selectedReport.symbol} • {selectedReport.period} • {selectedReport.model}
                </p>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard
                  icon={DollarSign}
                  label="Net Profit"
                  value={formatCurrency(selectedReport.total_net_profit)}
                  color={selectedReport.total_net_profit >= 0 ? 'green' : 'red'}
                />
                <MetricCard
                  icon={Target}
                  label="Profit Factor"
                  value={(selectedReport.profit_factor || 0).toFixed(2)}
                  color="purple"
                />
                <MetricCard
                  icon={Award}
                  label="Win Rate"
                  value={formatPercent(selectedReport.win_rate)}
                  color="blue"
                />
                <MetricCard
                  icon={TrendingDown}
                  label="Max Drawdown"
                  value={formatPercent(selectedReport.max_drawdown_percent)}
                  color="orange"
                />
              </div>

              {/* Detailed Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DetailSection title="Trade Statistics">
                  <DetailRow label="Total Trades" value={selectedReport.total_trades} />
                  <DetailRow label="Winning Trades" value={`${selectedReport.profit_trades} (${formatPercent(selectedReport.win_rate)})`} />
                  <DetailRow label="Losing Trades" value={`${selectedReport.loss_trades} (${formatPercent(selectedReport.loss_rate)})`} />
                  <DetailRow label="Long Positions" value={selectedReport.long_positions} />
                  <DetailRow label="Short Positions" value={selectedReport.short_positions} />
                </DetailSection>

                <DetailSection title="Performance">
                  <DetailRow label="ROI" value={formatPercent(selectedReport.roi)} />
                  <DetailRow label="Initial Deposit" value={formatCurrency(selectedReport.initial_deposit)} />
                  <DetailRow label="Final Balance" value={formatCurrency(selectedReport.balance)} />
                  <DetailRow label="Gross Profit" value={formatCurrency(selectedReport.gross_profit)} />
                  <DetailRow label="Gross Loss" value={formatCurrency(selectedReport.gross_loss)} />
                </DetailSection>

                <DetailSection title="Trade Extremes">
                  <DetailRow label="Largest Win" value={formatCurrency(selectedReport.largest_profit_trade)} />
                  <DetailRow label="Largest Loss" value={formatCurrency(selectedReport.largest_loss_trade)} />
                  <DetailRow label="Average Win" value={formatCurrency(selectedReport.average_profit_trade)} />
                  <DetailRow label="Average Loss" value={formatCurrency(selectedReport.average_loss_trade)} />
                </DetailSection>

                <DetailSection title="Risk Metrics">
                  <DetailRow label="Max Drawdown" value={formatCurrency(selectedReport.max_drawdown)} />
                  <DetailRow label="Max DD %" value={formatPercent(selectedReport.max_drawdown_percent)} />
                  <DetailRow label="Recovery Factor" value={(selectedReport.recovery_factor || 0).toFixed(2)} />
                  <DetailRow label="Sharpe Ratio" value={(selectedReport.sharpe_ratio || 0).toFixed(2)} />
                </DetailSection>
              </div>

              {selectedReport.description && (
                <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                  <h4 className="text-white font-medium mb-2">Notes</h4>
                  <p className="text-slate-300 text-sm whitespace-pre-wrap">{selectedReport.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper Components
const MetricCard = ({ icon: Icon, label, value, color }) => {
  const colors = {
    green: 'text-green-400 bg-green-500/10 border-green-500/30',
    red: 'text-red-400 bg-red-500/10 border-red-500/30',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
    orange: 'text-orange-400 bg-orange-500/10 border-orange-500/30'
  };

  return (
    <div className={`p-4 rounded-lg border ${colors[color]}`}>
      <Icon size={20} className="mb-2" />
      <p className="text-slate-400 text-xs mb-1">{label}</p>
      <p className="text-white font-bold text-lg">{value}</p>
    </div>
  );
};

const DetailSection = ({ title, children }) => (
  <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
    <h4 className="text-white font-medium mb-3">{title}</h4>
    <div className="space-y-2">
      {children}
    </div>
  </div>
);

const DetailRow = ({ label, value }) => (
  <div className="flex items-center justify-between text-sm">
    <span className="text-slate-400">{label}</span>
    <span className="text-white font-medium">{value}</span>
  </div>
);

export default EABacktestUpload;
