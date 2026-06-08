'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, getStoredUser } from '@/lib/api';

const ADMIN_ROLES = ['ADMIN', 'MANAGER', 'STAFF', 'SUPER_ADMIN'];

export default function AdminRootPage() {
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    const storedUser = getStoredUser();

    if (!token || !storedUser) {
      router.replace('/admin/login');
      return;
    }

    if (!ADMIN_ROLES.includes(storedUser.role)) {
      router.replace('/admin/no-access');
      return;
    }

    router.replace('/admin/dashboard');
  }, [router]);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: '#f1f5f9',
    }}>
      <div style={{ textAlign: 'center', color: '#64748b', fontSize: 14 }}>
        <div style={{
          width: 40,
          height: 40,
          border: '3px solid #e2e8f0',
          borderTopColor: '#0891b2',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          margin: '0 auto 16px',
        }} />
        <p>Đang kiểm tra quyền truy cập...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
