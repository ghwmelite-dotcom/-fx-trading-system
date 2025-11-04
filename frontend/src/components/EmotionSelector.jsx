import { useState } from 'react';
import { X, Smile } from 'lucide-react';

const EMOTIONS = [
  { name: 'Confident', emoji: '😎', color: 'bg-green-500' },
  { name: 'Anxious', emoji: '😰', color: 'bg-yellow-500' },
  { name: 'FOMO', emoji: '😱', color: 'bg-orange-500' },
  { name: 'Patient', emoji: '😌', color: 'bg-blue-500' },
  { name: 'Greedy', emoji: '🤑', color: 'bg-red-500' },
  { name: 'Disciplined', emoji: '🎯', color: 'bg-purple-500' },
  { name: 'Excited', emoji: '🚀', color: 'bg-pink-500' },
  { name: 'Fearful', emoji: '😨', color: 'bg-amber-500' },
  { name: 'Calm', emoji: '😊', color: 'bg-cyan-500' },
  { name: 'Frustrated', emoji: '😤', color: 'bg-rose-500' },
  { name: 'Overconfident', emoji: '😏', color: 'bg-red-600' },
  { name: 'Focused', emoji: '🧐', color: 'bg-indigo-500' },
  { name: 'Doubtful', emoji: '🤔', color: 'bg-slate-500' },
  { name: 'Hopeful', emoji: '🤞', color: 'bg-emerald-500' },
  { name: 'Revenge Trading', emoji: '😡', color: 'bg-red-700' },
  { name: 'Zen', emoji: '🧘', color: 'bg-teal-500' }
];

const EmotionSelector = ({ selectedEmotions = [], onEmotionsChange, readonly = false }) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const toggleEmotion = (emotionName) => {
    if (readonly) return;

    if (selectedEmotions.includes(emotionName)) {
      onEmotionsChange(selectedEmotions.filter(e => e !== emotionName));
    } else {
      onEmotionsChange([...selectedEmotions, emotionName]);
    }
  };

  const getEmotion = (emotionName) => {
    return EMOTIONS.find(e => e.name === emotionName) || { emoji: '💭', color: 'bg-slate-500' };
  };

  return (
    <div className="space-y-2">
      {/* Selected Emotions Display */}
      <div className="flex flex-wrap gap-2">
        {selectedEmotions.map((emotion) => {
          const emotionData = getEmotion(emotion);
          return (
            <span
              key={emotion}
              className={`${emotionData.color} text-white px-3 py-1 rounded-full text-sm flex items-center gap-1.5 shadow-sm`}
            >
              <span>{emotionData.emoji}</span>
              <span>{emotion}</span>
              {!readonly && (
                <button
                  type="button"
                  onClick={() => toggleEmotion(emotion)}
                  className="hover:bg-white/20 rounded-full p-0.5 transition-colors ml-1"
                >
                  <X size={14} />
                </button>
              )}
            </span>
          );
        })}

        {selectedEmotions.length === 0 && (
          <span className="text-slate-500 text-sm italic">No emotions selected</span>
        )}
      </div>

      {/* Emotion Selector */}
      {!readonly && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowDropdown(!showDropdown)}
            className="px-4 py-2 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg text-slate-300 text-sm transition-all flex items-center gap-2"
          >
            <Smile size={16} />
            Add Emotion
          </button>

          {showDropdown && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowDropdown(false)}
              ></div>

              {/* Dropdown */}
              <div className="absolute z-20 mt-2 w-80 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-4 space-y-2">
                <label className="text-slate-300 text-sm font-medium">How did you feel during this trade?</label>
                <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto">
                  {EMOTIONS.map((emotion) => (
                    <button
                      key={emotion.name}
                      type="button"
                      onClick={() => toggleEmotion(emotion.name)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                        selectedEmotions.includes(emotion.name)
                          ? `${emotion.color} text-white shadow-lg scale-105`
                          : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      <span className="text-lg">{emotion.emoji}</span>
                      <span>{emotion.name}</span>
                    </button>
                  ))}
                </div>

                {/* Emotion Analysis Tip */}
                <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <p className="text-blue-300 text-xs">
                    💡 Tip: Tracking emotions helps identify patterns in your trading psychology
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default EmotionSelector;
