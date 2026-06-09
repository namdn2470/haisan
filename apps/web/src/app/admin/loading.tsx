'use client';

export default function AdminLoading() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f1f5f9',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: '48px',
            height: '48px',
            border: '4px solid #e2e8f0',
            borderTopColor: '#0891b2',
            borderRadius: '50%',
            animation: 'adm-spin 0.8s linear infinite',
            margin: '0 auto 16px',
          }}
        />
        <p
          style={{
            color: '#64748b',
            fontSize: '14px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          Đang tải...
        </p>
      </div>
      <style>{`
        @keyframes adm-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
