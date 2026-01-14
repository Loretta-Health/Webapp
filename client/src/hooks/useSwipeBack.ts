import { useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'wouter';

interface SwipeBackOptions {
  backPath?: string;
  threshold?: number;
  edgeWidth?: number;
  enabled?: boolean;
}

export function useSwipeBack({
  backPath = '/my-dashboard',
  threshold = 80,
  edgeWidth = 50,
  enabled = true
}: SwipeBackOptions = {}) {
  const [, navigate] = useLocation();
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const isSwiping = useRef(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled) return;
    
    const touch = e.touches[0];
    if (touch.clientX <= edgeWidth) {
      touchStartX.current = touch.clientX;
      touchStartY.current = touch.clientY;
      isSwiping.current = true;
    }
  }, [edgeWidth, enabled]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isSwiping.current || touchStartX.current === null || touchStartY.current === null) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartX.current;
    const deltaY = Math.abs(touch.clientY - touchStartY.current);
    
    if (deltaY > deltaX) {
      isSwiping.current = false;
      touchStartX.current = null;
      touchStartY.current = null;
    }
  }, []);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!isSwiping.current || touchStartX.current === null) {
      touchStartX.current = null;
      touchStartY.current = null;
      isSwiping.current = false;
      return;
    }
    
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartX.current;
    
    if (deltaX >= threshold) {
      navigate(backPath);
    }
    
    touchStartX.current = null;
    touchStartY.current = null;
    isSwiping.current = false;
  }, [threshold, backPath, navigate]);

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, enabled]);
}
