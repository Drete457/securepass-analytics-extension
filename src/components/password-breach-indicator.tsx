import { useState, useEffect } from 'react';
import { breachCheckService, BreachCheckResult } from '../services/breach-check-service';

interface PasswordBreachIndicatorProps {
  password: string;
  compact?: boolean;
}

export function PasswordBreachIndicator({ password, compact = false }: PasswordBreachIndicatorProps) {
  const [breachInfo, setBreachInfo] = useState<BreachCheckResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  // Reset state when password input changes
  useEffect(() => {
    setBreachInfo(null);
    setHasChecked(false);
  }, [password]);

  // Check cache for this password
  useEffect(() => {
    const cached = breachCheckService.isPasswordInCache(password);
    if (cached) {
      setBreachInfo({
        isBreached: cached.isBreached,
        occurrences: cached.occurrences
      });
      setHasChecked(true);
    }
  }, [password]);

  const checkBreach = async () => {
    if (isChecking || hasChecked) return;
    
    setIsChecking(true);
    try {
      const result = await breachCheckService.checkPasswordBreach(password);
      setBreachInfo(result);
      setHasChecked(true);
    } catch (error) {
      console.error('Error checking breach:', error);
      setBreachInfo({ isBreached: false, error: 'Check failed' });
    } finally {
      setIsChecking(false);
    }
  };

  if (compact) {
    // Compact version for password list
    if (!hasChecked && !isChecking) {
      return (
        <button
          onClick={checkBreach}
          className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
          title="Check if password is breached"
        >
          Check
        </button>
      );
    }

    if (isChecking) {
      return <span className="text-xs text-yellow-600">⏳</span>;
    }

    if (breachInfo?.isBreached) {
      return (
        <span 
          className="text-xs text-red-600" 
          title={`Compromised (found ${breachInfo.occurrences?.toLocaleString()} times)`}
        >
          🚨
        </span>
      );
    }

    if (breachInfo?.error) {
      return <span className="text-xs text-gray-500" title={breachInfo.error}>❌</span>;
    }

    return <span className="text-xs text-green-600" title="Password is safe">✅</span>;
  }

  // Full version for detailed view
  return (
    <div className="flex items-center space-x-2">
      {!hasChecked && !isChecking && (
        <button
          onClick={checkBreach}
          className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 transition-colors"
        >
          Check Breach Status
        </button>
      )}
      
      {isChecking && (
        <div className="flex items-center space-x-2 text-yellow-600">
          <span>⏳</span>
          <span className="text-sm">Checking...</span>
        </div>
      )}
      
      {breachInfo && !isChecking && (
        <div className={`flex items-center space-x-2 ${
          breachInfo.isBreached ? 'text-red-600' : 
          breachInfo.error ? 'text-gray-500' : 'text-green-600'
        }`}>
          <span>
            {breachInfo.isBreached ? '🚨' : breachInfo.error ? '❌' : '✅'}
          </span>
          <span className="text-sm">
            {breachInfo.isBreached 
              ? `Compromised (${breachInfo.occurrences?.toLocaleString()} times)`
              : breachInfo.error 
                ? `Error: ${breachInfo.error}`
                : 'Safe'
            }
          </span>
        </div>
      )}
    </div>
  );
}
