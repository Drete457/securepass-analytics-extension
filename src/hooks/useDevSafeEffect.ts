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
  }, deps);
}

/**
 * A useEffect hook specifically for one-time initialization that should
 * only run once even in development mode with StrictMode
 */
export function useOneTimeEffect(effect: () => void | (() => void)): void {
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    
    hasRun.current = true;
    const cleanup = effect();

    return () => {
      if (cleanup) cleanup();
      // Reset for potential remount
      hasRun.current = false;
    };
  }, []);
}
