import { useEffect, useState } from 'react';

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

// Hook for managing toast state
export function useToast() {
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = (message: string, type: ToastMessage['type'] = 'success') => {
    setToast({
      id: Date.now().toString(),
      message,
      type
    });
  };

  const dismissToast = () => {
    setToast(null);
  };

  return { toast, showToast, dismissToast };
}
