import { useState, useEffect } from 'react';

/**
 * Custom hook to animate number counting
 * @param {number} end - Target number
 * @param {number} duration - Animation duration in ms
 * @param {number} start - Starting number
 * @returns {number} Current animated value
 */
export const useAnimatedNumber = (end, duration = 2000, start = 0) => {
  const [value, setValue] = useState(start);

  useEffect(() => {
    let startTime;
    let animationFrame;

    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);

      // Easing function (easeOutExpo)
      const easeOut = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

      setValue(start + (end - start) * easeOut);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [end, duration, start]);

  return value;
};
