import React, { useState } from 'react';
import {
  BarChart3, Clock, Calendar, TrendingDown, Target, Award,
  AlertCircle, Activity, Sun, Moon, Globe, Zap
} from 'lucide-react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend
} from 'recharts';

const AnalyticsTab = ({ analytics }) => {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'time', label: 'Time Analysis', icon: Clock },
    { id: 'performance', label: 'Performance', icon: TrendingDown },
    { id: 'patterns', label: 'Patterns', icon: Target }
  ];

  // Color schemes
  const COLORS = {
    green: '#10b981',
    red: '#ef4444',
    purple: '#8b5cf6',
    blue: '#3b82f6',
    yellow: '#f59e0b',
    cyan: '#06b6d4'
  };

  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl">
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

  // Render Overview Tab
  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key Insights Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Best Hour */}
        {analytics.bestHour && analytics.bestHour.pnl !== -Infinity && (
          <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 backdrop-blur-xl rounded-xl p-4 border border-green-500/30">
            <div className="flex items-center gap-2 mb-2">
              <Sun className="text-green-400" size={20} />
              <h3 className="text-green-300 font-semibold text-sm">Best Trading Hour</h3>
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {analytics.bestHour.hourLabel}
            </div>
            <div className="text-green-400 text-sm">
              +${analytics.bestHour.pnl.toFixed(2)} ({analytics.bestHour.trades} trades)
            </div>
          </div>
        )}

        {/* Worst Hour */}
        {analytics.worstHour && analytics.worstHour.pnl !== Infinity && (
          <div className="bg-gradient-to-br from-red-500/20 to-red-600/10 backdrop-blur-xl rounded-xl p-4 border border-red-500/30">
            <div className="flex items-center gap-2 mb-2">
              <Moon className="text-red-400" size={20} />
              <h3 className="text-red-300 font-semibold text-sm">Worst Trading Hour</h3>
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {analytics.worstHour.hourLabel}
            </div>
            <div className="text-red-400 text-sm">
              ${analytics.worstHour.pnl.toFixed(2)} ({analytics.worstHour.trades} trades)
            </div>
          </div>
        )}

        {/* Best Day */}
        {analytics.bestDay && analytics.bestDay.pnl !== -Infinity && (
          <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 backdrop-blur-xl rounded-xl p-4 border border-blue-500/30">
            <div className="flex items-center gap-2 mb-2">
              <Award className="text-blue-400" size={20} />
              <h3 className="text-blue-300 font-semibold text-sm">Best Trading Day</h3>
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {analytics.bestDay.day}
            </div>
            <div className="text-blue-400 text-sm">
              +${analytics.bestDay.pnl.toFixed(2)} ({analytics.bestDay.trades} trades)
            </div>
          </div>
        )}

        {/* Max Drawdown */}
        {analytics.maxDrawdownPoint && analytics.maxDrawdownPoint.drawdown < 0 && (
          <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 backdrop-blur-xl rounded-xl p-4 border border-yellow-500/30">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="text-yellow-400" size={20} />
              <h3 className="text-yellow-300 font-semibold text-sm">Max Drawdown</h3>
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {analytics.maxDrawdownPoint.drawdownPercent.toFixed(1)}%
            </div>
            <div className="text-yellow-400 text-sm">
              ${analytics.maxDrawdownPoint.drawdown.toFixed(2)}
            </div>
          </div>
        )}
      </div>

      {/* Top Pairs & Daily Performance */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Top Performing Pairs */}
        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          <div className="flex items-center gap-3 mb-6">
            <BarChart3 className="text-purple-400" size={24} />
            <h2 className="text-xl font-bold text-white">Top Performing Pairs</h2>
          </div>
          <div className="space-y-4">
            {analytics.topPairs.slice(0, 6).map(([pair, data], index) => (
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
                  <div className="text-right">
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

        {/* Daily Performance */}
        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          <div className="flex items-center gap-3 mb-6">
            <Activity className="text-blue-400" size={24} />
            <h2 className="text-xl font-bold text-white">Cumulative Performance</h2>
          </div>
          {analytics.chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={analytics.chartData}>
                <defs>
                  <linearGradient id="colorPnl" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.purple} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={COLORS.purple} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="cumulative"
                  stroke={COLORS.purple}
                  fillOpacity={1}
                  fill="url(#colorPnl)"
                  name="Cumulative P&L"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[400px] flex items-center justify-center text-slate-400">
              No trade data available
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Render Time Analysis Tab
  const renderTimeAnalysis = () => (
    <div className="space-y-6">
      {/* Trading Sessions */}
      {analytics.sessionAnalysis && analytics.sessionAnalysis.length > 0 && (
        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          <div className="flex items-center gap-3 mb-6">
            <Globe className="text-cyan-400" size={24} />
            <h2 className="text-xl font-bold text-white">Trading Sessions</h2>
            <span className="text-slate-400 text-sm">(GMT timezone)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {analytics.sessionAnalysis.map((session) => (
              <div key={session.name} className="p-4 bg-white/5 rounded-xl border border-white/10 hover:border-cyan-500/30 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-2xl mb-1">{session.emoji}</div>
                    <div className="text-white font-bold">{session.name}</div>
                    <div className="text-slate-400 text-xs">
                      {session.start}:00 - {session.end}:00 GMT
                    </div>
                  </div>
                  <div className={`text-2xl font-bold ${session.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {session.pnl >= 0 ? '+' : ''}${parseFloat(session.pnl).toFixed(0)}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Trades</span>
                    <span className="text-white font-medium">{session.trades}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Win Rate</span>
                    <span className={`font-medium ${parseFloat(session.winRate) >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                      {session.winRate}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hourly Heatmap */}
      {analytics.timeOfDayAnalysis && analytics.timeOfDayAnalysis.length > 0 && (
        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          <div className="flex items-center gap-3 mb-6">
            <Clock className="text-purple-400" size={24} />
            <h2 className="text-xl font-bold text-white">Performance by Hour</h2>
          </div>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={analytics.timeOfDayAnalysis}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
              <XAxis dataKey="hourLabel" stroke="#94a3b8" style={{ fontSize: '11px' }} />
              <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="pnl" radius={[4, 4, 0, 0]} name="P&L">
                {analytics.timeOfDayAnalysis.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? COLORS.green : COLORS.red} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Weekday Performance */}
      {analytics.weekdayAnalysis && analytics.weekdayAnalysis.length > 0 && (
        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          <div className="flex items-center gap-3 mb-6">
            <Calendar className="text-blue-400" size={24} />
            <h2 className="text-xl font-bold text-white">Performance by Weekday</h2>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={analytics.weekdayAnalysis}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
              <XAxis dataKey="day" stroke="#94a3b8" style={{ fontSize: '12px' }} />
              <YAxis yAxisId="left" stroke="#94a3b8" style={{ fontSize: '12px' }} />
              <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" style={{ fontSize: '12px' }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar yAxisId="left" dataKey="pnl" radius={[4, 4, 0, 0]} name="P&L">
                {analytics.weekdayAnalysis.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? COLORS.green : COLORS.red} />
                ))}
              </Bar>
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="winRate"
                stroke={COLORS.yellow}
                strokeWidth={2}
                name="Win Rate %"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );

  // Render Performance Tab
  const renderPerformance = () => (
    <div className="space-y-6">
      {/* Monthly Calendar */}
      {analytics.monthlyCalendar && analytics.monthlyCalendar.length > 0 && (
        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          <div className="flex items-center gap-3 mb-6">
            <Calendar className="text-green-400" size={24} />
            <h2 className="text-xl font-bold text-white">Monthly P&L Calendar</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {analytics.monthlyCalendar.map((month) => (
              <div
                key={month.month}
                className={`p-4 rounded-xl border-2 transition-all hover:scale-105 ${
                  month.pnl >= 0
                    ? 'bg-green-500/10 border-green-500/30 hover:border-green-500/50'
                    : 'bg-red-500/10 border-red-500/30 hover:border-red-500/50'
                }`}
              >
                <div className="text-slate-400 text-xs mb-1">{month.monthLabel}</div>
                <div className={`text-2xl font-bold mb-2 ${month.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {month.pnl >= 0 ? '+' : ''}${month.pnl.toFixed(0)}
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Trades:</span>
                    <span className="text-white">{month.trades}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Win Rate:</span>
                    <span className={parseFloat(month.winRate) >= 50 ? 'text-green-400' : 'text-red-400'}>
                      {month.winRate}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Drawdown Analysis */}
      {analytics.drawdownData && analytics.drawdownData.length > 0 && (
        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          <div className="flex items-center gap-3 mb-6">
            <TrendingDown className="text-red-400" size={24} />
            <h2 className="text-xl font-bold text-white">Equity Curve & Drawdown</h2>
          </div>
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={analytics.drawdownData}>
              <defs>
                <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.blue} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={COLORS.blue} stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
              <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: '11px' }} />
              <YAxis yAxisId="left" stroke="#94a3b8" style={{ fontSize: '12px' }} />
              <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" style={{ fontSize: '12px' }} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="equity"
                stroke={COLORS.blue}
                fill="url(#colorEquity)"
                name="Equity"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="drawdownPercent"
                stroke={COLORS.red}
                strokeWidth={2}
                name="Drawdown %"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );

  // Render Patterns Tab
  const renderPatterns = () => (
    <div className="space-y-6">
      {/* Trade Duration Analysis */}
      {analytics.durationAnalysis && analytics.durationAnalysis.length > 0 && (
        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          <div className="flex items-center gap-3 mb-6">
            <Zap className="text-yellow-400" size={24} />
            <h2 className="text-xl font-bold text-white">Performance by Trade Duration</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
            {analytics.durationAnalysis.map((duration) => (
              <div key={duration.label} className="p-4 bg-white/5 rounded-xl border border-white/10 hover:border-yellow-500/30 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-slate-400 text-sm mb-1">{duration.label}</div>
                    <div className={`text-2xl font-bold ${duration.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {duration.pnl >= 0 ? '+' : ''}${parseFloat(duration.pnl).toFixed(2)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-slate-400 text-xs mb-1">Win Rate</div>
                    <div className={`text-xl font-bold ${parseFloat(duration.winRate) >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                      {duration.winRate}%
                    </div>
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Trades: {duration.trades}</span>
                  <span className="text-white font-medium">
                    Avg: ${parseFloat(duration.avgPnl).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.durationAnalysis}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
              <XAxis dataKey="label" stroke="#94a3b8" style={{ fontSize: '11px' }} />
              <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="avgPnl" radius={[4, 4, 0, 0]} name="Avg P&L">
                {analytics.durationAnalysis.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.avgPnl >= 0 ? COLORS.green : COLORS.red} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Target className="text-purple-400" size={20} />
            Trading Patterns Summary
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
              <span className="text-slate-400">Most Active Hour</span>
              <span className="text-white font-bold">
                {analytics.timeOfDayAnalysis?.reduce((max, curr) =>
                  curr.trades > max.trades ? curr : max, { trades: 0, hourLabel: 'N/A' }
                ).hourLabel}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
              <span className="text-slate-400">Most Active Day</span>
              <span className="text-white font-bold">
                {analytics.weekdayAnalysis?.reduce((max, curr) =>
                  curr.trades > max.trades ? curr : max, { trades: 0, day: 'N/A' }
                ).day}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
              <span className="text-slate-400">Best Session</span>
              <span className="text-white font-bold">
                {analytics.sessionAnalysis?.reduce((best, curr) =>
                  curr.pnl > best.pnl ? curr : best, { pnl: -Infinity, name: 'N/A' }
                ).name} {analytics.sessionAnalysis?.reduce((best, curr) =>
                  curr.pnl > best.pnl ? curr : best, { pnl: -Infinity, emoji: '' }
                ).emoji}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Award className="text-blue-400" size={20} />
            Performance Insights
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
              <span className="text-slate-400">Avg Win</span>
              <span className="text-green-400 font-bold">
                +${analytics.avgWin?.toFixed(2) || '0.00'}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
              <span className="text-slate-400">Avg Loss</span>
              <span className="text-red-400 font-bold">
                -${analytics.avgLoss?.toFixed(2) || '0.00'}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
              <span className="text-slate-400">Profit Factor</span>
              <span className={`font-bold ${
                analytics.profitFactor !== 'N/A' && parseFloat(analytics.profitFactor) >= 1.5
                  ? 'text-green-400'
                  : 'text-yellow-400'
              }`}>
                {analytics.profitFactor}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex items-center gap-2 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-xl p-2 border border-white/10 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'time' && renderTimeAnalysis()}
      {activeTab === 'performance' && renderPerformance()}
      {activeTab === 'patterns' && renderPatterns()}
    </div>
  );
};

export default AnalyticsTab;
