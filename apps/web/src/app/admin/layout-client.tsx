'use client';

import { useEffect, useState, createContext, useContext, useCallback, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { CheckCircle, XCircle, AlertTriangle, Info, X, Trash2 } from 'lucide-react';
import './admin.css';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import { getStoredUser, getToken } from '@/lib/api';

const ADMIN_ROLES = ['ADMIN', 'MANAGER', 'STAFF', 'SUPER_ADMIN'];

type StoredUser = {
  id?: string;
  fullName?: string;
  phone?: string;
  role: string;
  email?: string;
};

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

function ConfirmDialog({
  opts,
  onClose,
}: {
  opts: ConfirmOptions;
  onClose: () => void;
}) {
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

export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<StoredUser | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((type: ToastType, message: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => removeToast(id), 4000);
  }, [removeToast]);

  const toastActions = useMemo(() => ({
    success: (m: string) => showToast('success', m),
    error: (m: string) => showToast('error', m),
    warning: (m: string) => showToast('warning', m),
    info: (m: string) => showToast('info', m),
  }), [showToast]);

  const toastCtx = useMemo(() => ({
    toasts,
    ...toastActions,
  }), [toasts, toastActions]);

  const [confirmOpts, setConfirmOpts] = useState<ConfirmOptions | null>(null);

  const confirmCtx = {
    confirm: useCallback((opts: ConfirmOptions) => setConfirmOpts(opts), []),
  };

  useEffect(() => {
    if (pathname === '/admin/login' || pathname === '/admin/no-access') {
      setLoading(false);
      return;
    }

    const token = getToken();
    const storedUser = getStoredUser() as StoredUser | null;

    if (!token || !storedUser) {
      setLoading(false);
      router.replace('/admin/login');
      return;
    }

    if (!ADMIN_ROLES.includes(storedUser.role)) {
      setLoading(false);
      router.replace('/admin/no-access');
      return;
    }

    setUser(storedUser);
    setLoading(false);
  }, [pathname, router]);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#f1f5f9',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 48,
            height: 48,
            border: '4px solid #e2e8f0',
            borderTopColor: '#0891b2',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 16px',
          }} />
          <p style={{ color: '#64748b', fontSize: 14 }}>Đang tải...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (pathname === '/admin/login' || pathname === '/admin/no-access') {
    return <>{children}</>;
  }

  const getToastIcon = (type: ToastType) => {
    switch (type) {
      case 'success': return <CheckCircle size={18} />;
      case 'error': return <XCircle size={18} />;
      case 'warning': return <AlertTriangle size={18} />;
      case 'info': return <Info size={18} />;
    }
  };

  return (
    <ToastContext.Provider value={toastCtx}>
      <ConfirmContext.Provider value={confirmCtx}>
        <div className="adm-layout">
          <AdminSidebar
            pathname={pathname}
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            userRole={user?.role || ''}
          />
          <div className={`adm-main ${sidebarCollapsed ? 'adm-main--collapsed' : ''}`}>
            <AdminHeader
              pathname={pathname}
              user={user}
              onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            />
            <main className="adm-content">
              {children}
            </main>
          </div>
        </div>

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
