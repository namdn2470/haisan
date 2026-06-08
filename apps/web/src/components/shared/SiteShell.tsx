'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Facebook, Heart, Home, MapPin, Menu, MessageCircle, Phone, RotateCcw,
  Search, ShieldCheck, ShoppingCart, Truck, User,
} from 'lucide-react';
import CitySelector from '@/lib/CitySelector';
import { useCart } from '@/lib/cart-store';
import { useAuth } from '@/contexts/AuthContext';

export function TopBar() {
  return (
    <div className="hs-topbar">
      <div className="hs-container hs-topbar-inner">
        <span><Truck size={14} /> Miễn phí giao đơn từ 500k</span>
        <span><ShieldCheck size={14} /> Đổi trả trong 24h</span>
        <span><RotateCcw size={14} /> Hoàn tiền 100% nếu không tươi</span>
        <span className="hs-topbar-push"><Phone size={14} /> Hotline: <b>0901 234 567</b></span>
      </div>
    </div>
  );
}

export function SiteHeader() {
  const router = useRouter();
  const { getItemCount } = useCart();
  const { user, isLoggedIn } = useAuth();
  const cartCount = getItemCount();

  const submitSearch = (value: string) => {
    const query = value.trim();
    if (query) router.push(`/products?search=${encodeURIComponent(query)}`);
  };

  const displayName = user?.fullName || user?.phone || null;

  return (
    <header className="hs-header">
      <div className="hs-container hs-header-inner">
        <Link href="/" className="hs-logo">
          <div className="hs-logo-icon">
            <svg width="26" height="26" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 20c2-3 5-5 8-5s4 2 4 2 2-2 4-2 6 2 8 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M4 25c2-3 5-5 8-5s4 2 4 2 2-2 4-2 6 2 8 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
              <path d="M16 8l-3 7h6l-3-7z" fill="currentColor"/>
            </svg>
          </div>
          <div className="hs-logo-text">
            <span className="hs-logo-top">HẢI SẢN</span>
            <span className="hs-logo-bottom">BIỂN XANH</span>
          </div>
        </Link>

        <CitySelector />

        <div className="hs-search">
          <Search size={18} className="hs-search-icon" />
          <input
            placeholder="Tìm kiếm hải sản tươi ngon..."
            onKeyDown={event => {
              if (event.key === 'Enter') submitSearch((event.target as HTMLInputElement).value);
            }}
          />
          <button className="hs-search-btn" onClick={event => {
            const input = event.currentTarget.parentElement?.querySelector('input');
            submitSearch(input?.value || '');
          }}><Search size={16} /></button>
        </div>

        <div className="hs-header-right">
          <Link href="/account" className="hs-hotline">
            <User size={20} />
            <div>
              <b>{displayName ? displayName : 'Tài khoản'}</b>
              <small>{isLoggedIn ? (displayName === user?.fullName ? user.phone : 'Đã đăng nhập') : 'Đăng nhập'}</small>
            </div>
          </Link>
          <Link href="/cart" className="hs-cart">
            <div className="hs-cart-icon">
              <ShoppingCart size={22} />
              {cartCount > 0 && <i>{cartCount}</i>}
            </div>
            <span>Giỏ hàng</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

export function SiteNavBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const category = searchParams.get('category');
  const promotion = searchParams.get('promotion');
  const menu = [
    { label: 'Trang chủ', href: '/', exact: true },
    { label: 'Tôm', href: '/products?category=tom', category: 'tom' },
    { label: 'Cua - Ghẹ', href: '/products?category=cua-ghe', category: 'cua-ghe' },
    { label: 'Cá', href: '/products?category=ca', category: 'ca' },
    { label: 'Mực', href: '/products?category=muc', category: 'muc' },
    { label: 'Ốc - Sò', href: '/products?category=oc-so', category: 'oc-so' },
    { label: 'Combo', href: '/products?category=combo', category: 'combo' },
    { label: 'Khuyến mãi', href: '/products?promotion=true', promotion: true },
    { label: 'Tin tức', href: '/news', path: '/news' },
  ];

  return (
    <nav className="hs-nav">
      <div className="hs-container hs-nav-inner">
        <Link href="/products" className="hs-cat-btn"><Menu size={20} /><span>Danh mục</span></Link>
        <div className="hs-nav-links">
          {menu.map(item => {
            const active = item.exact
              ? pathname === '/'
              : item.category
                ? pathname === '/products' && category === item.category
                : item.promotion
                  ? pathname === '/promotions' || (pathname === '/products' && promotion === 'true')
                  : item.path
                    ? pathname.startsWith(item.path)
                    : false;
            return (
              <Link key={item.label} href={item.href} className={`hs-nav-link ${active ? 'active' : ''}`}>
                {active && <Home size={14} />}
                {item.label}
              </Link>
            );
          })}
        </div>
        <Link href="/quanly" className="hs-admin-link">Admin</Link>
      </div>
    </nav>
  );
}

export function SiteFooter() {
  return (
    <footer className="hs-footer">
      <div className="hs-container">
        <div className="hs-footer-grid">
          <div className="hs-footer-brand">
            <div className="hs-footer-logo">
              <div className="hs-logo-icon" style={{ width: 36, height: 36 }}>
                <svg width="22" height="22" viewBox="0 0 32 32" fill="none"><path d="M4 20c2-3 5-5 8-5s4 2 4 2 2-2 4-2 6 2 8 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/><path d="M4 25c2-3 5-5 8-5s4 2 4 2 2-2 4-2 6 2 8 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.4"/></svg>
              </div>
              <span>HẢI SẢN BIỂN XANH</span>
            </div>
            <p>Hải sản tươi sống đánh bắt mỗi ngày, giao hàng nhanh trong 2 giờ tại TP.HCM, Hà Nội & Đà Nẵng.</p>
            <div className="hs-footer-social">
              <a href="#"><Facebook size={18} /></a>
              <a href="#"><MessageCircle size={18} /></a>
              <a href="#"><Phone size={18} /></a>
            </div>
          </div>
          <div className="hs-footer-links">
            <h4>Sản phẩm</h4>
            <Link href="/products?category=tom">Tôm tươi sống</Link>
            <Link href="/products?category=cua-ghe">Cua - Ghẹ</Link>
            <Link href="/products?category=ca">Cá biển tươi</Link>
            <Link href="/products?category=muc">Mực - Bạch tuộc</Link>
            <Link href="/products?category=combo">Combo tiết kiệm</Link>
          </div>
          <div className="hs-footer-links">
            <h4>Hỗ trợ</h4>
            <Link href="/orders">Theo dõi đơn hàng</Link>
            <Link href="/account">Tài khoản của tôi</Link>
            <Link href="/products">Chính sách đổi trả</Link>
            <Link href="/products">Hướng dẫn đặt hàng</Link>
          </div>
          <div className="hs-footer-contact">
            <h4>Hệ thống cửa hàng</h4>
            <div className="hs-contact-item"><MapPin size={16} /><div><b>TP. Hồ Chí Minh</b><span>123 Đường Biển, Q.1</span></div></div>
            <div className="hs-contact-item"><MapPin size={16} /><div><b>Hà Nội</b><span>45 Phố Biển, Hoàn Kiếm</span></div></div>
            <div className="hs-contact-item"><MapPin size={16} /><div><b>Đà Nẵng</b><span>78 Bạch Đằng, Hải Châu</span></div></div>
            <div className="hs-contact-item"><Phone size={16} /><div><b>Hotline</b><span>0901 234 567</span></div></div>
          </div>
        </div>
        <div className="hs-footer-bottom">
          <span>&copy; 2026 Hải Sản Biển Xanh. Tất cả quyền được bảo lưu.</span>
          <div className="hs-footer-bottom-links">
            <Link href="#">Chính sách bảo mật</Link>
            <Link href="#">Điều khoản sử dụng</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const { isLoggedIn, user } = useAuth();
  const displayName = user?.fullName || user?.phone || null;
  return (
    <div className="hs-mobile-nav">
      <Link href="/" className={pathname === '/' ? 'active' : ''}><Home size={22} /><span>Trang chủ</span></Link>
      <Link href="/products" className={pathname.startsWith('/products') ? 'active' : ''}><Menu size={22} /><span>Danh mục</span></Link>
      <Link href="/cart" className={pathname === '/cart' ? 'active' : ''}><ShoppingCart size={22} /><span>Giỏ hàng</span></Link>
      <Link href="/account?tab=favorites" className={pathname.startsWith('/account') && isLoggedIn ? 'active' : ''}><Heart size={22} /><span>{isLoggedIn && displayName ? displayName.split(' ').pop() : 'Yêu thích'}</span></Link>
      <Link href="/account" className={pathname.startsWith('/account') ? 'active' : ''}><User size={22} /><span>Tài khoản</span></Link>
    </div>
  );
}

export default function SiteShell({ children, includeChrome = true }: { children: React.ReactNode; includeChrome?: boolean }) {
  if (!includeChrome) return <>{children}</>;
  return (
    <div className="hs-page">
      <TopBar />
      <SiteHeader />
      <Suspense fallback={<div className="hs-nav"><div className="hs-container hs-nav-inner" /></div>}>
        <SiteNavBar />
      </Suspense>
      {children}
      <SiteFooter />
      <MobileBottomNav />
    </div>
  );
}
