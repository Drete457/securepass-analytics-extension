import { useCallback, useEffect, useRef, useState } from 'react';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastProps {
  message: ToastMessage | null;
  onDismiss: () => void;
  duration?: number;
}

export function Toast({ message, onDismiss, duration = 2000 }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onDismiss, 300); // Wait for fade out animation
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [message, duration, onDismiss]);

  if (!message) return null;

  const typeStyles = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    info: 'bg-[var(--accent-600)]'
  };

  const typeIcons = {
    success: '✓',
    error: '✕',
    info: 'ℹ'
  };

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}
    >
      <div className={`${typeStyles[message.type]} text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2`}>
        <span className="text-lg">{typeIcons[message.type]}</span>
        <span className="text-sm font-medium">{message.message}</span>
      </div>
    </div>
  );
}

// Hook for managing toast state with debouncing to prevent spam
export function useToast(debounceMs: number = 500) {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const lastToastTime = useRef<number>(0);
  const lastToastMessage = useRef<string>('');

  const showToast = useCallback((message: string, type: ToastMessage['type'] = 'success') => {
    const now = Date.now();
    
    // Debounce: skip if same message within debounce period
    if (
      message === lastToastMessage.current &&
      now - lastToastTime.current < debounceMs
    ) {
      return;
    }

    lastToastTime.current = now;
    lastToastMessage.current = message;

    setToast({
      id: now.toString(),
      message,
      type
    });
  }, [debounceMs]);

  const dismissToast = useCallback(() => {
    setToast(null);
  }, []);

  return { toast, showToast, dismissToast };
}
