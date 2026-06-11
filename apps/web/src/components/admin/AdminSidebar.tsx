'use client';

import Link from 'next/link';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Tag,
  Users,
  Percent,
  FileText,
  Image,
  Star,
  Bell,
  Truck,
  Warehouse,
  UserCog,
  ShieldCheck,
  BarChart2,
  Settings2,
  Settings,
  LogOut,
  ChevronDown,
  ChevronUp,
  Layout,
} from 'lucide-react';

const NAV_ITEMS = [
  {
    label: 'Tổng quan',
    items: [
      { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard', badge: null },
      { href: '/admin/notifications', icon: Bell, label: 'Thông báo', badge: null },
    ],
  },
  {
    label: 'Sản phẩm',
    items: [
      { href: '/admin/orders', icon: ShoppingCart, label: 'Đơn hàng', badge: null },
      { href: '/admin/products', icon: Package, label: 'Sản phẩm', badge: null },
      { href: '/admin/categories', icon: Tag, label: 'Danh mục', badge: null },
    ],
  },
  {
    label: 'Khách hàng',
    items: [
      { href: '/admin/customers', icon: Users, label: 'Khách hàng', badge: null },
    ],
  },
  {
    label: 'Khuyến mãi',
    items: [
      { href: '/admin/promotions', icon: Percent, label: 'Khuyến mãi', badge: null },
    ],
  },
  {
    label: 'Nội dung',
    items: [
      { href: '/admin/posts', icon: FileText, label: 'Bài viết', badge: null },
      { href: '/admin/banners', icon: Image, label: 'Banner', badge: null },
      { href: '/admin/reviews', icon: Star, label: 'Đánh giá', badge: null },
      { href: '/admin/home-sections', icon: Layout, label: 'Trang chủ', badge: null },
    ],
  },
  {
    label: 'Vận chuyển & Kho',
    items: [
      { href: '/admin/delivery', icon: Truck, label: 'Giao hàng', badge: null },
      { href: '/admin/inventory', icon: Warehouse, label: 'Kho hàng', badge: null },
    ],
  },
  {
    label: 'Quản trị',
    items: [
      { href: '/admin/staff', icon: UserCog, label: 'Nhân viên', badge: null },
      { href: '/admin/roles', icon: ShieldCheck, label: 'Vai trò & Quyền', badge: null },
    ],
  },
  {
    label: 'Báo cáo',
    items: [
      { href: '/admin/reports', icon: BarChart2, label: 'Báo cáo', badge: null },
    ],
  },
  {
    label: 'Hệ thống',
    items: [
      { href: '/admin/config', icon: Settings2, label: 'Cấu hình', badge: null },
      { href: '/admin/settings', icon: Settings, label: 'Cài đặt', badge: null },
    ],
  },
];

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Quản trị viên',
  MANAGER: 'Quản lý',
  STAFF: 'Nhân viên',
};

interface Props {
  pathname: string;
  collapsed: boolean;
  onToggle: () => void;
  userRole: string;
}

export default function AdminSidebar({ pathname, collapsed, onToggle, userRole }: Props) {
  const displayRole = ROLE_LABELS[userRole] || userRole;

  return (
    <aside className={`adm-sidebar${collapsed ? ' collapsed' : ''}`}>
      {/* Logo */}
      <div className="adm-sidebar-logo">
        <div className="adm-logo-icon">
          <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
            <path d="M6 22c3-4 7-6 14-6s8 4 8 4 3-4 6-4 10 4 12 8" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
            <path d="M6 28c3-4 7-6 14-6s8 4 8 4 3-4 6-4 10 4 12 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
          </svg>
        </div>
        {!collapsed && (
          <div className="adm-logo-text">
            <span className="adm-logo-name">Hải Sản Biển Xanh</span>
            <span className="adm-logo-sub">Quản trị</span>
          </div>
        )}
        <button className="adm-sidebar-toggle" onClick={onToggle} aria-label={collapsed ? 'Mở rộng' : 'Thu nhỏ'}>
          {collapsed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="adm-nav">
        {NAV_ITEMS.map((section) => (
          <div key={section.label} className="adm-nav-section">
            {!collapsed && <div className="adm-nav-label">{section.label}</div>}
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(item.href + '/'));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`adm-nav-item${isActive ? ' active' : ''}`}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon size={18} />
                  {!collapsed && (
                    <>
                      <span className="adm-nav-text">{item.label}</span>
                      {item.badge !== null && (
                        <span className="adm-nav-badge">{item.badge}</span>
                      )}
                    </>
                  )}
                  {collapsed && item.badge !== null && (
                    <span className="adm-nav-badge-dot" />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="adm-sidebar-footer">
        <div className="adm-footer-user">
          <div className="adm-footer-avatar">A</div>
          {!collapsed && (
            <div className="adm-footer-info">
              <span className="adm-footer-name">Admin</span>
              <span className="adm-footer-role">{displayRole}</span>
            </div>
          )}
        </div>
        <Link href="/admin/login" className="adm-logout-btn">
          <LogOut size={15} />
          {!collapsed && <span>Đăng xuất</span>}
        </Link>
      </div>
    </aside>
  );
}
