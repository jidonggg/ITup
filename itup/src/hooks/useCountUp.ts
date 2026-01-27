"use client";

import { useEffect, useState } from "react";

interface UseCountUpOptions {
  start?: number;
  end: number;
  duration?: number;
  delay?: number;
  startOnMount?: boolean;
}

export function useCountUp({
  start = 0,
  end,
  duration = 2000,
  delay = 0,
  startOnMount = false,
}: UseCountUpOptions) {
  const [count, setCount] = useState(start);
  const [isRunning, setIsRunning] = useState(false);

  const startCounting = () => {
    setIsRunning(true);
  };

  useEffect(() => {
    if (startOnMount) {
      const timeout = setTimeout(() => {
        setIsRunning(true);
      }, delay);
      return () => clearTimeout(timeout);
    }
  }, [startOnMount, delay]);

  useEffect(() => {
    if (!isRunning) return;

    const startTime = performance.now();
    const difference = end - start;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentCount = Math.floor(start + difference * easeOut);

      setCount(currentCount);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    requestAnimationFrame(animate);
  }, [isRunning, start, end, duration]);

  return { count, startCounting, isRunning };
}
