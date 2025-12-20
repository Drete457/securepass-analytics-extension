import { DependencyList, useEffect, useRef } from 'react';

/**
 * A safe useEffect hook that prevents duplicate executions in development mode
 * caused by React StrictMode and HMR (Hot Module Replacement)
 */
export function useDevSafeEffect(
  effect: () => void | (() => void),
  deps?: DependencyList
): void {
  const hasExecuted = useRef(false);
  const cleanupRef = useRef<(() => void) | void>(undefined);

  useEffect(() => {
    // In development mode with StrictMode, effects run twice
    // This prevents duplicate executions of critical initialization code
    if (process.env.NODE_ENV === 'development' && hasExecuted.current) {
      return cleanupRef.current;
    }

    hasExecuted.current = true;
    cleanupRef.current = effect();

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
      // Reset flag when component unmounts
      hasExecuted.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/**
 * A useEffect hook specifically for one-time initialization that should
 * only run once even in development mode with StrictMode.
 * Note: This effect will NOT re-run on remount - use regular useEffect if you need that.
 */
export function useOneTimeEffect(effect: () => void | (() => void)): void {
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    
    hasRun.current = true;
    const cleanup = effect();

    return () => {
      if (cleanup) cleanup();
      // Do NOT reset hasRun - this hook is meant to run only once per session
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
