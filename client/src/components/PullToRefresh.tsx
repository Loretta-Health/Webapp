import { useState, useRef, useCallback, useEffect, type ReactNode } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { Loader2, ArrowDown } from 'lucide-react';

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  className?: string;
  disabled?: boolean;
}

const PULL_THRESHOLD = 80;
const MAX_PULL = 120;

export function PullToRefresh({ 
  children, 
  onRefresh, 
  className = '',
  disabled = false 
}: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const pullDistance = useMotionValue(0);
  const hasTriggeredHaptic = useRef(false);
  
  const indicatorOpacity = useTransform(pullDistance, [0, PULL_THRESHOLD / 2, PULL_THRESHOLD], [0, 0.5, 1]);
  const indicatorScale = useTransform(pullDistance, [0, PULL_THRESHOLD], [0.5, 1]);
  const indicatorRotation = useTransform(pullDistance, [0, PULL_THRESHOLD], [0, 180]);
  
  const triggerHaptic = useCallback(() => {
    try {
      if ('vibrate' in navigator) {
        navigator.vibrate(10);
      }
    } catch (e) {
    }
  }, []);
  
  const resetPullState = useCallback(() => {
    setIsPulling(false);
    animate(pullDistance, 0, { duration: 0.2 });
    hasTriggeredHaptic.current = false;
  }, [pullDistance]);
  
  const getScrollTop = useCallback(() => {
    const container = containerRef.current;
    if (!container) return 0;
    
    if (container.scrollTop !== undefined && container.scrollTop !== 0) {
      return container.scrollTop;
    }
    
    return window.scrollY || document.documentElement.scrollTop || 0;
  }, []);
  
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (disabled || isRefreshing) return;
    
    const scrollTop = getScrollTop();
    if (scrollTop <= 5) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
      hasTriggeredHaptic.current = false;
    }
  }, [disabled, isRefreshing, getScrollTop]);
  
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPulling || disabled || isRefreshing) return;
    
    const scrollTop = getScrollTop();
    if (scrollTop > 5) {
      resetPullState();
      return;
    }
    
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    
    if (diff > 10) {
      e.preventDefault();
      const dampedDiff = Math.min(diff * 0.5, MAX_PULL);
      pullDistance.set(dampedDiff);
      
      if (dampedDiff >= PULL_THRESHOLD && !hasTriggeredHaptic.current) {
        hasTriggeredHaptic.current = true;
        triggerHaptic();
      }
    }
  }, [isPulling, disabled, isRefreshing, pullDistance, triggerHaptic, getScrollTop, resetPullState]);
  
  const handleTouchEnd = useCallback(async () => {
    if (!isPulling || disabled) return;
    
    setIsPulling(false);
    const currentPull = pullDistance.get();
    
    if (currentPull >= PULL_THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      animate(pullDistance, 60, { duration: 0.2 });
      
      try {
        await onRefresh();
      } finally {
        await animate(pullDistance, 0, { duration: 0.3 });
        setIsRefreshing(false);
      }
    } else {
      animate(pullDistance, 0, { duration: 0.2 });
    }
  }, [isPulling, disabled, isRefreshing, pullDistance, onRefresh]);
  
  const handleTouchCancel = useCallback(() => {
    resetPullState();
  }, [resetPullState]);
  
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const options: AddEventListenerOptions = { passive: false };
    
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, options);
    container.addEventListener('touchend', handleTouchEnd, { passive: true });
    container.addEventListener('touchcancel', handleTouchCancel, { passive: true });
    
    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, handleTouchCancel]);
  
  const contentY = useTransform(pullDistance, (v) => v);
  
  return (
    <div className={`relative overflow-hidden ${className}`} style={{ touchAction: 'pan-y pan-x' }}>
      <motion.div
        className="absolute left-1/2 -translate-x-1/2 z-10 flex items-center justify-center pointer-events-none"
        style={{ 
          top: useTransform(pullDistance, (v) => Math.max(-40, v - 50)),
          opacity: indicatorOpacity,
          scale: indicatorScale,
        }}
      >
        <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 shadow-lg flex items-center justify-center border border-gray-200 dark:border-gray-700">
          {isRefreshing ? (
            <Loader2 className="w-5 h-5 text-[#013DC4] animate-spin" />
          ) : (
            <motion.div style={{ rotate: indicatorRotation }}>
              <ArrowDown className="w-5 h-5 text-[#013DC4]" />
            </motion.div>
          )}
        </div>
      </motion.div>
      
      <motion.div
        ref={containerRef}
        className="h-full overflow-y-auto"
        style={{ y: contentY }}
      >
        {children}
      </motion.div>
    </div>
  );
}

export default PullToRefresh;
