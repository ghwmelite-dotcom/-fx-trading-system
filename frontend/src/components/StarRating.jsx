import { Star } from 'lucide-react';
import { useState } from 'react';

const StarRating = ({ rating = 0, onRatingChange, readonly = false, label = '', size = 20 }) => {
  const [hoverRating, setHoverRating] = useState(0);

  const handleClick = (value) => {
    if (!readonly && onRatingChange) {
      onRatingChange(value);
    }
  };

  const handleMouseEnter = (value) => {
    if (!readonly) {
      setHoverRating(value);
    }
  };

  const handleMouseLeave = () => {
    if (!readonly) {
      setHoverRating(0);
    }
  };

  const displayRating = hoverRating || rating;

  return (
    <div className="flex items-center gap-2">
      {label && <span className="text-slate-300 text-sm">{label}</span>}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => handleClick(value)}
            onMouseEnter={() => handleMouseEnter(value)}
            onMouseLeave={handleMouseLeave}
            disabled={readonly}
            className={`transition-all ${
              readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
            }`}
            title={`${value} star${value !== 1 ? 's' : ''}`}
          >
            <Star
              size={size}
              className={`transition-colors ${
                value <= displayRating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'fill-slate-700 text-slate-600'
              }`}
            />
          </button>
        ))}
      </div>
      {rating > 0 && (
        <span className="text-slate-400 text-sm ml-1">
          {rating}/5
        </span>
      )}
    </div>
  );
};

export default StarRating;
