import { useRef, useCallback, useEffect } from "react";

/**
 * Returns a debounced version of `callback` that only fires ~delayMs
 * after the last call. Used to implement the 800-1000ms autosave without
 * sending a request on every keystroke.
 */
export function useDebouncedCallback(callback, delayMs) {
  const timeoutRef = useRef(null);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  return useCallback(
    (...args) => {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delayMs);
    },
    [delayMs]
  );
}
