'use client';

import Link from 'next/link';
import { Home, ArrowLeft } from 'lucide-react';

export default function AdminNotFoundPage() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '80px 24px',
      textAlign: 'center',
    }}>
      <div style={{
        width: 80,
        height: 80,
        borderRadius: 20,
        background: '#f0f9ff',
        color: '#0891b2',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
      }}>
        <ArrowLeft size={36} strokeWidth={1.5} />
      </div>
      <h2 style={{
        fontSize: 28,
        fontWeight: 800,
        color: '#0f172a',
        margin: '0 0 8px',
      }}>
        404 — Trang không tìm thấy
      </h2>
      <p style={{
        fontSize: 14,
        color: '#64748b',
        maxWidth: 400,
        margin: '0 0 32px',
        lineHeight: 1.6,
      }}>
        Trang bạn đang tìm kiếm trong khu vực quản trị không tồn tại hoặc đã bị di chuyển.
      </p>
      <div style={{ display: 'flex', gap: 12 }}>
        <Link
          href="/admin/dashboard"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '0 24px',
            height: 44,
            background: '#0891b2',
            color: '#fff',
            fontWeight: 700,
            fontSize: 14,
            borderRadius: 10,
            textDecoration: 'none',
          }}
        >
          <Home size={16} />
          Về Dashboard
        </Link>
        <button
          onClick={() => window.history.back()}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '0 24px',
            height: 44,
            border: '1px solid #e2e8f0',
            background: '#fff',
            color: '#334155',
            fontWeight: 600,
            fontSize: 14,
            borderRadius: 10,
            cursor: 'pointer',
          }}
        >
          <ArrowLeft size={16} />
          Quay lại
        </button>
      </div>
    </div>
  );
}
