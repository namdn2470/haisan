'use client';

import Link from 'next/link';
import { Home, Search } from 'lucide-react';
import SiteShell from '@/components/shared/SiteShell';

export default function NotFoundPage() {
  return (
    <SiteShell>
      <main className="hs-container" style={{ padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 80, fontWeight: 900, lineHeight: 1, color: 'var(--blue)', marginBottom: 8 }}>
          404
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 8px' }}>Trang không tìm thấy</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 32, maxWidth: 400, marginLeft: 'auto', marginRight: 'auto' }}>
          Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/" className="hs-btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <Home size={18} /> Về trang chủ
          </Link>
          <Link href="/products" className="hs-btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <Search size={18} /> Mua sắm ngay
          </Link>
        </div>
      </main>
    </SiteShell>
  );
}
