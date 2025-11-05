import React, { useState } from 'react';
import { Brain, Sparkles, TrendingUp, TrendingDown, AlertCircle, CheckCircle, X, Info, RefreshCw } from 'lucide-react';

/**
 * AI Trade Review
 * Get instant AI-powered feedback on trade setups
 * Analyzes risk/reward, market conditions, and provides scoring
 */
const AITradeReview = ({ trade, onClose, theme = 'dark' }) => {
  const [review, setReview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  // Analyze trade setup
  const analyzeTrade = async () => {
    setAnalyzing(true);

    // Simulate AI analysis (in production, call actual AI API)
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Generate review based on trade data
    const analysis = generateMockAnalysis(trade);
    setReview(analysis);
    setAnalyzing(false);
  };

  // Mock AI analysis generator
  const generateMockAnalysis = (trade) => {
    // Calculate risk/reward
    const entryPrice = parseFloat(trade.entryPrice) || 0;
    const stopLoss = parseFloat(trade.stopLoss) || 0;
    const takeProfit = parseFloat(trade.takeProfit) || 0;

    const risk = Math.abs(entryPrice - stopLoss);
    const reward = Math.abs(takeProfit - entryPrice);
    const rrRatio = risk > 0 ? reward / risk : 0;

    // Generate score (0-100)
    let score = 50;

    // R:R ratio impact
    if (rrRatio >= 3) score += 20;
    else if (rrRatio >= 2) score += 15;
    else if (rrRatio >= 1.5) score += 10;
    else if (rrRatio < 1) score -= 15;

    // Position size impact
    const lotSize = parseFloat(trade.size) || 0;
    if (lotSize <= 0.1) score += 10;
    else if (lotSize <= 0.5) score += 5;
    else if (lotSize > 2) score -= 10;

    // Random market condition factors
    const trendAlignment = Math.random() > 0.5;
    if (trendAlignment) score += 15;
    else score -= 10;

    const volatility = Math.random();
    if (volatility < 0.3) score += 10;
    else if (volatility > 0.7) score -= 5;

    score = Math.max(0, Math.min(100, score));

    // Generate insights
    const insights = [];
    const warnings = [];
    const strengths = [];

    if (rrRatio >= 2) {
      strengths.push({
        title: 'Excellent Risk/Reward',
        description: `R:R ratio of ${rrRatio.toFixed(2)}:1 is above the recommended 2:1 minimum`
      });
    } else if (rrRatio < 1) {
      warnings.push({
        title: 'Poor Risk/Reward',
        description: `R:R ratio of ${rrRatio.toFixed(2)}:1 is below 1:1. Consider wider TP or tighter SL`
      });
    }

    if (lotSize <= 0.1) {
      strengths.push({
        title: 'Conservative Position Size',
        description: 'Small lot size minimizes account risk'
      });
    } else if (lotSize > 2) {
      warnings.push({
        title: 'Large Position Size',
        description: 'Consider reducing lot size to manage risk better'
      });
    }

    if (trendAlignment) {
      strengths.push({
        title: 'Trend Alignment',
        description: 'Trade direction aligns with overall market trend'
      });
    } else {
      warnings.push({
        title: 'Counter-Trend Trade',
        description: 'Trading against the prevailing trend increases risk'
      });
    }

    if (volatility > 0.7) {
      warnings.push({
        title: 'High Volatility',
        description: 'Current market volatility is elevated. Widen stops or reduce size'
      });
    }

    // Generate recommendations
    const recommendations = [];

    if (rrRatio < 2) {
      recommendations.push('Consider widening your take profit to improve R:R ratio');
    }

    if (lotSize > 1) {
      recommendations.push('Reduce position size to 0.5 lots or less for better risk management');
    }

    if (!trendAlignment && trade.type === 'buy') {
      recommendations.push('Wait for bullish confirmation before entering');
    } else if (!trendAlignment && trade.type === 'sell') {
      recommendations.push('Wait for bearish confirmation before entering');
    }

    recommendations.push('Set a reminder to move stop loss to breakeven at 1:1 R:R');
    recommendations.push('Consider partial profit taking at 1.5:1 R:R');

    return {
      score,
      rrRatio,
      verdict: score >= 70 ? 'excellent' : score >= 50 ? 'good' : 'poor',
      strengths,
      warnings,
      insights,
      recommendations
    };
  };

  React.useEffect(() => {
    if (trade) {
      analyzeTrade();
    }
  }, [trade]);

  const bgClass = theme === 'dark' ? 'bg-slate-900' : 'bg-white';
  const textClass = theme === 'dark' ? 'text-white' : 'text-slate-900';
  const secondaryTextClass = theme === 'dark' ? 'text-slate-400' : 'text-slate-600';

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className={`${bgClass} rounded-2xl max-w-3xl w-full border border-white/10 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto`}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between sticky top-0 bg-slate-900 z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
              <Brain size={24} className="text-white" />
            </div>
            <div>
              <h2 className={`text-xl font-bold ${textClass}`}>AI Trade Review</h2>
              <p className={`text-sm ${secondaryTextClass}`}>
                {trade?.pair} • {trade?.type?.toUpperCase()}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="text-slate-400" size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {analyzing ? (
            // Loading State
            <div className="text-center py-12">
              <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full animate-ping opacity-20"></div>
                <div className="relative w-24 h-24 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                  <Brain size={40} className="text-white animate-pulse" />
                </div>
              </div>
              <h3 className={`text-xl font-bold ${textClass} mb-2`}>Analyzing Trade Setup...</h3>
              <p className={secondaryTextClass}>AI is evaluating risk/reward, market conditions, and probability of success</p>
            </div>
          ) : review ? (
            // Review Results
            <>
              {/* Score Card */}
              <div className={`p-6 rounded-2xl border-2 ${
                review.verdict === 'excellent'
                  ? 'border-green-500 bg-green-500/10'
                  : review.verdict === 'good'
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-red-500 bg-red-500/10'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className={`text-3xl font-bold ${
                      review.verdict === 'excellent' ? 'text-green-400' :
                      review.verdict === 'good' ? 'text-blue-400' :
                      'text-red-400'
                    }`}>
                      {review.score}/100
                    </h3>
                    <p className={`text-sm ${secondaryTextClass}`}>Trade Score</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {review.verdict === 'excellent' && (
                      <>
                        <CheckCircle className="text-green-400" size={32} />
                        <span className="text-green-400 font-bold text-lg">Excellent Setup</span>
                      </>
                    )}
                    {review.verdict === 'good' && (
                      <>
                        <Info className="text-blue-400" size={32} />
                        <span className="text-blue-400 font-bold text-lg">Good Setup</span>
                      </>
                    )}
                    {review.verdict === 'poor' && (
                      <>
                        <AlertCircle className="text-red-400" size={32} />
                        <span className="text-red-400 font-bold text-lg">Needs Improvement</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Risk/Reward Display */}
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="p-3 bg-slate-800/50 rounded-lg">
                    <div className={`text-xs ${secondaryTextClass} mb-1`}>Risk/Reward</div>
                    <div className={`text-xl font-bold ${review.rrRatio >= 2 ? 'text-green-400' : 'text-yellow-400'}`}>
                      {review.rrRatio.toFixed(2)}:1
                    </div>
                  </div>
                  <div className="p-3 bg-slate-800/50 rounded-lg">
                    <div className={`text-xs ${secondaryTextClass} mb-1`}>Position Size</div>
                    <div className={`text-xl font-bold ${textClass}`}>
                      {trade.size} lots
                    </div>
                  </div>
                  <div className="p-3 bg-slate-800/50 rounded-lg">
                    <div className={`text-xs ${secondaryTextClass} mb-1`}>Entry Quality</div>
                    <div className={`text-xl font-bold ${
                      review.score >= 70 ? 'text-green-400' :
                      review.score >= 50 ? 'text-blue-400' :
                      'text-red-400'
                    }`}>
                      {review.score >= 70 ? 'High' : review.score >= 50 ? 'Medium' : 'Low'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Strengths */}
              {review.strengths.length > 0 && (
                <div>
                  <h4 className="text-green-300 font-semibold mb-3 flex items-center gap-2">
                    <CheckCircle size={18} />
                    Strengths ({review.strengths.length})
                  </h4>
                  <div className="space-y-2">
                    {review.strengths.map((strength, i) => (
                      <div key={i} className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                        <h5 className="text-green-300 font-medium mb-1">{strength.title}</h5>
                        <p className={`text-sm ${secondaryTextClass}`}>{strength.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warnings */}
              {review.warnings.length > 0 && (
                <div>
                  <h4 className="text-yellow-300 font-semibold mb-3 flex items-center gap-2">
                    <AlertCircle size={18} />
                    Warnings ({review.warnings.length})
                  </h4>
                  <div className="space-y-2">
                    {review.warnings.map((warning, i) => (
                      <div key={i} className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                        <h5 className="text-yellow-300 font-medium mb-1">{warning.title}</h5>
                        <p className={`text-sm ${secondaryTextClass}`}>{warning.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              <div>
                <h4 className="text-purple-300 font-semibold mb-3 flex items-center gap-2">
                  <Sparkles size={18} />
                  AI Recommendations
                </h4>
                <div className="space-y-2">
                  {review.recommendations.map((rec, i) => (
                    <div key={i} className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg flex items-start gap-2">
                      <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-xs font-bold">{i + 1}</span>
                      </div>
                      <p className={`text-sm ${textClass}`}>{rec}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={analyzeTrade}
                  className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCw size={18} />
                  Re-Analyze
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-all"
                >
                  Done
                </button>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer Info */}
        <div className="px-6 py-4 border-t border-slate-700 bg-slate-800/30">
          <div className="flex items-start gap-2">
            <Info className="text-cyan-400 mt-0.5 flex-shrink-0" size={14} />
            <p className={`text-xs ${secondaryTextClass}`}>
              <strong className="text-cyan-300">Disclaimer:</strong> This AI analysis is for educational purposes only. Always conduct your own analysis and never risk more than you can afford to lose.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AITradeReview;
