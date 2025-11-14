import { useState, useEffect } from 'react';

/**
 * Custom hook to detect exit intent (mouse leaving viewport at top)
 * @param {boolean} enabled - Whether to detect exit intent
 * @returns {boolean} Whether exit intent was detected
 */
export const useExitIntent = (enabled = true) => {
  const [showExitIntent, setShowExitIntent] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    // Check if already shown in this session
    const hasShown = sessionStorage.getItem('exitIntentShown');
    if (hasShown) return;

    const handleMouseLeave = (e) => {
      // Detect mouse leaving from top of viewport
      if (e.clientY <= 0 && !hasShown) {
        setShowExitIntent(true);
        sessionStorage.setItem('exitIntentShown', 'true');
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [enabled]);

  return showExitIntent;
};
