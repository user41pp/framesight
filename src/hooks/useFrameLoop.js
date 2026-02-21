import { useRef, useCallback, useEffect } from 'react';

export function useFrameLoop() {
  const isProcessingRef = useRef(false);
  const isRunningRef = useRef(false);
  const rafIdRef = useRef(null);
  const onFrameRef = useRef(null);

  // FPS calculation
  const frameTimesRef = useRef([]);
  const fpsRef = useRef(0);

  const markDone = useCallback(() => {
    isProcessingRef.current = false;

    // FPS calc
    const now = performance.now();
    const times = frameTimesRef.current;
    times.push(now);
    // Keep last 30 frame timestamps
    while (times.length > 30) times.shift();
    if (times.length >= 2) {
      const elapsed = times[times.length - 1] - times[0];
      fpsRef.current = Math.round(((times.length - 1) / elapsed) * 1000);
    }
  }, []);

  const start = useCallback((onFrame) => {
    onFrameRef.current = onFrame;
    isRunningRef.current = true;
    frameTimesRef.current = [];
    fpsRef.current = 0;

    const loop = () => {
      if (!isRunningRef.current) return;

      if (!isProcessingRef.current && onFrameRef.current) {
        isProcessingRef.current = true;
        onFrameRef.current();
      }

      rafIdRef.current = requestAnimationFrame(loop);
    };
    loop();
  }, []);

  const stop = useCallback(() => {
    isRunningRef.current = false;
    isProcessingRef.current = false;
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    fpsRef.current = 0;
    frameTimesRef.current = [];
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isRunningRef.current = false;
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, []);

  return { start, stop, markDone, fpsRef };
}
