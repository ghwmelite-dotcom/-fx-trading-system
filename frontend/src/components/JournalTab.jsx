import { useState, useMemo, useEffect } from 'react';
import { Search, SlidersHorizontal, X, Calendar, DollarSign, Save, Upload, Image as ImageIcon, BookOpen, TrendingUp, ChevronLeft, ChevronRight, Star as StarIcon, Tag as TagIcon, Smile as SmileIcon } from 'lucide-react';
import StarRating from './StarRating';
import TagSelector from './TagSelector';
import EmotionSelector from './EmotionSelector';

const JournalTab = ({ trades, onUpdate, apiUrl }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    pair: '',
    minPnl: '',
    maxPnl: '',
    hasNotes: false,
    hasRating: false
  });
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [journalData, setJournalData] = useState({});
  const [saving, setSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [activeSection, setActiveSection] = useState('ratings'); // ratings, tags, notes

  // Safe JSON parsing helper
  const safeJsonParse = (jsonString, fallback = []) => {
    if (!jsonString) return fallback;
    try {
      const parsed = JSON.parse(jsonString);
      return Array.isArray(parsed) ? parsed : fallback;
    } catch (e) {
      console.warn('Failed to parse JSON:', jsonString, e);
      return fallback;
    }
  };

  // Filter and search trades
  const filteredTrades = useMemo(() => {
    return trades.filter(trade => {
      if (searchTerm && !trade.pair.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      if (filters.dateFrom && trade.date < filters.dateFrom) return false;
      if (filters.dateTo && trade.date > filters.dateTo) return false;
      if (filters.pair && !trade.pair.toLowerCase().includes(filters.pair.toLowerCase())) {
        return false;
      }

      const pnl = parseFloat(trade.pnl || 0);
      if (filters.minPnl !== '' && pnl < parseFloat(filters.minPnl)) return false;
      if (filters.maxPnl !== '' && pnl > parseFloat(filters.maxPnl)) return false;

      if (filters.hasNotes && !trade.notes) return false;
      if (filters.hasRating && !trade.rating) return false;

      return true;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [trades, searchTerm, filters]);

  // Pagination
  const totalPages = Math.ceil(filteredTrades.length / itemsPerPage);
  const paginatedTrades = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTrades.slice(start, start + itemsPerPage);
  }, [filteredTrades, currentPage, itemsPerPage]);

  const selectTrade = (trade) => {
    setSelectedTrade(trade);
    setJournalData({
      notes: trade.notes || '',
      tags: Array.isArray(trade.tags) ? trade.tags : safeJsonParse(trade.tags, []),
      rating: trade.rating || 0,
      setupQuality: trade.setupQuality || 0,
      executionQuality: trade.executionQuality || 0,
      emotions: Array.isArray(trade.emotions) ? trade.emotions : safeJsonParse(trade.emotions, []),
      lessonsLearned: trade.lessonsLearned || '',
      screenshotUrl: trade.screenshotUrl || ''
    });
  };

  // Update selected trade when trades prop changes (e.g., after save)
  useEffect(() => {
    if (selectedTrade) {
      const updatedTrade = trades.find(t => t.id === selectedTrade.id);
      if (updatedTrade) {
        setSelectedTrade(updatedTrade);
        setJournalData({
          notes: updatedTrade.notes || '',
          tags: Array.isArray(updatedTrade.tags) ? updatedTrade.tags : safeJsonParse(updatedTrade.tags, []),
          rating: updatedTrade.rating || 0,
          setupQuality: updatedTrade.setupQuality || 0,
          executionQuality: updatedTrade.executionQuality || 0,
          emotions: Array.isArray(updatedTrade.emotions) ? updatedTrade.emotions : safeJsonParse(updatedTrade.emotions, []),
          lessonsLearned: updatedTrade.lessonsLearned || '',
          screenshotUrl: updatedTrade.screenshotUrl || ''
        });
      }
    }
  }, [trades]);

  const saveJournal = async () => {
    if (!selectedTrade) return;

    setSaving(true);
    try {
      const payload = {
        notes: journalData.notes,
        tags: journalData.tags || [],
        rating: journalData.rating,
        setupQuality: journalData.setupQuality,
        executionQuality: journalData.executionQuality,
        emotions: journalData.emotions || [],
        lessonsLearned: journalData.lessonsLearned,
        screenshotUrl: journalData.screenshotUrl
      };

      await onUpdate(selectedTrade.id, payload);
      // Note: selectedTrade and journalData will be updated by useEffect when trades prop changes
    } catch (error) {
      console.error('Failed to save journal:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleScreenshotUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${apiUrl}/api/upload/screenshot`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const data = await response.json();
      if (data.success) {
        setJournalData({ ...journalData, screenshotUrl: data.url });
      }
    } catch (error) {
      console.error('Screenshot upload failed:', error);
    }
  };

  const clearFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      pair: '',
      minPnl: '',
      maxPnl: '',
      hasNotes: false,
      hasRating: false
    });
    setSearchTerm('');
  };

  const hasActiveFilters = () => {
    return filters.dateFrom || filters.dateTo || filters.pair ||
           filters.minPnl !== '' || filters.maxPnl !== '' ||
           filters.hasNotes || filters.hasRating || searchTerm;
  };

  const activeFilterCount = () => {
    let count = 0;
    if (filters.dateFrom) count++;
    if (filters.dateTo) count++;
    if (filters.pair) count++;
    if (filters.minPnl !== '') count++;
    if (filters.maxPnl !== '') count++;
    if (filters.hasNotes) count++;
    if (filters.hasRating) count++;
    if (searchTerm) count++;
    return count;
  };

  // Auto-select first trade when page loads or filters change
  useMemo(() => {
    if (paginatedTrades.length > 0 && !selectedTrade) {
      selectTrade(paginatedTrades[0]);
    }
  }, [paginatedTrades]);

  const isProfitable = selectedTrade && parseFloat(selectedTrade.pnl || 0) > 0;

  return (
    <div className="space-y-4">
      {/* Header with Search & Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg">
            <BookOpen size={24} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Trade Journal</h2>
            <p className="text-slate-400">{filteredTrades.length} trades</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search..."
              className="pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 w-48"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
              showFilters ? 'bg-purple-600 text-white' : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <SlidersHorizontal size={18} />
            {activeFilterCount() > 0 && (
              <span className="bg-white text-purple-600 px-2 py-0.5 rounded-full text-xs font-bold">
                {activeFilterCount()}
              </span>
            )}
          </button>

          {hasActiveFilters() && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-all flex items-center gap-2"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              placeholder="From"
              className="px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              placeholder="To"
              className="px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <input
              type="number"
              value={filters.minPnl}
              onChange={(e) => setFilters({ ...filters, minPnl: e.target.value })}
              placeholder="Min P&L"
              className="px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <input
              type="number"
              value={filters.maxPnl}
              onChange={(e) => setFilters({ ...filters, maxPnl: e.target.value })}
              placeholder="Max P&L"
              className="px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="flex items-center gap-4 mt-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.hasNotes}
                onChange={(e) => setFilters({ ...filters, hasNotes: e.target.checked })}
                className="w-4 h-4 text-purple-600 bg-slate-900 border-slate-600 rounded focus:ring-purple-500"
              />
              <span className="text-slate-300 text-sm">Has Notes</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.hasRating}
                onChange={(e) => setFilters({ ...filters, hasRating: e.target.checked })}
                className="w-4 h-4 text-purple-600 bg-slate-900 border-slate-600 rounded focus:ring-purple-500"
              />
              <span className="text-slate-300 text-sm">Has Rating</span>
            </label>
          </div>
        </div>
      )}

      {/* Main Content: Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Trade List */}
        <div className="lg:col-span-1 space-y-2">
          <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-2 max-h-[600px] overflow-y-auto">
            {paginatedTrades.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="mx-auto mb-3 text-slate-600" size={32} />
                <p className="text-slate-400 text-sm">No trades found</p>
              </div>
            ) : (
              paginatedTrades.map((trade) => {
                const pnl = parseFloat(trade.pnl || 0);
                const isSelected = selectedTrade?.id === trade.id;
                const hasJournal = trade.notes || trade.rating || trade.tags || trade.emotions;

                return (
                  <button
                    key={trade.id}
                    onClick={() => selectTrade(trade)}
                    className={`w-full text-left p-3 rounded-lg transition-all mb-2 ${
                      isSelected
                        ? 'bg-purple-600/20 border-2 border-purple-500'
                        : 'bg-slate-800/50 border border-slate-700 hover:bg-slate-700/50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-bold">{trade.pair}</span>
                          {hasJournal && (
                            <div className="w-2 h-2 bg-green-400 rounded-full" title="Has journal entry"></div>
                          )}
                        </div>
                        <span className="text-slate-400 text-xs">
                          {new Date(trade.date).toLocaleDateString()}
                        </span>
                      </div>
                      <span className={`text-sm font-bold ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        trade.type === 'Buy' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {trade.type}
                      </span>
                      {trade.rating && (
                        <div className="flex items-center gap-1">
                          <StarIcon size={12} className="fill-yellow-400 text-yellow-400" />
                          <span className="text-xs text-slate-400">{trade.rating}/5</span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-slate-800/30 border border-slate-700 rounded-lg p-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-2 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-slate-400 text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-2 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>

        {/* Right: Journal Entry */}
        <div className="lg:col-span-2">
          {selectedTrade ? (
            <div className="bg-slate-800/30 border border-slate-700 rounded-xl overflow-visible">
              {/* Trade Header */}
              <div className="p-4 border-b border-slate-700">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isProfitable ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                      <TrendingUp size={20} className={isProfitable ? 'text-green-400' : 'text-red-400'} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{selectedTrade.pair}</h3>
                      <div className="flex items-center gap-3 text-sm text-slate-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          {new Date(selectedTrade.date).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign size={14} />
                          <span className={`font-medium ${isProfitable ? 'text-green-400' : 'text-red-400'}`}>
                            {parseFloat(selectedTrade.pnl || 0) >= 0 ? '+' : ''}{parseFloat(selectedTrade.pnl || 0).toFixed(2)}
                          </span>
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          selectedTrade.type === 'Buy' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {selectedTrade.type}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={saveJournal}
                    disabled={saving}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        Save
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Section Tabs */}
              <div className="flex border-b border-slate-700">
                <button
                  onClick={() => setActiveSection('ratings')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                    activeSection === 'ratings'
                      ? 'text-purple-400 border-b-2 border-purple-400 bg-purple-500/10'
                      : 'text-slate-400 hover:text-slate-300'
                  }`}
                >
                  <StarIcon size={16} />
                  Ratings
                </button>
                <button
                  onClick={() => setActiveSection('tags')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                    activeSection === 'tags'
                      ? 'text-purple-400 border-b-2 border-purple-400 bg-purple-500/10'
                      : 'text-slate-400 hover:text-slate-300'
                  }`}
                >
                  <TagIcon size={16} />
                  Tags & Emotions
                </button>
                <button
                  onClick={() => setActiveSection('notes')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                    activeSection === 'notes'
                      ? 'text-purple-400 border-b-2 border-purple-400 bg-purple-500/10'
                      : 'text-slate-400 hover:text-slate-300'
                  }`}
                >
                  <BookOpen size={16} />
                  Notes
                </button>
              </div>

              {/* Section Content */}
              <div className="p-6">
                {/* Ratings Section */}
                {activeSection === 'ratings' && (
                  <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2">
                    <div>
                      <label className="block text-slate-300 text-sm font-medium mb-3">Overall Rating</label>
                      <StarRating
                        rating={journalData.rating || 0}
                        onRatingChange={(value) => setJournalData({ ...journalData, rating: value })}
                        size={28}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-slate-300 text-sm font-medium mb-3">Setup Quality</label>
                        <StarRating
                          rating={journalData.setupQuality || 0}
                          onRatingChange={(value) => setJournalData({ ...journalData, setupQuality: value })}
                          size={24}
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 text-sm font-medium mb-3">Execution Quality</label>
                        <StarRating
                          rating={journalData.executionQuality || 0}
                          onRatingChange={(value) => setJournalData({ ...journalData, executionQuality: value })}
                          size={24}
                        />
                      </div>
                    </div>

                    {/* Screenshot Upload */}
                    <div>
                      <label className="block text-slate-300 text-sm font-medium mb-3">Trade Screenshot</label>
                      <label className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg cursor-pointer transition-colors flex items-center gap-2 w-fit">
                        <Upload size={16} />
                        Upload Screenshot
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleScreenshotUpload}
                          className="hidden"
                        />
                      </label>
                      {journalData.screenshotUrl && (
                        <div className="mt-2 flex items-center gap-2 text-green-400 text-sm">
                          <ImageIcon size={14} />
                          Screenshot uploaded
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Tags & Emotions Section */}
                {activeSection === 'tags' && (
                  <div className="space-y-6 min-h-[500px]">
                    <div>
                      <label className="block text-slate-300 text-sm font-medium mb-3">Strategy Tags</label>
                      <TagSelector
                        selectedTags={journalData.tags || []}
                        onTagsChange={(tags) => setJournalData({ ...journalData, tags })}
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 text-sm font-medium mb-3">Trading Emotions</label>
                      <EmotionSelector
                        selectedEmotions={journalData.emotions || []}
                        onEmotionsChange={(emotions) => setJournalData({ ...journalData, emotions })}
                      />
                    </div>
                  </div>
                )}

                {/* Notes Section */}
                {activeSection === 'notes' && (
                  <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2">
                    <div>
                      <label className="block text-slate-300 text-sm font-medium mb-3">Trade Notes</label>
                      <textarea
                        value={journalData.notes || ''}
                        onChange={(e) => setJournalData({ ...journalData, notes: e.target.value })}
                        placeholder="What happened during this trade? What was your thought process?"
                        rows={6}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 text-sm font-medium mb-3">Lessons Learned</label>
                      <textarea
                        value={journalData.lessonsLearned || ''}
                        onChange={(e) => setJournalData({ ...journalData, lessonsLearned: e.target.value })}
                        placeholder="What did you learn from this trade? What would you do differently?"
                        rows={6}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-12 text-center">
              <BookOpen className="mx-auto mb-4 text-slate-600" size={48} />
              <p className="text-slate-400 text-lg">Select a trade to view or edit journal</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JournalTab;
