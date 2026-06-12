'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, Bell, LogOut, LayoutDashboard, ShoppingBag, Package, Tag, Users, Megaphone, Star, Warehouse, Settings, Percent } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
};

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: <LayoutDashboard size={20} /> },
  { label: 'Đơn hàng', href: '/admin/orders', icon: <ShoppingBag size={20} /> },
  { label: 'Sản phẩm', href: '/admin/products', icon: <Package size={20} /> },
  { label: 'Danh mục', href: '/admin/categories', icon: <Tag size={20} /> },
  { label: 'Khuyến mãi', href: '/admin/promotions', icon: <Percent size={20} /> },
  { label: 'Banners', href: '/admin/banners', icon: <Megaphone size={20} /> },
  { label: 'Đánh giá', href: '/admin/reviews', icon: <Star size={20} /> },
  { label: 'Kho hàng', href: '/admin/inventory', icon: <Warehouse size={20} /> },
  { label: 'Nhân viên', href: '/admin/staff', icon: <Users size={20} /> },
  { label: 'Cài đặt', href: '/admin/settings', icon: <Settings size={20} /> },
];

const PAGE_TITLES: Record<string, string> = {
  '/admin/dashboard': 'Dashboard',
  '/admin/orders': 'Đơn hàng',
  '/admin/products': 'Sản phẩm',
  '/admin/categories': 'Danh mục',
  '/admin/customers': 'Khách hàng',
  '/admin/promotions': 'Khuyến mãi',
  '/admin/banners': 'Banners',
  '/admin/reviews': 'Đánh giá',
  '/admin/inventory': 'Kho hàng',
  '/admin/staff': 'Nhân viên',
  '/admin/settings': 'Cài đặt',
  '/admin/reports': 'Báo cáo',
  '/admin/shipping-zones': 'Vùng vận chuyển',
};

export default function AdminMobileLayout({ children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [_isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const pageTitle = PAGE_TITLES[pathname] ?? 'Admin';

  const handleNav = (href: string) => {
    router.push(href);
    setOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    router.push('/');
  };

  return (
    <div className="adm-mobile-shell">
      {/* Mobile topbar */}
      <header className="adm-mobile-topbar">
        <button
          onClick={() => setOpen(!open)}
          className="adm-mobile-btn"
          aria-label="Menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>

        <div style={{ minWidth: 0, flex: 1, padding: '0 8px' }}>
          <p style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 14, fontWeight: 900, color: '#0f172a' }}>{pageTitle}</p>
          <p style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12, color: '#94a3b8' }}>Hải Sản Biển Xanh</p>
        </div>

        <button className="adm-mobile-btn" aria-label="Notifications">
          <Bell size={20} />
        </button>
      </header>

      {/* Overlay */}
      {open && (
        <div
          className="adm-mobile-overlay"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <aside className={`adm-mobile-drawer ${open ? 'adm-mobile-drawer--open' : 'adm-mobile-drawer--closed'}`}>
        {/* Drawer header */}
        <div className="adm-mobile-drawer-head">
          <div className="adm-mobile-drawer-brand">
            <div className="adm-mobile-drawer-logo">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white" />
                <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p className="adm-mobile-drawer-title">HSBX Admin</p>
              <p className="adm-mobile-drawer-sub">Quản trị viên</p>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="adm-mobile-drawer-close"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav list */}
        <nav className="adm-mobile-drawer-nav">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(item.href));
            return (
              <button
                key={item.href}
                onClick={() => handleNav(item.href)}
                className={`adm-mobile-nav-item ${active ? 'adm-mobile-nav-item--active' : ''}`}
              >
                <span style={{ flexShrink: 0, color: active ? '#2563eb' : '#94a3b8' }}>
                  {item.icon}
                </span>
                <span style={{ flex: 1, textAlign: 'left', fontSize: 14, fontWeight: active ? 700 : 500, color: active ? '#1d4ed8' : '#334155' }}>
                  {item.label}
                </span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="adm-mobile-nav-badge">{item.badge}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="adm-mobile-drawer-footer">
          <button onClick={handleLogout} className="adm-mobile-logout-btn">
            <LogOut size={18} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Page content */}
      <main className="adm-mobile-main">
        {children}
      </main>
    </div>
  );
}
