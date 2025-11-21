import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2, Search, Filter, Star, StarHalf, ChevronDown, ChevronUp,
  DollarSign, TrendingUp, Shield, Globe, Clock, Award, Check, X,
  Plus, RefreshCw, ExternalLink, Calculator, AlertCircle, Sparkles,
  ArrowUpDown, Info, Percent, Zap
} from 'lucide-react';

const BrokerComparison = ({ apiUrl, authToken }) => {
  const [activeTab, setActiveTab] = useState('compare');
  const [brokers, setBrokers] = useState([]);
  const [selectedBrokers, setSelectedBrokers] = useState([]);
  const [recommendations, setRecommendations] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [regionFilter, setRegionFilter] = useState('all');
  const [sortBy, setSortBy] = useState('rating');
  const [sortOrder, setSortOrder] = useState('desc');

  // Cost Calculator
  const [calcParams, setCalcParams] = useState({
    monthly_volume: 100,
    average_lot_size: 1.0,
    primary_pairs: ['EURUSD', 'GBPUSD'],
    account_type: 'standard'
  });
  const [costResults, setCostResults] = useState(null);

  const fetchBrokers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (regionFilter !== 'all') params.append('region', regionFilter);
      params.append('sort_by', sortBy);
      params.append('sort_order', sortOrder);

      const res = await fetch(`${apiUrl}/api/brokers?${params}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (data.success) {
        setBrokers(data.brokers || []);
      }
    } catch (err) {
      setError('Failed to load brokers');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, authToken, regionFilter, sortBy, sortOrder]);

  const fetchRecommendations = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/api/brokers/recommendations`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (data.success) {
        setRecommendations(data);
      }
    } catch (err) {
      console.error('Failed to fetch recommendations:', err);
    }
  }, [apiUrl, authToken]);

  const fetchUserProfile = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/api/brokers/user-profile`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (data.success) {
        setUserProfile(data.profile);
      }
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
    }
  }, [apiUrl, authToken]);

  useEffect(() => {
    fetchBrokers();
    fetchRecommendations();
    fetchUserProfile();
  }, [fetchBrokers, fetchRecommendations, fetchUserProfile]);

  const calculateCosts = async () => {
    if (selectedBrokers.length === 0) {
      setError('Select at least one broker to calculate costs');
      return;
    }

    setCalculating(true);
    setCostResults(null);

    try {
      const results = [];
      for (const brokerId of selectedBrokers) {
        const res = await fetch(`${apiUrl}/api/brokers/${brokerId}/calculate-cost`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(calcParams)
        });
        const data = await res.json();
        if (data.success) {
          results.push({
            broker: brokers.find(b => b.id === brokerId),
            costs: data.costs
          });
        }
      }

      // Sort by total cost
      results.sort((a, b) => a.costs.total_monthly_cost - b.costs.total_monthly_cost);
      setCostResults(results);
    } catch (err) {
      setError('Failed to calculate costs');
      console.error(err);
    } finally {
      setCalculating(false);
    }
  };

  const toggleBrokerSelection = (brokerId) => {
    if (selectedBrokers.includes(brokerId)) {
      setSelectedBrokers(selectedBrokers.filter(id => id !== brokerId));
    } else if (selectedBrokers.length < 5) {
      setSelectedBrokers([...selectedBrokers, brokerId]);
    }
  };

  const filteredBrokers = brokers.filter(broker =>
    broker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    broker.country?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalf = rating - fullStars >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

    return (
      <div className="flex items-center gap-0.5">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={`full-${i}`} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
        ))}
        {hasHalf && <StarHalf className="w-4 h-4 fill-yellow-400 text-yellow-400" />}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={`empty-${i}`} className="w-4 h-4 text-slate-600" />
        ))}
        <span className="ml-1 text-sm text-slate-400">({rating.toFixed(1)})</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <Building2 className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Broker Comparison</h2>
            <p className="text-sm text-slate-400">Find the best broker for your trading style</p>
          </div>
        </div>
        <button
          onClick={fetchBrokers}
          className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 transition-colors"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-700 pb-2">
        {[
          { id: 'compare', label: 'Compare', icon: ArrowUpDown },
          { id: 'calculator', label: 'Cost Calculator', icon: Calculator },
          { id: 'recommendations', label: 'AI Recommendations', icon: Sparkles }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Compare Tab */}
      {activeTab === 'compare' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search brokers..."
                className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Regions</option>
              <option value="US">United States</option>
              <option value="UK">United Kingdom</option>
              <option value="EU">European Union</option>
              <option value="AU">Australia</option>
              <option value="GLOBAL">Global</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="rating">Rating</option>
              <option value="spread">Spread</option>
              <option value="commission">Commission</option>
              <option value="name">Name</option>
            </select>
          </div>

          {/* Selection Info */}
          {selectedBrokers.length > 0 && (
            <div className="flex items-center justify-between p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <span className="text-blue-400">
                {selectedBrokers.length} broker{selectedBrokers.length > 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedBrokers([])}
                  className="px-3 py-1 text-sm text-slate-400 hover:text-white transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={() => {
                    setActiveTab('calculator');
                    calculateCosts();
                  }}
                  className="px-4 py-1 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm transition-colors"
                >
                  Calculate Costs
                </button>
              </div>
            </div>
          )}

          {/* Broker Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBrokers.map((broker) => (
              <BrokerCard
                key={broker.id}
                broker={broker}
                isSelected={selectedBrokers.includes(broker.id)}
                onToggle={() => toggleBrokerSelection(broker.id)}
                renderStars={renderStars}
              />
            ))}
          </div>

          {filteredBrokers.length === 0 && (
            <div className="text-center py-12 bg-slate-800/50 rounded-xl border border-slate-700">
              <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white">No Brokers Found</h3>
              <p className="text-slate-400">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      )}

      {/* Cost Calculator Tab */}
      {activeTab === 'calculator' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calculator Form */}
            <div className="lg:col-span-1 bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-blue-400" />
                Trading Parameters
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Monthly Volume (lots)</label>
                  <input
                    type="number"
                    value={calcParams.monthly_volume}
                    onChange={(e) => setCalcParams({...calcParams, monthly_volume: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-1">Average Lot Size</label>
                  <input
                    type="number"
                    step="0.1"
                    value={calcParams.average_lot_size}
                    onChange={(e) => setCalcParams({...calcParams, average_lot_size: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-1">Account Type</label>
                  <select
                    value={calcParams.account_type}
                    onChange={(e) => setCalcParams({...calcParams, account_type: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="standard">Standard</option>
                    <option value="ecn">ECN</option>
                    <option value="raw_spread">Raw Spread</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-2">Selected Brokers ({selectedBrokers.length}/5)</label>
                  {selectedBrokers.length === 0 ? (
                    <p className="text-sm text-slate-500">Select brokers from the Compare tab</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {selectedBrokers.map(id => {
                        const broker = brokers.find(b => b.id === id);
                        return broker && (
                          <span key={id} className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-lg flex items-center gap-1">
                            {broker.name}
                            <button onClick={() => toggleBrokerSelection(id)}>
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>

                <button
                  onClick={calculateCosts}
                  disabled={selectedBrokers.length === 0 || calculating}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  {calculating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Calculating...
                    </>
                  ) : (
                    <>
                      <Calculator className="w-4 h-4" />
                      Calculate Costs
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Results */}
            <div className="lg:col-span-2">
              {costResults ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Cost Comparison Results</h3>

                  {costResults.map((result, index) => (
                    <div
                      key={result.broker.id}
                      className={`p-4 rounded-xl border ${
                        index === 0
                          ? 'bg-green-500/10 border-green-500/30'
                          : 'bg-slate-800/50 border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {index === 0 && (
                            <div className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full font-semibold">
                              Best Value
                            </div>
                          )}
                          <h4 className="font-semibold text-white">{result.broker.name}</h4>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-white">
                            ${result.costs.total_monthly_cost?.toFixed(2)}
                          </div>
                          <div className="text-sm text-slate-400">per month</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="bg-slate-700/50 p-3 rounded-lg">
                          <div className="text-slate-400 mb-1">Spread Cost</div>
                          <div className="text-white font-semibold">
                            ${result.costs.spread_cost?.toFixed(2)}
                          </div>
                        </div>
                        <div className="bg-slate-700/50 p-3 rounded-lg">
                          <div className="text-slate-400 mb-1">Commission</div>
                          <div className="text-white font-semibold">
                            ${result.costs.commission_cost?.toFixed(2)}
                          </div>
                        </div>
                        <div className="bg-slate-700/50 p-3 rounded-lg">
                          <div className="text-slate-400 mb-1">Per Trade</div>
                          <div className="text-white font-semibold">
                            ${result.costs.cost_per_trade?.toFixed(2)}
                          </div>
                        </div>
                      </div>

                      {index > 0 && costResults[0] && (
                        <div className="mt-3 text-sm text-slate-400">
                          <span className="text-red-400">
                            +${(result.costs.total_monthly_cost - costResults[0].costs.total_monthly_cost).toFixed(2)}
                          </span>
                          {' '}more than {costResults[0].broker.name}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Annual Savings */}
                  {costResults.length > 1 && (
                    <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="w-5 h-5 text-purple-400" />
                        <h4 className="font-semibold text-white">Potential Annual Savings</h4>
                      </div>
                      <p className="text-slate-400">
                        By choosing {costResults[0].broker.name} over {costResults[costResults.length - 1].broker.name},
                        you could save{' '}
                        <span className="text-green-400 font-bold">
                          ${((costResults[costResults.length - 1].costs.total_monthly_cost - costResults[0].costs.total_monthly_cost) * 12).toFixed(2)}
                        </span>
                        {' '}per year.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 bg-slate-800/50 rounded-xl border border-slate-700">
                  <Calculator className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white">Cost Calculator</h3>
                  <p className="text-slate-400 mt-2">
                    Select brokers and configure your trading parameters to compare costs
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI Recommendations Tab */}
      {activeTab === 'recommendations' && (
        <div className="space-y-6">
          {userProfile && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-400" />
                Your Trading Profile
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-slate-400">Style</div>
                  <div className="text-white font-semibold capitalize">{userProfile.trading_style || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-slate-400">Monthly Volume</div>
                  <div className="text-white font-semibold">{userProfile.avg_monthly_trades || 0} trades</div>
                </div>
                <div>
                  <div className="text-slate-400">Primary Pairs</div>
                  <div className="text-white font-semibold">{userProfile.most_traded_pairs?.join(', ') || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-slate-400">Avg Position Size</div>
                  <div className="text-white font-semibold">{userProfile.avg_position_size?.toFixed(2) || 0} lots</div>
                </div>
              </div>
            </div>
          )}

          {recommendations?.recommendations ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendations.recommendations.map((rec, index) => (
                <div
                  key={rec.broker_id}
                  className={`bg-slate-800/50 border rounded-xl p-6 ${
                    index === 0 ? 'border-yellow-500/50' : 'border-slate-700'
                  }`}
                >
                  {index === 0 && (
                    <div className="flex items-center gap-2 mb-3">
                      <Award className="w-5 h-5 text-yellow-400" />
                      <span className="text-yellow-400 font-semibold text-sm">Top Recommendation</span>
                    </div>
                  )}

                  <h4 className="text-lg font-bold text-white mb-2">{rec.broker_name}</h4>

                  <div className="flex items-center gap-2 mb-4">
                    <div className="text-2xl font-bold text-blue-400">{rec.match_score}</div>
                    <div className="text-sm text-slate-400">Match Score</div>
                  </div>

                  <div className="space-y-2 mb-4">
                    {rec.reasons?.map((reason, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                        <span className="text-slate-300">{reason}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      toggleBrokerSelection(rec.broker_id);
                      setActiveTab('compare');
                    }}
                    className="w-full py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg transition-colors text-sm"
                  >
                    View Details
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-slate-800/50 rounded-xl border border-slate-700">
              <Sparkles className="w-12 h-12 text-purple-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white">AI Recommendations</h3>
              <p className="text-slate-400 mt-2">
                Add more trades to get personalized broker recommendations based on your trading style
              </p>
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-96 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <span className="text-red-400 text-sm flex-1">{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

// Broker Card Component
const BrokerCard = ({ broker, isSelected, onToggle, renderStars }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`bg-slate-800/50 border rounded-xl p-4 transition-all cursor-pointer ${
        isSelected ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-700 hover:border-slate-600'
      }`}
      onClick={onToggle}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-semibold text-white flex items-center gap-2">
            {broker.name}
            {broker.is_verified && (
              <Shield className="w-4 h-4 text-green-400" title="Verified" />
            )}
          </h4>
          <div className="flex items-center gap-2 mt-1">
            {renderStars(broker.overall_rating || 4.0)}
          </div>
        </div>
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
          isSelected ? 'border-blue-500 bg-blue-500' : 'border-slate-600'
        }`}>
          {isSelected && <Check className="w-3 h-3 text-white" />}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="bg-slate-700/50 p-2 rounded-lg">
          <div className="text-slate-400 text-xs">Spread (EUR/USD)</div>
          <div className="text-white font-semibold">{broker.spread_eurusd || 'N/A'} pips</div>
        </div>
        <div className="bg-slate-700/50 p-2 rounded-lg">
          <div className="text-slate-400 text-xs">Commission</div>
          <div className="text-white font-semibold">${broker.commission_per_lot || 0}/lot</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-3">
        {broker.regulations && (
          <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
            {broker.regulations}
          </span>
        )}
        {broker.country && (
          <span className="px-2 py-0.5 bg-slate-600 text-slate-300 text-xs rounded-full flex items-center gap-1">
            <Globe className="w-3 h-3" />
            {broker.country}
          </span>
        )}
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          setExpanded(!expanded);
        }}
        className="w-full mt-3 pt-3 border-t border-slate-700 flex items-center justify-center gap-1 text-slate-400 hover:text-white transition-colors text-sm"
      >
        {expanded ? 'Less' : 'More'} Details
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-slate-700 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">Min Deposit</span>
            <span className="text-white">${broker.min_deposit || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Max Leverage</span>
            <span className="text-white">1:{broker.max_leverage || 100}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Platforms</span>
            <span className="text-white">{broker.platforms || 'MT4, MT5'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Execution</span>
            <span className="text-white">{broker.execution_type || 'Market'}</span>
          </div>
          {broker.website && (
            <a
              href={broker.website}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors"
            >
              Visit Website <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}
    </div>
  );
};

export default BrokerComparison;
