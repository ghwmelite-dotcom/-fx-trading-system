import { useState, useEffect } from 'react';

/**
 * Custom hook to track mouse position for parallax effects
 * @param {boolean} enabled - Whether to track mouse position
 * @returns {{ x: number, y: number }} Mouse coordinates
 */
export const useMousePosition = (enabled = true) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!enabled) return;

    const handleMouseMove = (event) => {
      setMousePosition({
        x: event.clientX,
        y: event.clientY
      });
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [enabled]);

  return mousePosition;
};
