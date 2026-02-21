import { useRef, useEffect, useCallback } from 'react';

export function useInferenceWorker({ onModelLoaded, onResult, onError }) {
  const workerRef = useRef(null);

  // Keep callbacks in ref to avoid re-creating worker
  const cbRef = useRef({ onModelLoaded, onResult, onError });
  useEffect(() => {
    cbRef.current = { onModelLoaded, onResult, onError };
  }, [onModelLoaded, onResult, onError]);

  useEffect(() => {
    const worker = new Worker(
      new URL('../workers/inference-worker.js', import.meta.url),
      { type: 'module' }
    );

    worker.onmessage = (e) => {
      const { type } = e.data;
      if (type === 'MODEL_LOADED') {
        cbRef.current.onModelLoaded?.(e.data);
      } else if (type === 'RESULT') {
        cbRef.current.onResult?.(e.data);
      } else if (type === 'MODEL_LOAD_ERROR') {
        cbRef.current.onError?.(e.data);
      }
    };

    workerRef.current = worker;
    return () => worker.terminate();
  }, []);

  const postMessage = useCallback((message, transfer) => {
    workerRef.current?.postMessage(message, transfer);
  }, []);

  return { postMessage };
}
