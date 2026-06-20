import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for detecting touch gestures
 * Supports swipe left/right for navigation and pinch-to-zoom
 */
export const useTouchGestures = ({
  onSwipeLeft,
  onSwipeRight,
  onPinchIn,
  onPinchOut,
  minSwipeDistance = 50,
  maxPinchDistance = 100,
  enabled = true
}) => {
  const touchStartRef = useRef({ x: 0, y: 0, timestamp: 0 });
  const initialPinchDistanceRef = useRef(0);
  const [isGesturing, setIsGesturing] = useState(false);

  // Calculate distance between two touch points
  const getDistance = useCallback((touch1, touch2) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  // Handle touch start
  const handleTouchStart = useCallback((e) => {
    if (!enabled) return;
    
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now()
    };

    // Detect multi-touch for pinch gesture
    if (e.touches.length === 2) {
      initialPinchDistanceRef.current = getDistance(e.touches[0], e.touches[1]);
      setIsGesturing(true);
    } else {
      setIsGesturing(true);
    }
  }, [enabled, getDistance]);

  // Handle touch move
  const handleTouchMove = useCallback((e) => {
    if (!enabled || !isGesturing) return;
    
    // Handle pinch gesture
    if (e.touches.length === 2) {
      const currentDistance = getDistance(e.touches[0], e.touches[1]);
      const delta = currentDistance - initialPinchDistanceRef.current;
      
      if (delta > maxPinchDistance && onPinchOut) {
        onPinchOut();
        initialPinchDistanceRef.current = currentDistance;
      } else if (delta < -maxPinchDistance && onPinchIn) {
        onPinchIn();
        initialPinchDistanceRef.current = currentDistance;
      }
    }
  }, [enabled, isGesturing, getDistance, maxPinchDistance, onPinchIn, onPinchOut]);

  // Handle touch end
  const handleTouchEnd = useCallback((e) => {
    if (!enabled) return;
    
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const timeDelta = Date.now() - touchStartRef.current.timestamp;
    
    // Only handle swipe if it was a quick gesture (less than 300ms)
    const isQuickSwipe = timeDelta < 300;
    
    // Check if horizontal swipe distance exceeds threshold
    if (Math.abs(deltaX) > minSwipeDistance && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (isQuickSwipe) {
        if (deltaX > 0 && onSwipeRight) {
          // Swipe right = go to previous step
          onSwipeRight();
        } else if (deltaX < 0 && onSwipeLeft) {
          // Swipe left = go to next step
          onSwipeLeft();
        }
      }
    }
    
    setIsGesturing(false);
  }, [enabled, minSwipeDistance, onSwipeLeft, onSwipeRight]);

  // Add event listeners
  useEffect(() => {
    if (!enabled) return;

    // We use passive listeners for better performance
    const options = { passive: true };

    window.addEventListener('touchstart', handleTouchStart, options);
    window.addEventListener('touchmove', handleTouchMove, options);
    window.addEventListener('touchend', handleTouchEnd, options);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    isGesturing,
    // Expose handler for attaching to specific container
    containerProps: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    }
  };
};

/**
 * Hook for detecting device type
 */
export const useDeviceType = () => {
  const [deviceType, setDeviceType] = useState('desktop');
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800
  });

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      setScreenSize({ width, height: window.innerHeight });
      
      if (width < 640) {
        setDeviceType('mobile');
      } else if (width < 1024) {
        setDeviceType('tablet');
      } else {
        setDeviceType('desktop');
      }
    };

    // Initial check
    checkDevice();

    // Listen for resize
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  return { deviceType, screenSize, isMobile: deviceType === 'mobile', isTablet: deviceType === 'tablet' };
};

/**
 * Hook for double-tap detection
 */
export const useDoubleTap = ({ onDoubleTap, onSingleTap, maxDelay = 300 }) => {
  const lastTapRef = useRef(0);

  const handleTap = useCallback(() => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapRef.current;

    if (timeSinceLastTap < maxDelay && timeSinceLastTap > 0) {
      // Double tap detected
      if (onDoubleTap) onDoubleTap();
      lastTapRef.current = 0;
    } else {
      // Potential single tap
      lastTapRef.current = now;
      if (onSingleTap) {
        setTimeout(() => {
          if (lastTapRef.current !== 0) {
            onSingleTap();
            lastTapRef.current = 0;
          }
        }, maxDelay);
      }
    }
  }, [maxDelay, onDoubleTap, onSingleTap]);

  return { handleTap };
};
