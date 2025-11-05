import React, { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, RefreshCw, Info, Copy, Check } from 'lucide-react';

/**
 * Correlation Matrix
 * Shows correlation coefficients between currency pairs
 * Helps identify hedging opportunities and correlated risk
 */
const CorrelationMatrix = ({ trades = [], theme = 'dark' }) => {
  const [timeframe, setTimeframe] = useState('30d'); // 7d, 30d, 90d, all
  const [copied, setCopied] = useState(false);

  // Major currency pairs for correlation analysis
  const majorPairs = [
    'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF',
    'AUD/USD', 'USD/CAD', 'NZD/USD', 'EUR/GBP'
  ];

  // Calculate correlations
  const correlations = useMemo(() => {
    // Filter trades by timeframe
    const now = new Date();
    const cutoffDate = new Date();

    if (timeframe === '7d') cutoffDate.setDate(now.getDate() - 7);
    else if (timeframe === '30d') cutoffDate.setDate(now.getDate() - 30);
    else if (timeframe === '90d') cutoffDate.setDate(now.getDate() - 90);
    else cutoffDate.setFullYear(2000); // All time

    const filteredTrades = trades.filter(t => new Date(t.date) >= cutoffDate);

    // Group trades by pair and date
    const pairData = {};
    majorPairs.forEach(pair => {
      pairData[pair] = {};
    });

    filteredTrades.forEach(trade => {
      if (majorPairs.includes(trade.pair)) {
        const date = trade.date;
        if (!pairData[trade.pair][date]) {
          pairData[trade.pair][date] = [];
        }
        pairData[trade.pair][date].push(trade.pnl || 0);
      }
    });

    // Calculate average daily P&L for each pair
    const dailyReturns = {};
    majorPairs.forEach(pair => {
      dailyReturns[pair] = [];
      Object.keys(pairData[pair]).forEach(date => {
        const avgPnl = pairData[pair][date].reduce((sum, pnl) => sum + pnl, 0) / pairData[pair][date].length;
        dailyReturns[pair].push(avgPnl);
      });
    });

    // Calculate correlation matrix
    const matrix = {};
    majorPairs.forEach(pair1 => {
      matrix[pair1] = {};
      majorPairs.forEach(pair2 => {
        if (pair1 === pair2) {
          matrix[pair1][pair2] = 1.0;
        } else {
          const corr = calculateCorrelation(dailyReturns[pair1], dailyReturns[pair2]);
          matrix[pair1][pair2] = corr;
        }
      });
    });

    return matrix;
  }, [trades, timeframe]);

  // Calculate Pearson correlation coefficient
  const calculateCorrelation = (x, y) => {
    if (x.length === 0 || y.length === 0 || x.length !== y.length) return 0;

    const n = Math.min(x.length, y.length);
    if (n < 2) return 0;

    const sumX = x.slice(0, n).reduce((sum, val) => sum + val, 0);
    const sumY = y.slice(0, n).reduce((sum, val) => sum + val, 0);
    const sumXY = x.slice(0, n).reduce((sum, val, i) => sum + val * y[i], 0);
    const sumX2 = x.slice(0, n).reduce((sum, val) => sum + val * val, 0);
    const sumY2 = y.slice(0, n).reduce((sum, val) => sum + val * val, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    if (denominator === 0) return 0;
    return numerator / denominator;
  };

  // Get color for correlation value
  const getCorrelationColor = (value) => {
    if (value === null || isNaN(value)) return 'bg-slate-700 text-slate-400';

    const abs = Math.abs(value);
    if (abs >= 0.8) return value > 0 ? 'bg-green-600 text-white' : 'bg-red-600 text-white';
    if (abs >= 0.6) return value > 0 ? 'bg-green-500 text-white' : 'bg-red-500 text-white';
    if (abs >= 0.4) return value > 0 ? 'bg-green-400 text-white' : 'bg-red-400 text-white';
    if (abs >= 0.2) return value > 0 ? 'bg-blue-400 text-white' : 'bg-orange-400 text-white';
    return 'bg-slate-600 text-slate-300';
  };

  // Get interpretation
  const getInterpretation = (value) => {
    if (value === null || isNaN(value)) return 'No data';
    const abs = Math.abs(value);
    if (abs >= 0.8) return 'Very Strong';
    if (abs >= 0.6) return 'Strong';
    if (abs >= 0.4) return 'Moderate';
    if (abs >= 0.2) return 'Weak';
    return 'Very Weak';
  };

  // Copy matrix to clipboard
  const copyMatrix = () => {
    let text = 'Correlation Matrix\n\n';
    text += 'Pair\t' + majorPairs.join('\t') + '\n';
    majorPairs.forEach(pair1 => {
      text += pair1 + '\t';
      majorPairs.forEach(pair2 => {
        const corr = correlations[pair1]?.[pair2];
        text += (corr !== undefined && !isNaN(corr) ? corr.toFixed(2) : '0.00') + '\t';
      });
      text += '\n';
    });

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const bgClass = theme === 'dark' ? 'bg-slate-900' : 'bg-white';
  const textClass = theme === 'dark' ? 'text-white' : 'text-slate-900';
  const secondaryTextClass = theme === 'dark' ? 'text-slate-400' : 'text-slate-600';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className={`text-xl font-bold ${textClass} flex items-center gap-2`}>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
              <TrendingUp size={20} className="text-white" />
            </div>
            Correlation Matrix
          </h3>
          <p className={`text-sm ${secondaryTextClass} mt-1`}>
            Identify hedging opportunities and correlated risk
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Timeframe Selector */}
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="all">All Time</option>
          </select>

          {/* Copy Button */}
          <button
            onClick={copyMatrix}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            title="Copy matrix"
          >
            {copied ? (
              <Check className="text-green-400" size={18} />
            ) : (
              <Copy className="text-slate-400" size={18} />
            )}
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 text-xs flex-wrap">
        <span className={secondaryTextClass}>Correlation Strength:</span>
        <div className="flex items-center gap-1">
          <div className="w-6 h-6 bg-green-600 rounded"></div>
          <span className={secondaryTextClass}>Strong Positive</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-6 h-6 bg-blue-400 rounded"></div>
          <span className={secondaryTextClass}>Weak Positive</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-6 h-6 bg-slate-600 rounded"></div>
          <span className={secondaryTextClass}>No Correlation</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-6 h-6 bg-orange-400 rounded"></div>
          <span className={secondaryTextClass}>Weak Negative</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-6 h-6 bg-red-600 rounded"></div>
          <span className={secondaryTextClass}>Strong Negative</span>
        </div>
      </div>

      {/* Correlation Matrix */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className={`p-2 border border-slate-700 ${bgClass} ${textClass} font-semibold text-left sticky left-0 z-10`}>
                Pair
              </th>
              {majorPairs.map(pair => (
                <th key={pair} className={`p-2 border border-slate-700 ${textClass} font-semibold text-center text-xs whitespace-nowrap`}>
                  {pair}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {majorPairs.map(pair1 => (
              <tr key={pair1} className="hover:bg-slate-800/30">
                <td className={`p-2 border border-slate-700 ${bgClass} ${textClass} font-semibold sticky left-0 z-10 text-sm`}>
                  {pair1}
                </td>
                {majorPairs.map(pair2 => {
                  const corr = correlations[pair1]?.[pair2];
                  const displayValue = corr !== undefined && !isNaN(corr) ? corr.toFixed(2) : '--';

                  return (
                    <td
                      key={pair2}
                      className={`p-2 border border-slate-700 text-center ${getCorrelationColor(corr)} font-mono text-sm cursor-help transition-all hover:scale-105`}
                      title={`${pair1} vs ${pair2}: ${displayValue} (${getInterpretation(corr)})`}
                    >
                      {displayValue}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Info Box */}
      <div className="p-4 bg-slate-800/30 border border-slate-700 rounded-lg">
        <div className="flex items-start gap-2">
          <Info className="text-cyan-400 mt-0.5 flex-shrink-0" size={16} />
          <div className={`text-xs ${secondaryTextClass} space-y-2`}>
            <p><strong className="text-cyan-300">How to use:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong>+1.0</strong> = Perfect positive correlation (pairs move together)</li>
              <li><strong>-1.0</strong> = Perfect negative correlation (pairs move opposite)</li>
              <li><strong>0.0</strong> = No correlation (independent movement)</li>
              <li><strong>Hedging:</strong> Use negative correlations (-0.7 or lower)</li>
              <li><strong>Risk Warning:</strong> Avoid multiple positions in highly correlated pairs (+0.8 or higher)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Key Insights */}
      {Object.keys(correlations).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Strongest Positive Correlations */}
          <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
            <h4 className="text-green-300 font-semibold mb-3 flex items-center gap-2">
              <TrendingUp size={16} />
              Strongest Positive Correlations
            </h4>
            <div className="space-y-2">
              {majorPairs.flatMap((pair1, i) =>
                majorPairs.slice(i + 1).map(pair2 => ({
                  pair1,
                  pair2,
                  corr: correlations[pair1]?.[pair2]
                }))
              )
                .filter(({ corr }) => corr > 0 && !isNaN(corr))
                .sort((a, b) => b.corr - a.corr)
                .slice(0, 3)
                .map(({ pair1, pair2, corr }) => (
                  <div key={`${pair1}-${pair2}`} className="flex items-center justify-between text-sm">
                    <span className="text-green-200">{pair1} & {pair2}</span>
                    <span className="text-green-400 font-mono font-bold">+{corr.toFixed(2)}</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Strongest Negative Correlations */}
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
            <h4 className="text-red-300 font-semibold mb-3 flex items-center gap-2">
              <TrendingDown size={16} />
              Strongest Negative Correlations
            </h4>
            <div className="space-y-2">
              {majorPairs.flatMap((pair1, i) =>
                majorPairs.slice(i + 1).map(pair2 => ({
                  pair1,
                  pair2,
                  corr: correlations[pair1]?.[pair2]
                }))
              )
                .filter(({ corr }) => corr < 0 && !isNaN(corr))
                .sort((a, b) => a.corr - b.corr)
                .slice(0, 3)
                .map(({ pair1, pair2, corr }) => (
                  <div key={`${pair1}-${pair2}`} className="flex items-center justify-between text-sm">
                    <span className="text-red-200">{pair1} & {pair2}</span>
                    <span className="text-red-400 font-mono font-bold">{corr.toFixed(2)}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CorrelationMatrix;
