import { useState, useEffect, useMemo } from 'react';
import { Brain, TrendingUp, TrendingDown, AlertTriangle, Target, Award, Zap, Activity, Eye, MessageSquare } from 'lucide-react';

const PsychologyCoach = ({ trades }) => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d'); // 7d, 30d, 90d, all

  // Safe JSON parser
  const safeJsonParse = (jsonString, fallback = []) => {
    if (!jsonString) return fallback;
    try {
      const parsed = JSON.parse(jsonString);
      return Array.isArray(parsed) ? parsed : fallback;
    } catch (e) {
      return fallback;
    }
  };

  // Filter trades by timeframe
  const filteredTrades = useMemo(() => {
    if (selectedTimeframe === 'all') return trades;

    const now = new Date();
    const daysMap = { '7d': 7, '30d': 30, '90d': 90 };
    const days = daysMap[selectedTimeframe];
    const cutoffDate = new Date(now - days * 24 * 60 * 60 * 1000);

    return trades.filter(t => new Date(t.entry_time) >= cutoffDate);
  }, [trades, selectedTimeframe]);

  // Analyze psychological patterns
  const psychologyAnalysis = useMemo(() => {
    const tradesWithJournal = filteredTrades.filter(t =>
      t.trade_notes || t.emotions || t.tags || t.overall_rating
    );

    if (tradesWithJournal.length === 0) {
      return null;
    }

    // Emotion analysis
    const emotionCounts = {};
    const emotionsByOutcome = { winning: {}, losing: {} };

    tradesWithJournal.forEach(trade => {
      const emotions = safeJsonParse(trade.emotions, []);
      const isWinner = parseFloat(trade.profit_loss) > 0;
      const outcome = isWinner ? 'winning' : 'losing';

      emotions.forEach(emotion => {
        emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
        emotionsByOutcome[outcome][emotion] = (emotionsByOutcome[outcome][emotion] || 0) + 1;
      });
    });

    // Tag analysis
    const tagCounts = {};
    const tagsByOutcome = { winning: {}, losing: {} };

    tradesWithJournal.forEach(trade => {
      const tags = safeJsonParse(trade.tags, []);
      const isWinner = parseFloat(trade.profit_loss) > 0;
      const outcome = isWinner ? 'winning' : 'losing';

      tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        tagsByOutcome[outcome][tag] = (tagsByOutcome[outcome][tag] || 0) + 1;
      });
    });

    // Rating analysis
    const ratings = tradesWithJournal
      .filter(t => t.overall_rating)
      .map(t => parseFloat(t.overall_rating));

    const avgRating = ratings.length > 0
      ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2)
      : 0;

    // Performance by emotion
    const performanceByEmotion = {};
    Object.keys(emotionCounts).forEach(emotion => {
      const tradesWithEmotion = tradesWithJournal.filter(t =>
        safeJsonParse(t.emotions, []).includes(emotion)
      );
      const winRate = tradesWithEmotion.length > 0
        ? (tradesWithEmotion.filter(t => parseFloat(t.profit_loss) > 0).length / tradesWithEmotion.length) * 100
        : 0;
      const avgPL = tradesWithEmotion.length > 0
        ? tradesWithEmotion.reduce((sum, t) => sum + parseFloat(t.profit_loss), 0) / tradesWithEmotion.length
        : 0;

      performanceByEmotion[emotion] = {
        count: emotionCounts[emotion],
        winRate: winRate.toFixed(1),
        avgPL: avgPL.toFixed(2)
      };
    });

    // Performance by tag
    const performanceByTag = {};
    Object.keys(tagCounts).forEach(tag => {
      const tradesWithTag = tradesWithJournal.filter(t =>
        safeJsonParse(t.tags, []).includes(tag)
      );
      const winRate = tradesWithTag.length > 0
        ? (tradesWithTag.filter(t => parseFloat(t.profit_loss) > 0).length / tradesWithTag.length) * 100
        : 0;
      const avgPL = tradesWithTag.length > 0
        ? tradesWithTag.reduce((sum, t) => sum + parseFloat(t.profit_loss), 0) / tradesWithTag.length
        : 0;

      performanceByTag[tag] = {
        count: tagCounts[tag],
        winRate: winRate.toFixed(1),
        avgPL: avgPL.toFixed(2)
      };
    });

    // Detect patterns
    const patterns = [];

    // Check for negative emotions correlating with losses
    const negativeEmotions = ['FOMO', 'Anxious', 'Greedy', 'Fearful', 'Frustrated', 'Overconfident', 'Revenge Trading', 'Doubtful'];
    negativeEmotions.forEach(emotion => {
      if (performanceByEmotion[emotion]) {
        const winRate = parseFloat(performanceByEmotion[emotion].winRate);
        if (winRate < 40) {
          patterns.push({
            type: 'warning',
            title: `${emotion} Correlation Detected`,
            description: `Your win rate is ${winRate}% when feeling "${emotion}". Consider taking a break when experiencing this emotion.`,
            severity: 'high'
          });
        }
      }
    });

    // Check for positive emotions correlating with wins
    const positiveEmotions = ['Confident', 'Patient', 'Disciplined', 'Calm', 'Focused', 'Zen'];
    positiveEmotions.forEach(emotion => {
      if (performanceByEmotion[emotion]) {
        const winRate = parseFloat(performanceByEmotion[emotion].winRate);
        if (winRate > 60) {
          patterns.push({
            type: 'success',
            title: `${emotion} = Success`,
            description: `You achieve ${winRate}% win rate when "${emotion}". Try to replicate this mental state.`,
            severity: 'positive'
          });
        }
      }
    });

    // Check for revenge trading pattern
    if (performanceByEmotion['Revenge Trading']) {
      patterns.push({
        type: 'danger',
        title: 'Revenge Trading Detected',
        description: `You've logged ${performanceByEmotion['Revenge Trading'].count} trades with revenge trading emotion. This is a critical risk factor.`,
        severity: 'critical'
      });
    }

    // Check for FOMO pattern
    if (performanceByEmotion['FOMO']) {
      const fomoPL = parseFloat(performanceByEmotion['FOMO'].avgPL);
      if (fomoPL < 0) {
        patterns.push({
          type: 'warning',
          title: 'FOMO Causing Losses',
          description: `FOMO trades are averaging ${fomoPL} loss. Wait for proper setups.`,
          severity: 'high'
        });
      }
    }

    // Find best and worst strategies
    const tagEntries = Object.entries(performanceByTag)
      .filter(([_, data]) => data.count >= 3); // At least 3 trades

    const bestStrategy = tagEntries.length > 0
      ? tagEntries.reduce((best, current) =>
          parseFloat(current[1].winRate) > parseFloat(best[1].winRate) ? current : best
        )
      : null;

    const worstStrategy = tagEntries.length > 0
      ? tagEntries.reduce((worst, current) =>
          parseFloat(current[1].winRate) < parseFloat(worst[1].winRate) ? current : worst
        )
      : null;

    return {
      emotionCounts,
      emotionsByOutcome,
      tagCounts,
      tagsByOutcome,
      avgRating,
      performanceByEmotion,
      performanceByTag,
      patterns,
      bestStrategy,
      worstStrategy,
      totalAnalyzed: tradesWithJournal.length
    };
  }, [filteredTrades]);

  // Generate AI insights
  const generateAIInsights = async () => {
    if (!psychologyAnalysis) return;

    setLoading(true);
    try {
      // Prepare data for AI analysis
      const analysisData = {
        timeframe: selectedTimeframe,
        totalTrades: psychologyAnalysis.totalAnalyzed,
        avgRating: psychologyAnalysis.avgRating,
        patterns: psychologyAnalysis.patterns,
        topEmotions: Object.entries(psychologyAnalysis.emotionCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5),
        performanceByEmotion: psychologyAnalysis.performanceByEmotion,
        bestStrategy: psychologyAnalysis.bestStrategy,
        worstStrategy: psychologyAnalysis.worstStrategy
      };

      const response = await fetch('http://localhost:8787/api/psychology-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(analysisData)
      });

      if (response.ok) {
        const data = await response.json();
        setInsights(data.insights);
      }
    } catch (error) {
      console.error('Failed to generate AI insights:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!psychologyAnalysis) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20">
        <Brain size={64} className="text-slate-600 mb-4" />
        <h3 className="text-xl text-slate-300 font-semibold mb-2">No Psychology Data Yet</h3>
        <p className="text-slate-500 text-center max-w-md">
          Start journaling your trades with emotions, tags, and ratings to unlock personalized psychology coaching.
        </p>
      </div>
    );
  }

  const { patterns, performanceByEmotion, performanceByTag, bestStrategy, worstStrategy, avgRating, totalAnalyzed } = psychologyAnalysis;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-500/20 rounded-xl">
            <Brain size={28} className="text-purple-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Trading Psychology Coach</h2>
            <p className="text-slate-400 text-sm">AI-powered analysis of your trading mindset</p>
          </div>
        </div>

        {/* Timeframe selector */}
        <div className="flex gap-2">
          {['7d', '30d', '90d', 'all'].map(tf => (
            <button
              key={tf}
              onClick={() => setSelectedTimeframe(tf)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedTimeframe === tf
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {tf === 'all' ? 'All Time' : tf.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity size={18} className="text-blue-400" />
            <span className="text-slate-400 text-sm">Trades Analyzed</span>
          </div>
          <div className="text-2xl font-bold text-white">{totalAnalyzed}</div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Award size={18} className="text-yellow-400" />
            <span className="text-slate-400 text-sm">Avg Self-Rating</span>
          </div>
          <div className="text-2xl font-bold text-white">{avgRating}/5.0</div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={18} className="text-red-400" />
            <span className="text-slate-400 text-sm">Risk Patterns</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {patterns.filter(p => p.severity === 'critical' || p.severity === 'high').length}
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={18} className="text-green-400" />
            <span className="text-slate-400 text-sm">Strengths Found</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {patterns.filter(p => p.type === 'success').length}
          </div>
        </div>
      </div>

      {/* AI Insights Section */}
      <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded-xl p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <MessageSquare size={24} className="text-purple-400" />
            <div>
              <h3 className="text-lg font-semibold text-white">AI Coaching Insights</h3>
              <p className="text-slate-400 text-sm">Personalized recommendations from Claude AI</p>
            </div>
          </div>
          <button
            onClick={generateAIInsights}
            disabled={loading}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg transition-all flex items-center gap-2"
          >
            <Brain size={16} />
            {loading ? 'Analyzing...' : 'Generate Insights'}
          </button>
        </div>

        {insights && (
          <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
            <pre className="text-slate-300 text-sm whitespace-pre-wrap">{insights}</pre>
          </div>
        )}

        {!insights && !loading && (
          <div className="text-center py-8 text-slate-400">
            Click "Generate Insights" to get personalized AI coaching based on your trading psychology
          </div>
        )}
      </div>

      {/* Pattern Alerts */}
      {patterns.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Eye size={20} />
            Detected Patterns
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {patterns.map((pattern, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-xl border ${
                  pattern.severity === 'critical'
                    ? 'bg-red-900/20 border-red-500/50'
                    : pattern.severity === 'high'
                    ? 'bg-orange-900/20 border-orange-500/50'
                    : pattern.severity === 'positive'
                    ? 'bg-green-900/20 border-green-500/50'
                    : 'bg-yellow-900/20 border-yellow-500/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  {pattern.severity === 'critical' || pattern.severity === 'high' ? (
                    <AlertTriangle size={20} className="text-red-400 mt-0.5 flex-shrink-0" />
                  ) : pattern.severity === 'positive' ? (
                    <TrendingUp size={20} className="text-green-400 mt-0.5 flex-shrink-0" />
                  ) : (
                    <Target size={20} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                  )}
                  <div>
                    <h4 className="font-semibold text-white mb-1">{pattern.title}</h4>
                    <p className="text-sm text-slate-300">{pattern.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Emotion Performance */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Activity size={20} />
          Performance by Emotion
        </h3>
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Emotion</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-slate-300">Trades</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-slate-300">Win Rate</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-slate-300">Avg P&L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {Object.entries(performanceByEmotion)
                  .sort((a, b) => b[1].count - a[1].count)
                  .map(([emotion, data]) => (
                    <tr key={emotion} className="hover:bg-slate-700/30 transition-colors">
                      <td className="px-4 py-3 text-sm text-white">{emotion}</td>
                      <td className="px-4 py-3 text-sm text-slate-300 text-center">{data.count}</td>
                      <td className="px-4 py-3 text-sm text-center">
                        <span className={`font-semibold ${
                          parseFloat(data.winRate) >= 60 ? 'text-green-400' :
                          parseFloat(data.winRate) >= 40 ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>
                          {data.winRate}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        <span className={`font-semibold ${
                          parseFloat(data.avgPL) > 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          ${data.avgPL}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Strategy Performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Best Strategy */}
        {bestStrategy && (
          <div className="bg-green-900/20 border border-green-500/50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp size={24} className="text-green-400" />
              <h3 className="text-lg font-semibold text-white">Best Strategy</h3>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-green-400">{bestStrategy[0]}</div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300">Win Rate:</span>
                <span className="text-green-400 font-semibold">{bestStrategy[1].winRate}%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300">Avg P&L:</span>
                <span className="text-green-400 font-semibold">${bestStrategy[1].avgPL}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300">Trades:</span>
                <span className="text-slate-300 font-semibold">{bestStrategy[1].count}</span>
              </div>
            </div>
          </div>
        )}

        {/* Worst Strategy */}
        {worstStrategy && (
          <div className="bg-red-900/20 border border-red-500/50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <TrendingDown size={24} className="text-red-400" />
              <h3 className="text-lg font-semibold text-white">Needs Improvement</h3>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-red-400">{worstStrategy[0]}</div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300">Win Rate:</span>
                <span className="text-red-400 font-semibold">{worstStrategy[1].winRate}%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300">Avg P&L:</span>
                <span className="text-red-400 font-semibold">${worstStrategy[1].avgPL}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300">Trades:</span>
                <span className="text-slate-300 font-semibold">{worstStrategy[1].count}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PsychologyCoach;
