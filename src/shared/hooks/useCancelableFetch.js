import { useRef, useEffect, useCallback } from 'react';

export function useCancelableFetch() {
  const controllerRef = useRef(null);

  const abort = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.abort();
      controllerRef.current = null;
    }
  }, []);

  const nextController = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.abort();
    }
    controllerRef.current = new AbortController();
    return controllerRef.current;
  }, []);

  const nextSignal = useCallback(() => nextController().signal, [nextController]);

  const request = useCallback(async (url, options = {}) => {
    const ctrl = nextController();
    const opts = { ...options, signal: ctrl.signal };
    return fetch(url, opts);
  }, [nextController]);

  useEffect(() => {
    return () => abort();
  }, [abort]);

  return { request, nextSignal, abort };
}

