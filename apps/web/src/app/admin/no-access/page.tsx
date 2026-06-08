'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { clearToken } from '@/lib/api';

export default function AdminNoAccessPage() {
  const router = useRouter();

  const handleGoHome = () => {
    clearToken();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('hsbx_admin_token');
      localStorage.removeItem('hsbx_admin_user');
    }
    router.push('/');
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: '#f1f5f9',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 16,
        padding: '48px 40px',
        maxWidth: 420,
        width: '90%',
        textAlign: 'center',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
      }}>
        <div style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: '#fef2f2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
        }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
          </svg>
        </div>

        <h1 style={{
          fontSize: 24,
          fontWeight: 700,
          color: '#1e293b',
          marginBottom: 12,
        }}>
          Không có quyền truy cập
        </h1>

        <p style={{
          fontSize: 15,
          color: '#64748b',
          marginBottom: 32,
          lineHeight: 1.6,
        }}>
          Tài khoản của bạn không có quyền truy cập khu vực quản trị.
          Vui lòng đăng nhập bằng tài khoản quản trị viên hoặc liên hệ quản lý.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={handleGoHome}
            style={{
              padding: '12px 24px',
              background: '#0891b2',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            Quay về trang chủ
          </button>

          <Link
            href="/admin/login"
            style={{
              padding: '12px 24px',
              background: '#fff',
              color: '#0891b2',
              border: '2px solid #0891b2',
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            Đăng nhập admin
          </Link>
        </div>
      </div>
    </div>
  );
}
