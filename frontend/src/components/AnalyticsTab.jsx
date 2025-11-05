import React from 'react';
import { BarChart3 } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const AnalyticsTab = ({ analytics }) => {
  return (
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
  );
};

export default AnalyticsTab;
