'use client';

import { useState, createContext, useContext, useCallback } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X, Trash2 } from 'lucide-react';

// ——— Toast Context ———
type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  toasts: Toast[];
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within AdminLayout');
  return ctx;
}

// ——— Confirm Dialog Context ———
interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  onConfirm: () => void | Promise<void>;
}

interface ConfirmContextType {
  confirm: (opts: ConfirmOptions) => void;
}

const ConfirmContext = createContext<ConfirmContextType | null>(null);

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within AdminLayout');
  return ctx;
}

// ——— Confirm Dialog Component ———
interface ConfirmDialogProps {
  opts: ConfirmOptions;
  onClose: () => void;
}

export function ConfirmDialog({ opts, onClose }: ConfirmDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await opts.onConfirm();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const getIcon = () => {
    const type = opts.type || 'info';
    if (type === 'danger') return <Trash2 size={24} />;
    if (type === 'warning') return <AlertTriangle size={24} />;
    return <Info size={24} />;
  };

  return (
    <div className="adm-confirm-overlay" onClick={onClose}>
      <div className="adm-confirm-dialog" onClick={e => e.stopPropagation()}>
        <div className={`adm-confirm-icon ${opts.type || 'info'}`}>{getIcon()}</div>
        <h3 className="adm-confirm-title">{opts.title}</h3>
        <p className="adm-confirm-message">{opts.message}</p>
        <div className="adm-confirm-actions">
          <button className="adm-confirm-cancel" onClick={onClose} disabled={loading}>
            {opts.cancelText || 'Hủy'}
          </button>
          <button
            className={`adm-confirm-ok ${opts.type || 'info'}`}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? 'Đang xử lý...' : (opts.confirmText || 'Xác nhận')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ——— Admin Context Provider (use inside layout) ———
interface AdminContextProviderProps {
  children: React.ReactNode;
}

export function AdminContextProvider({ children }: AdminContextProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmOpts, setConfirmOpts] = useState<ConfirmOptions | null>(null);

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const confirm = useCallback((opts: ConfirmOptions) => {
    setConfirmOpts(opts);
  }, []);

  const toastCtx: ToastContextType = {
    toasts,
    success: (msg) => addToast('success', msg),
    error: (msg) => addToast('error', msg),
    warning: (msg) => addToast('warning', msg),
    info: (msg) => addToast('info', msg),
  };

  const confirmCtx: ConfirmContextType = { confirm };

  return (
    <ToastContext.Provider value={toastCtx}>
      <ConfirmContext.Provider value={confirmCtx}>
        {children}

        {/* Toast Notifications */}
        <div className="adm-toast-container">
          {toasts.map(t => (
            <div key={t.id} className={`adm-toast adm-toast-${t.type}`}>
              <span className="adm-toast-icon">{getToastIcon(t.type)}</span>
              <span className="adm-toast-message">{t.message}</span>
              <button className="adm-toast-close" onClick={() => removeToast(t.id)}>
                <X size={16} />
              </button>
            </div>
          ))}
        </div>

        {/* Confirm Dialog */}
        {confirmOpts && (
          <ConfirmDialog
            opts={confirmOpts}
            onClose={() => setConfirmOpts(null)}
          />
        )}
      </ConfirmContext.Provider>
    </ToastContext.Provider>
  );
}

function getToastIcon(type: ToastType) {
  if (type === 'success') return <CheckCircle size={18} />;
  if (type === 'error') return <XCircle size={18} />;
  if (type === 'warning') return <AlertTriangle size={18} />;
  return <Info size={18} />;
}
