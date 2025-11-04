import { useState } from 'react';
import { X, Plus } from 'lucide-react';

const PREDEFINED_TAGS = [
  { name: 'Breakout', color: 'bg-blue-500' },
  { name: 'Reversal', color: 'bg-purple-500' },
  { name: 'Trend Following', color: 'bg-green-500' },
  { name: 'Scalp', color: 'bg-yellow-500' },
  { name: 'Swing', color: 'bg-pink-500' },
  { name: 'News Trade', color: 'bg-red-500' },
  { name: 'Support/Resistance', color: 'bg-indigo-500' },
  { name: 'Fibonacci', color: 'bg-cyan-500' },
  { name: 'Pattern', color: 'bg-orange-500' },
  { name: 'High Probability', color: 'bg-emerald-500' },
  { name: 'Momentum', color: 'bg-violet-500' },
  { name: 'Mean Reversion', color: 'bg-rose-500' }
];

const TagSelector = ({ selectedTags = [], onTagsChange, readonly = false }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [customTag, setCustomTag] = useState('');

  const toggleTag = (tagName) => {
    if (readonly) return;

    if (selectedTags.includes(tagName)) {
      onTagsChange(selectedTags.filter(t => t !== tagName));
    } else {
      onTagsChange([...selectedTags, tagName]);
    }
  };

  const addCustomTag = () => {
    if (customTag.trim() && !selectedTags.includes(customTag.trim())) {
      onTagsChange([...selectedTags, customTag.trim()]);
      setCustomTag('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCustomTag();
    }
  };

  const getTagColor = (tagName) => {
    const predefined = PREDEFINED_TAGS.find(t => t.name === tagName);
    return predefined ? predefined.color : 'bg-slate-500';
  };

  return (
    <div className="space-y-2">
      {/* Selected Tags Display */}
      <div className="flex flex-wrap gap-2">
        {selectedTags.map((tag) => (
          <span
            key={tag}
            className={`${getTagColor(tag)} text-white px-3 py-1 rounded-full text-sm flex items-center gap-1 shadow-sm`}
          >
            {tag}
            {!readonly && (
              <button
                type="button"
                onClick={() => toggleTag(tag)}
                className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </span>
        ))}

        {selectedTags.length === 0 && (
          <span className="text-slate-500 text-sm italic">No tags selected</span>
        )}
      </div>

      {/* Tag Selector */}
      {!readonly && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowDropdown(!showDropdown)}
            className="px-4 py-2 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg text-slate-300 text-sm transition-all flex items-center gap-2"
          >
            <Plus size={16} />
            Add Tag
          </button>

          {showDropdown && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowDropdown(false)}
              ></div>

              {/* Dropdown */}
              <div className="absolute z-20 mt-2 w-80 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-4 space-y-4">
                {/* Custom Tag Input */}
                <div className="space-y-2">
                  <label className="text-slate-300 text-sm font-medium">Custom Tag</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customTag}
                      onChange={(e) => setCustomTag(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Enter custom tag..."
                      className="flex-1 px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <button
                      type="button"
                      onClick={addCustomTag}
                      disabled={!customTag.trim()}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Predefined Tags */}
                <div className="space-y-2">
                  <label className="text-slate-300 text-sm font-medium">Predefined Tags</label>
                  <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                    {PREDEFINED_TAGS.map((tag) => (
                      <button
                        key={tag.name}
                        type="button"
                        onClick={() => toggleTag(tag.name)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          selectedTags.includes(tag.name)
                            ? `${tag.color} text-white shadow-lg scale-105`
                            : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default TagSelector;
