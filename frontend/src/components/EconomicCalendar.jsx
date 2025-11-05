import React, { useState, useEffect } from 'react';
import { Calendar, AlertTriangle, TrendingUp, Zap, Filter, RefreshCw, Clock } from 'lucide-react';

/**
 * Economic Calendar
 * Shows upcoming high-impact economic news events
 * Helps traders avoid news volatility or trade it
 */
const EconomicCalendar = ({ theme = 'dark' }) => {
  const [events, setEvents] = useState([]);
  const [filter, setFilter] = useState('all'); // all, high, medium, low
  const [timeRange, setTimeRange] = useState('today'); // today, week, month
  const [loading, setLoading] = useState(false);

  // Mock economic events (in production, fetch from API like ForexFactory, Investing.com, etc.)
  const mockEvents = [
    {
      id: 1,
      date: new Date().toISOString().split('T')[0],
      time: '08:30',
      currency: 'USD',
      event: 'Non-Farm Payrolls',
      impact: 'high',
      forecast: '180K',
      previous: '150K',
      actual: null
    },
    {
      id: 2,
      date: new Date().toISOString().split('T')[0],
      time: '10:00',
      currency: 'USD',
      event: 'Unemployment Rate',
      impact: 'high',
      forecast: '3.7%',
      previous: '3.8%',
      actual: null
    },
    {
      id: 3,
      date: new Date().toISOString().split('T')[0],
      time: '13:00',
      currency: 'EUR',
      event: 'ECB Interest Rate Decision',
      impact: 'high',
      forecast: '4.50%',
      previous: '4.50%',
      actual: null
    },
    {
      id: 4,
      date: new Date().toISOString().split('T')[0],
      time: '14:30',
      currency: 'USD',
      event: 'Crude Oil Inventories',
      impact: 'medium',
      forecast: '-2.1M',
      previous: '-1.5M',
      actual: null
    },
    {
      id: 5,
      date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      time: '09:00',
      currency: 'GBP',
      event: 'GDP Growth Rate',
      impact: 'high',
      forecast: '0.2%',
      previous: '0.1%',
      actual: null
    },
    {
      id: 6,
      date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      time: '12:30',
      currency: 'CAD',
      event: 'Bank of Canada Rate Decision',
      impact: 'high',
      forecast: '5.00%',
      previous: '5.00%',
      actual: null
    },
    {
      id: 7,
      date: new Date(Date.now() + 172800000).toISOString().split('T')[0],
      time: '01:30',
      currency: 'JPY',
      event: 'Tokyo Core CPI',
      impact: 'medium',
      forecast: '2.8%',
      previous: '2.9%',
      actual: null
    },
    {
      id: 8,
      date: new Date(Date.now() + 172800000).toISOString().split('T')[0],
      time: '08:30',
      currency: 'USD',
      event: 'Initial Jobless Claims',
      impact: 'medium',
      forecast: '220K',
      previous: '215K',
      actual: null
    }
  ];

  useEffect(() => {
    loadEvents();
  }, [timeRange]);

  const loadEvents = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setEvents(mockEvents);
      setLoading(false);
    }, 500);
  };

  // Filter events
  const filteredEvents = events.filter(event => {
    if (filter !== 'all' && event.impact !== filter) return false;

    const eventDate = new Date(event.date);
    const now = new Date();

    if (timeRange === 'today') {
      return eventDate.toDateString() === now.toDateString();
    } else if (timeRange === 'week') {
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      return eventDate >= now && eventDate <= weekFromNow;
    } else {
      const monthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      return eventDate >= now && eventDate <= monthFromNow;
    }
  }).sort((a, b) => {
    const dateA = new Date(`${a.date} ${a.time}`);
    const dateB = new Date(`${b.date} ${b.time}`);
    return dateA - dateB;
  });

  // Get impact color
  const getImpactColor = (impact) => {
    switch (impact) {
      case 'high':
        return 'bg-red-600 text-white';
      case 'medium':
        return 'bg-orange-500 text-white';
      case 'low':
        return 'bg-yellow-500 text-white';
      default:
        return 'bg-slate-600 text-white';
    }
  };

  // Get currency flag emoji
  const getCurrencyFlag = (currency) => {
    const flags = {
      'USD': '🇺🇸',
      'EUR': '🇪🇺',
      'GBP': '🇬🇧',
      'JPY': '🇯🇵',
      'CAD': '🇨🇦',
      'AUD': '🇦🇺',
      'NZD': '🇳🇿',
      'CHF': '🇨🇭'
    };
    return flags[currency] || '🌍';
  };

  // Check if event is soon
  const isEventSoon = (date, time) => {
    const eventTime = new Date(`${date} ${time}`);
    const now = new Date();
    const diffMinutes = (eventTime - now) / (1000 * 60);
    return diffMinutes > 0 && diffMinutes <= 60;
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
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-600 to-red-600 flex items-center justify-center">
              <Calendar size={20} className="text-white" />
            </div>
            Economic Calendar
          </h3>
          <p className={`text-sm ${secondaryTextClass} mt-1`}>
            High-impact news events that move markets
          </p>
        </div>

        <button
          onClick={loadEvents}
          disabled={loading}
          className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          title="Refresh"
        >
          <RefreshCw className={`text-slate-400 ${loading ? 'animate-spin' : ''}`} size={18} />
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Time Range */}
        <div className="flex items-center gap-2">
          <span className={`text-sm ${secondaryTextClass}`}>Show:</span>
          {['today', 'week', 'month'].map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                timeRange === range
                  ? 'bg-orange-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>

        <div className="w-px h-6 bg-slate-700"></div>

        {/* Impact Filter */}
        <div className="flex items-center gap-2">
          <Filter size={14} className={secondaryTextClass} />
          {['all', 'high', 'medium', 'low'].map(impact => (
            <button
              key={impact}
              onClick={() => setFilter(impact)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filter === impact
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {impact.charAt(0).toUpperCase() + impact.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Event List */}
      <div className="space-y-2">
        {filteredEvents.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="mx-auto mb-3 text-slate-600" size={48} />
            <p className={secondaryTextClass}>No events found for selected filters</p>
          </div>
        )}

        {filteredEvents.map(event => {
          const isSoon = isEventSoon(event.date, event.time);
          const eventDate = new Date(event.date);
          const isToday = eventDate.toDateString() === new Date().toDateString();
          const isTomorrow = eventDate.toDateString() === new Date(Date.now() + 86400000).toDateString();

          return (
            <div
              key={event.id}
              className={`p-4 rounded-xl border-2 transition-all ${
                isSoon
                  ? 'border-orange-500 bg-orange-500/10 animate-pulse'
                  : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                {/* Time & Currency */}
                <div className="flex-shrink-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-3xl">{getCurrencyFlag(event.currency)}</span>
                    <div>
                      <div className={`text-xs ${secondaryTextClass}`}>
                        {isToday ? 'Today' : isTomorrow ? 'Tomorrow' : eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                      <div className="text-lg font-bold text-white flex items-center gap-1">
                        <Clock size={14} />
                        {event.time}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Event Details */}
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h4 className={`font-semibold ${textClass}`}>{event.event}</h4>
                      <div className={`text-sm ${secondaryTextClass}`}>{event.currency}</div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-bold ${getImpactColor(event.impact)}`}>
                      {event.impact.toUpperCase()}
                    </span>
                  </div>

                  {/* Forecast Data */}
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <div className={`text-xs ${secondaryTextClass}`}>Forecast</div>
                      <div className="text-yellow-400 font-mono font-semibold">{event.forecast}</div>
                    </div>
                    <div>
                      <div className={`text-xs ${secondaryTextClass}`}>Previous</div>
                      <div className="text-slate-400 font-mono">{event.previous}</div>
                    </div>
                    <div>
                      <div className={`text-xs ${secondaryTextClass}`}>Actual</div>
                      <div className="text-green-400 font-mono font-semibold">
                        {event.actual || '--'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Alert Icon */}
                {isSoon && (
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center">
                      <AlertTriangle className="text-orange-400" size={20} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="p-4 bg-slate-800/30 border border-slate-700 rounded-lg">
        <h4 className={`text-sm font-semibold ${textClass} mb-3`}>Impact Level Guide</h4>
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-600 rounded"></div>
            <div>
              <div className={textClass}>High Impact</div>
              <div className={`text-xs ${secondaryTextClass}`}>Major market movers</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded"></div>
            <div>
              <div className={textClass}>Medium Impact</div>
              <div className={`text-xs ${secondaryTextClass}`}>Moderate volatility</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <div>
              <div className={textClass}>Low Impact</div>
              <div className={`text-xs ${secondaryTextClass}`}>Minor influence</div>
            </div>
          </div>
        </div>
      </div>

      {/* Trading Tips */}
      <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <div className="flex items-start gap-2">
          <Zap className="text-blue-400 mt-0.5 flex-shrink-0" size={14} />
          <div className={`text-xs ${secondaryTextClass}`}>
            <p><strong className="text-blue-300">Trading Tips:</strong></p>
            <ul className="list-disc list-inside space-y-0.5 ml-2 mt-1">
              <li><strong>High Impact:</strong> Avoid trading 15-30 min before/after or trade the breakout</li>
              <li><strong>Red Flag:</strong> Events marked with ⚠️ are happening within 1 hour</li>
              <li><strong>Forecast Deviation:</strong> Large differences between forecast and actual = big moves</li>
              <li><strong>NFP & Interest Rates:</strong> Highest volatility - widen stops or stay flat</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EconomicCalendar;
