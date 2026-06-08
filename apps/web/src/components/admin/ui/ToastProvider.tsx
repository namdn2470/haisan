'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (type: ToastType, message: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((type: ToastType, message: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setToasts((prev) => [...prev, { id, type, message }]);

    // Auto-remove after 4 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  const success = useCallback((message: string) => showToast('success', message), [showToast]);
  const error = useCallback((message: string) => showToast('error', message), [showToast]);
  const warning = useCallback((message: string) => showToast('warning', message), [showToast]);
  const info = useCallback((message: string) => showToast('info', message), [showToast]);

  const getIcon = (type: ToastType) => {
    const iconProps = { size: 18 };
    switch (type) {
      case 'success': return <CheckCircle {...iconProps} />;
      case 'error': return <XCircle {...iconProps} />;
      case 'warning': return <AlertTriangle {...iconProps} />;
      case 'info': return <Info {...iconProps} />;
    }
  };

  const getTypeStyles = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'adm-toast-success';
      case 'error':
        return 'adm-toast-error';
      case 'warning':
        return 'adm-toast-warning';
      case 'info':
        return 'adm-toast-info';
    }
  };

  return (
    <ToastContext.Provider value={{ toasts, showToast, success, error, warning, info }}>
      {children}
      {/* Toast Container */}
      <div className="adm-toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`adm-toast ${getTypeStyles(toast.type)}`}>
            <span className="adm-toast-icon">{getIcon(toast.type)}</span>
            <span className="adm-toast-message">{toast.message}</span>
            <button
              className="adm-toast-close"
              onClick={() => removeToast(toast.id)}
              aria-label="Đóng"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
