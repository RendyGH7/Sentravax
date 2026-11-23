import React, { useEffect, useRef, useState } from 'react';

export interface AnimatedCounterProps {
  end: number;
  start?: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  decimals?: number;
}

/**
 * AnimatedCounter Component
 * Animates a number sequentially from `start` (default 0) to `end`
 * using ease-out interpolation and IntersectionObserver triggering.
 */
export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  end,
  start = 0,
  duration = 1800,
  prefix = '',
  suffix = '',
  className = '',
  decimals = 0,
}) => {
  const [current, setCurrent] = useState<number>(() =>
    typeof IntersectionObserver === 'undefined' ? end : start
  );
  const elementRef = useRef<HTMLSpanElement | null>(null);
  const hasAnimatedRef = useRef<boolean>(false);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    // Fallback if IntersectionObserver is not available
    if (typeof IntersectionObserver === 'undefined') {
      return;
    }

    let timerId: ReturnType<typeof setInterval> | null = null;
    let frameId: number | null = null;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimatedRef.current) {
          hasAnimatedRef.current = true;
          observer.disconnect();

          const totalDiff = end - start;
          if (totalDiff === 0) {
            setCurrent(end);
            return;
          }

          // For small targets (<= 10), step sequentially with deliberate rhythm
          if (totalDiff <= 10 && totalDiff > 0) {
            const stepDuration = Math.max(Math.floor(duration / totalDiff), 280);
            let val = start;
            timerId = setInterval(() => {
              val += 1;
              setCurrent(val);
              if (val >= end) {
                if (timerId !== null) clearInterval(timerId);
              }
            }, stepDuration);
            return;
          }

          // For larger targets, use smooth 60fps requestAnimationFrame with ease-out cubic
          let startTimestamp: number | null = null;

          const step = (now: number) => {
            if (!startTimestamp) startTimestamp = now;
            const elapsed = now - startTimestamp;
            const progress = Math.min(elapsed / duration, 1);
            // Ease-out cubic: decelerates smoothly as it nears target
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const nextVal = start + totalDiff * easeOut;

            setCurrent(nextVal);

            if (progress < 1) {
              frameId = requestAnimationFrame(step);
            } else {
              setCurrent(end);
            }
          };

          frameId = requestAnimationFrame(step);
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
      if (timerId !== null) clearInterval(timerId);
      if (frameId !== null) cancelAnimationFrame(frameId);
    };
  }, [end, start, duration]);

  const formattedValue =
    decimals > 0
      ? current.toFixed(decimals)
      : Math.round(current).toLocaleString('id-ID');

  return (
    <span ref={elementRef} className={className}>
      {prefix}
      {formattedValue}
      {suffix}
    </span>
  );
};
