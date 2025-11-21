import React, { useState, useEffect, useCallback } from 'react';
import {
  Brain, AlertTriangle, Lightbulb, Shield, TrendingUp, TrendingDown,
  CheckCircle, XCircle, Clock, Target, Activity, Zap, AlertCircle,
  ChevronRight, RefreshCw, Plus, Trash2, Eye, EyeOff
} from 'lucide-react';

const PsychologyDashboard = ({ apiUrl, authToken }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [profile, setProfile] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [insights, setInsights] = useState([]);
  const [rules, setRules] = useState([]);
  const [scoreHistory, setScoreHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRuleModal, setShowRuleModal] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const headers = { 'Authorization': `Bearer ${authToken}` };

      const [profileRes, alertsRes, insightsRes, rulesRes, historyRes] = await Promise.all([
        fetch(`${apiUrl}/api/psychology/profile`, { headers }),
        fetch(`${apiUrl}/api/psychology/alerts`, { headers }),
        fetch(`${apiUrl}/api/psychology/insights`, { headers }),
        fetch(`${apiUrl}/api/psychology/rules`, { headers }),
        fetch(`${apiUrl}/api/psychology/score-history`, { headers })
      ]);

      const [profileData, alertsData, insightsData, rulesData, historyData] = await Promise.all([
        profileRes.json(),
        alertsRes.json(),
        insightsRes.json(),
        rulesRes.json(),
        historyRes.json()
      ]);

      if (profileData.success) setProfile(profileData.profile);
      if (alertsData.success) setAlerts(alertsData.alerts || []);
      if (insightsData.success) setInsights(insightsData.insights || []);
      if (rulesData.success) setRules(rulesData.rules || []);
      if (historyData.success) setScoreHistory(historyData.history || []);
    } catch (err) {
      setError('Failed to load psychology data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, authToken]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const detectPatterns = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/psychology/detect-patterns`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch (err) {
      console.error('Pattern detection failed:', err);
    }
  };

  const respondToAlert = async (alertId, response) => {
    try {
      await fetch(`${apiUrl}/api/psychology/alerts/${alertId}/respond`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ response })
      });
      fetchData();
    } catch (err) {
      console.error('Failed to respond to alert:', err);
    }
  };

  const generateInsights = async () => {
    try {
      await fetch(`${apiUrl}/api/psychology/insights/generate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      fetchData();
    } catch (err) {
      console.error('Failed to generate insights:', err);
    }
  };

  const deleteRule = async (ruleId) => {
    try {
      await fetch(`${apiUrl}/api/psychology/rules/${ruleId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      fetchData();
    } catch (err) {
      console.error('Failed to delete rule:', err);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const getScoreBgColor = (score) => {
    if (score >= 80) return 'from-green-500/20 to-green-600/10';
    if (score >= 60) return 'from-yellow-500/20 to-yellow-600/10';
    if (score >= 40) return 'from-orange-500/20 to-orange-600/10';
    return 'from-red-500/20 to-red-600/10';
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default: return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <Brain className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Trading Psychology</h2>
            <p className="text-sm text-slate-400">Monitor your discipline and emotional state</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={detectPatterns}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white transition-colors"
          >
            <Activity className="w-4 h-4" />
            Scan Patterns
          </button>
          <button
            onClick={fetchData}
            className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-700 pb-2">
        {['overview', 'alerts', 'insights', 'rules'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-t-lg capitalize transition-colors ${
              activeTab === tab
                ? 'bg-purple-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            {tab}
            {tab === 'alerts' && alerts.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                {alerts.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && profile && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Score */}
          <div className={`lg:col-span-1 bg-gradient-to-br ${getScoreBgColor(profile.score)} border border-slate-700 rounded-xl p-6`}>
            <div className="text-center">
              <div className="text-6xl font-bold mb-2">
                <span className={getScoreColor(profile.score)}>{profile.score}</span>
                <span className="text-2xl text-slate-500">/100</span>
              </div>
              <p className="text-slate-400 mb-4">Discipline Score</p>

              {/* Score Gauge */}
              <div className="relative h-4 bg-slate-700 rounded-full overflow-hidden mb-6">
                <div
                  className={`absolute left-0 top-0 h-full rounded-full transition-all duration-500 ${
                    profile.score >= 80 ? 'bg-green-500' :
                    profile.score >= 60 ? 'bg-yellow-500' :
                    profile.score >= 40 ? 'bg-orange-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${profile.score}%` }}
                />
              </div>

              <div className="text-sm text-slate-400">
                {profile.score >= 80 && 'Excellent discipline! Keep it up.'}
                {profile.score >= 60 && profile.score < 80 && 'Good discipline, minor improvements needed.'}
                {profile.score >= 40 && profile.score < 60 && 'Moderate issues detected. Review your patterns.'}
                {profile.score < 40 && 'Critical: Your discipline needs immediate attention.'}
              </div>
            </div>

            {/* Streak */}
            <div className="mt-6 pt-6 border-t border-slate-700">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Current Streak</span>
                <span className="text-xl font-bold text-purple-400">{profile.streak} days</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-slate-400">Best Streak</span>
                <span className="text-slate-300">{profile.longestStreak} days</span>
              </div>
            </div>
          </div>

          {/* Component Scores */}
          <div className="lg:col-span-2 grid grid-cols-2 gap-4">
            {profile.components && (
              <>
                <ScoreCard
                  title="Risk Discipline"
                  score={profile.components.riskDiscipline}
                  icon={Shield}
                  description="Position sizing consistency"
                />
                <ScoreCard
                  title="Consistency"
                  score={profile.components.consistency}
                  icon={Target}
                  description="Trading pattern regularity"
                />
                <ScoreCard
                  title="Emotional Control"
                  score={profile.components.emotionalControl}
                  icon={Brain}
                  description="Revenge trading resistance"
                />
                <ScoreCard
                  title="Rule Adherence"
                  score={profile.components.ruleAdherence}
                  icon={CheckCircle}
                  description="Following your own rules"
                />
              </>
            )}
          </div>

          {/* Risk Indicators */}
          {profile.risks && (
            <div className="lg:col-span-3 bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                Risk Indicators
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <RiskIndicator
                  label="Revenge Trading Risk"
                  value={profile.risks.revengeTradingRisk}
                />
                <RiskIndicator
                  label="Overtrading Risk"
                  value={profile.risks.overtradingRisk}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Alerts Tab */}
      {activeTab === 'alerts' && (
        <div className="space-y-4">
          {alerts.length === 0 ? (
            <div className="text-center py-12 bg-slate-800/50 rounded-xl border border-slate-700">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white">No Active Alerts</h3>
              <p className="text-slate-400">Your trading behavior looks healthy!</p>
            </div>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-xl border ${getSeverityColor(alert.severity)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 mt-0.5" />
                    <div>
                      <h4 className="font-semibold">{alert.title}</h4>
                      <p className="text-sm opacity-80 mt-1">{alert.message}</p>
                      {alert.recommended_action && (
                        <p className="text-sm mt-2 flex items-center gap-1">
                          <Lightbulb className="w-4 h-4" />
                          {alert.recommended_action}
                        </p>
                      )}
                      <p className="text-xs opacity-60 mt-2">
                        {new Date(alert.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => respondToAlert(alert.id, 'heeded')}
                      className="p-2 bg-green-500/20 hover:bg-green-500/30 rounded-lg text-green-400 transition-colors"
                      title="I heeded this alert"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => respondToAlert(alert.id, 'dismissed')}
                      className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-400 transition-colors"
                      title="Dismiss"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Insights Tab */}
      {activeTab === 'insights' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={generateInsights}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white transition-colors"
            >
              <Zap className="w-4 h-4" />
              Generate New Insights
            </button>
          </div>

          {insights.length === 0 ? (
            <div className="text-center py-12 bg-slate-800/50 rounded-xl border border-slate-700">
              <Lightbulb className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white">No Insights Yet</h3>
              <p className="text-slate-400">Click "Generate New Insights" to analyze your trading patterns.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {insights.map((insight) => (
                <InsightCard key={insight.id} insight={insight} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Rules Tab */}
      {activeTab === 'rules' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowRuleModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Trading Rule
            </button>
          </div>

          {rules.length === 0 ? (
            <div className="text-center py-12 bg-slate-800/50 rounded-xl border border-slate-700">
              <Shield className="w-12 h-12 text-purple-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white">No Trading Rules</h3>
              <p className="text-slate-400">Create rules to enforce discipline in your trading.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {rules.map((rule) => (
                <RuleCard key={rule.id} rule={rule} onDelete={() => deleteRule(rule.id)} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Rule Modal */}
      {showRuleModal && (
        <AddRuleModal
          apiUrl={apiUrl}
          authToken={authToken}
          onClose={() => setShowRuleModal(false)}
          onSuccess={() => {
            setShowRuleModal(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
};

// Sub-components
const ScoreCard = ({ title, score, icon: Icon, description }) => {
  const getColor = (score) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-slate-400" />
        <span className="text-sm text-slate-400">{title}</span>
      </div>
      <div className={`text-3xl font-bold ${getColor(score)}`}>{score}</div>
      <p className="text-xs text-slate-500 mt-1">{description}</p>
      <div className="mt-2 h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${
            score >= 80 ? 'bg-green-500' :
            score >= 60 ? 'bg-yellow-500' :
            score >= 40 ? 'bg-orange-500' : 'bg-red-500'
          }`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
};

const RiskIndicator = ({ label, value }) => {
  const getColor = (value) => {
    if (value <= 20) return 'bg-green-500';
    if (value <= 40) return 'bg-yellow-500';
    if (value <= 60) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="text-center">
      <div className="relative w-20 h-20 mx-auto">
        <svg className="w-20 h-20 transform -rotate-90">
          <circle
            cx="40"
            cy="40"
            r="35"
            stroke="currentColor"
            strokeWidth="6"
            fill="none"
            className="text-slate-700"
          />
          <circle
            cx="40"
            cy="40"
            r="35"
            stroke="currentColor"
            strokeWidth="6"
            fill="none"
            strokeDasharray={`${(value / 100) * 220} 220`}
            className={`${
              value <= 20 ? 'text-green-500' :
              value <= 40 ? 'text-yellow-500' :
              value <= 60 ? 'text-orange-500' : 'text-red-500'
            }`}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-white">
          {value}%
        </span>
      </div>
      <p className="text-sm text-slate-400 mt-2">{label}</p>
    </div>
  );
};

const InsightCard = ({ insight }) => {
  const getTypeColor = (type) => {
    switch (type) {
      case 'achievement': return 'border-green-500/30 bg-green-500/10';
      case 'warning': return 'border-red-500/30 bg-red-500/10';
      case 'suggestion': return 'border-blue-500/30 bg-blue-500/10';
      default: return 'border-purple-500/30 bg-purple-500/10';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'achievement': return CheckCircle;
      case 'warning': return AlertTriangle;
      case 'suggestion': return Lightbulb;
      default: return Brain;
    }
  };

  const Icon = getTypeIcon(insight.insight_type);
  const actionItems = insight.action_items ? JSON.parse(insight.action_items) : [];

  return (
    <div className={`p-4 rounded-xl border ${getTypeColor(insight.insight_type)}`}>
      <div className="flex items-start gap-3">
        <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
        <div>
          <h4 className="font-semibold text-white">{insight.title}</h4>
          <p className="text-sm text-slate-300 mt-1">{insight.description}</p>

          {actionItems.length > 0 && (
            <ul className="mt-3 space-y-1">
              {actionItems.map((item, i) => (
                <li key={i} className="text-sm text-slate-400 flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          )}

          <div className="flex items-center gap-2 mt-3 text-xs text-slate-500">
            <span>Confidence: {(insight.confidence * 100).toFixed(0)}%</span>
            <span>•</span>
            <span>{new Date(insight.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const RuleCard = ({ rule, onDelete }) => {
  const ruleValue = rule.rule_value ? JSON.parse(rule.rule_value) : {};

  const getRuleDescription = () => {
    switch (rule.rule_type) {
      case 'max_trades_per_day':
        return `Max ${ruleValue.max_trades} trades per day`;
      case 'max_position_size':
        return `Max position size: ${ruleValue.max_lots} lots`;
      case 'max_daily_loss':
        return `Max daily loss: $${ruleValue.max_loss}`;
      case 'trading_hours':
        return `Trading hours: ${ruleValue.start_hour}:00 - ${ruleValue.end_hour}:00`;
      case 'pair_restriction':
        return `Only trade: ${ruleValue.allowed_pairs?.join(', ')}`;
      default:
        return JSON.stringify(ruleValue);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-slate-800/50 border border-slate-700 rounded-xl">
      <div className="flex items-center gap-3">
        <Shield className={`w-5 h-5 ${rule.is_active ? 'text-purple-400' : 'text-slate-500'}`} />
        <div>
          <h4 className="font-medium text-white">{rule.rule_name}</h4>
          <p className="text-sm text-slate-400">{getRuleDescription()}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs px-2 py-0.5 rounded ${
              rule.enforcement_level === 'prevent' ? 'bg-red-500/20 text-red-400' :
              rule.enforcement_level === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-slate-600 text-slate-400'
            }`}>
              {rule.enforcement_level}
            </span>
            {rule.total_violations > 0 && (
              <span className="text-xs text-red-400">{rule.total_violations} violations</span>
            )}
          </div>
        </div>
      </div>
      <button
        onClick={onDelete}
        className="p-2 text-slate-400 hover:text-red-400 transition-colors"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
};

const AddRuleModal = ({ apiUrl, authToken, onClose, onSuccess }) => {
  const [ruleName, setRuleName] = useState('');
  const [ruleType, setRuleType] = useState('max_trades_per_day');
  const [ruleValue, setRuleValue] = useState({ max_trades: 10 });
  const [enforcement, setEnforcement] = useState('warning');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${apiUrl}/api/psychology/rules`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          rule_name: ruleName,
          rule_type: ruleType,
          rule_value: ruleValue,
          enforcement_level: enforcement
        })
      });

      const data = await res.json();
      if (data.success) {
        onSuccess();
      }
    } catch (err) {
      console.error('Failed to create rule:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateRuleValue = (type) => {
    switch (type) {
      case 'max_trades_per_day':
        setRuleValue({ max_trades: 10 });
        break;
      case 'max_position_size':
        setRuleValue({ max_lots: 1.0 });
        break;
      case 'max_daily_loss':
        setRuleValue({ max_loss: 100 });
        break;
      case 'trading_hours':
        setRuleValue({ start_hour: 9, end_hour: 17 });
        break;
      default:
        setRuleValue({});
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-white mb-4">Add Trading Rule</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Rule Name</label>
            <input
              type="text"
              value={ruleName}
              onChange={(e) => setRuleName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
              placeholder="e.g., Daily Trade Limit"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Rule Type</label>
            <select
              value={ruleType}
              onChange={(e) => {
                setRuleType(e.target.value);
                updateRuleValue(e.target.value);
              }}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
            >
              <option value="max_trades_per_day">Max Trades Per Day</option>
              <option value="max_position_size">Max Position Size</option>
              <option value="max_daily_loss">Max Daily Loss</option>
              <option value="trading_hours">Trading Hours</option>
            </select>
          </div>

          {ruleType === 'max_trades_per_day' && (
            <div>
              <label className="block text-sm text-slate-400 mb-1">Max Trades</label>
              <input
                type="number"
                value={ruleValue.max_trades}
                onChange={(e) => setRuleValue({ max_trades: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                min="1"
              />
            </div>
          )}

          {ruleType === 'max_position_size' && (
            <div>
              <label className="block text-sm text-slate-400 mb-1">Max Lots</label>
              <input
                type="number"
                step="0.01"
                value={ruleValue.max_lots}
                onChange={(e) => setRuleValue({ max_lots: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                min="0.01"
              />
            </div>
          )}

          {ruleType === 'max_daily_loss' && (
            <div>
              <label className="block text-sm text-slate-400 mb-1">Max Loss ($)</label>
              <input
                type="number"
                value={ruleValue.max_loss}
                onChange={(e) => setRuleValue({ max_loss: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                min="1"
              />
            </div>
          )}

          {ruleType === 'trading_hours' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Start Hour</label>
                <input
                  type="number"
                  value={ruleValue.start_hour}
                  onChange={(e) => setRuleValue({ ...ruleValue, start_hour: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                  min="0"
                  max="23"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">End Hour</label>
                <input
                  type="number"
                  value={ruleValue.end_hour}
                  onChange={(e) => setRuleValue({ ...ruleValue, end_hour: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                  min="0"
                  max="23"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm text-slate-400 mb-1">Enforcement Level</label>
            <select
              value={enforcement}
              onChange={(e) => setEnforcement(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
            >
              <option value="log_only">Log Only</option>
              <option value="warning">Show Warning</option>
              <option value="prevent">Prevent Action</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !ruleName}
              className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg text-white transition-colors"
            >
              {loading ? 'Creating...' : 'Create Rule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PsychologyDashboard;
