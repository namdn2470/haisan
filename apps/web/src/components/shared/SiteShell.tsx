'use client';

import React from 'react';
import Link from 'next/link';
import { Suspense } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Facebook, Heart, Home, MapPin, Menu, MessageCircle, Phone, RotateCcw,
  Search, ShieldCheck, ShoppingCart, Truck, User, Clock, CreditCard,
} from 'lucide-react';
import CitySelector from '@/lib/CitySelector';
import { useCart } from '@/lib/cart-store';
import { useAuth } from '@/contexts/AuthContext';
import { useStoreSettings } from '@/contexts/StoreSettingsContext';
import { formatPhone } from '@/lib/phone';

export function TopBar() {
  const { settings } = useStoreSettings();

  const phone = settings?.phone || settings?.hotline || '0901 234 567';
  const formattedPhone = formatPhone(phone);

  return (
    <div className="hs-topbar">
      <div className="hs-container hs-topbar-inner">
        <span><Truck size={14} /> Miễn phí giao đơn từ 500k</span>
        <span><ShieldCheck size={14} /> Đổi trả trong 24h</span>
        <span><RotateCcw size={14} /> Hoàn tiền 100% nếu không tươi</span>
        <span className="hs-topbar-push"><Phone size={14} /> Hotline: <b>{formattedPhone}</b></span>
      </div>
    </div>
  );
}

export function SiteHeader() {
  const router = useRouter();
  const { getItemCount } = useCart();
  const { user, isLoggedIn } = useAuth();
  const { settings } = useStoreSettings();
  const cartCount = getItemCount();

  const submitSearch = (value: string) => {
    const query = value.trim();
    if (query) router.push(`/products?search=${encodeURIComponent(query)}`);
  };

  const displayName = user?.fullName || user?.phone || null;
  const storeName = settings?.storeName || 'Hải Sản';
  const logoParts = storeName.split(' ');
  const logoTop = logoParts.slice(0, Math.ceil(logoParts.length / 2)).join(' ');
  const logoBottom = logoParts.slice(Math.ceil(logoParts.length / 2)).join(' ');

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
            <span className="hs-logo-top">{logoTop.toUpperCase()}</span>
            <span className="hs-logo-bottom">{logoBottom.toUpperCase()}</span>
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

  type NavItem = {
    label: string;
    href: string;
    exact?: boolean;
    category?: string;
    promotion?: boolean;
    path?: string;
  };

  const menu: NavItem[] = [
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
  const { settings } = useStoreSettings();

  const storeName = settings?.storeName || 'HẢI SẢN BIỂN XANH';
  const phone = settings?.phone || settings?.hotline || '0901 234 567';
  const formattedPhone = formatPhone(phone);
  const email = settings?.email || '';
  const address = settings?.address || '';
  const ward = settings?.ward || '';
  const district = settings?.district || '';
  const city = settings?.city || 'TP. Hồ Chí Minh';
  const facebookUrl = settings?.facebookUrl || '';
  const zaloUrl = settings?.zaloUrl || '';
  const tiktokUrl = settings?.tiktokUrl || '';

  const fullAddress = [address, ward, district, city].filter(Boolean).join(', ');

  return (
    <footer className="hs-footer">

      {/* A — Trust Strip */}
      <div className="hs-trust-strip">
        <div className="hs-container">
          <div className="hs-trust-grid">
            <div className="hs-trust-item">
              <div className="hs-trust-icon"><Truck size={20} /></div>
              <div className="hs-trust-body">
                <strong>Giao hàng 2 giờ</strong>
                <span>Nội thành TP.HCM</span>
              </div>
            </div>
            <div className="hs-trust-sep" aria-hidden="true" />
            <div className="hs-trust-item">
              <div className="hs-trust-icon"><RotateCcw size={20} /></div>
              <div className="hs-trust-body">
                <strong>Hoàn tiền 100%</strong>
                <span>Nếu không tươi sống</span>
              </div>
            </div>
            <div className="hs-trust-sep" aria-hidden="true" />
            <div className="hs-trust-item">
              <div className="hs-trust-icon"><MessageCircle size={20} /></div>
              <div className="hs-trust-body">
                <strong>Hỗ trợ 24/7</strong>
                <span>Phản hồi trong 5 phút</span>
              </div>
            </div>
            <div className="hs-trust-sep" aria-hidden="true" />
            <div className="hs-trust-item">
              <div className="hs-trust-icon"><CreditCard size={20} /></div>
              <div className="hs-trust-body">
                <strong>Thanh toán đa dạng</strong>
                <span>COD, Banking, VNPAY</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* B — Main Footer */}
      <div className="hs-footer-main">
        <div className="hs-container">
          <div className="hs-footer-cols">

            {/* Col 1 — Brand */}
            <div className="hs-fc-brand">
              <div className="hs-fc-logo">
                <div className="hs-logo-icon" style={{ width: 36, height: 36 }}>
                  <svg width="22" height="22" viewBox="0 0 32 32" fill="none"><path d="M4 20c2-3 5-5 8-5s4 2 4 2 2-2 4-2 6 2 8 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/><path d="M4 25c2-3 5-5 8-5s4 2 4 2 2-2 4-2 6 2 8 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.4"/></svg>
                </div>
                <span>{storeName.toUpperCase()}</span>
              </div>
              <p className="hs-fc-desc">
                {settings?.storeDescription || 'Hải sản tươi sống đánh bắt mỗi ngày, giao hàng nhanh trong 2 giờ tại TP.HCM. Cam kết chất lượng tươi sống hoặc hoàn tiền 100%.'}
              </p>
              {fullAddress && (
                <div className="hs-fc-info">
                  <MapPin size={14} /><span>{fullAddress}</span>
                </div>
              )}
              <div className="hs-fc-info">
                <Clock size={14} /><span>Mở cửa 6:00 – 22:00, Thứ 2 đến Chủ nhật</span>
              </div>
              <div className="hs-fc-socials">
                {facebookUrl && (
                  <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className="hs-fc-social hs-fc-fb">
                    <Facebook size={14} />Facebook
                  </a>
                )}
                {zaloUrl && (
                  <a href={zaloUrl} target="_blank" rel="noopener noreferrer" className="hs-fc-social hs-fc-zalo">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 5.82 2 10.5c0 2.55 1.28 4.83 3.25 6.37L2 22l5.5-2.75A9.5 9.5 0 0 0 12 19c5.52 0 10-3.82 10-8.5S17.52 2 12 2z"/></svg>
                    Zalo
                  </a>
                )}
                {tiktokUrl && (
                  <a href={tiktokUrl} target="_blank" rel="noopener noreferrer" className="hs-fc-social hs-fc-tiktok">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>
                    TikTok
                  </a>
                )}
              </div>
            </div>

            {/* Col 2 — Products */}
            <div className="hs-fc-nav">
              <h3 className="hs-fc-title">Sản phẩm</h3>
              <nav>
                <Link href="/products?category=tom" className="hs-fc-link">Tôm tươi sống</Link>
                <Link href="/products?category=cua-ghe" className="hs-fc-link">Cua – Ghẹ</Link>
                <Link href="/products?category=ca" className="hs-fc-link">Cá biển tươi</Link>
                <Link href="/products?category=muc" className="hs-fc-link">Mực – Bạch tuộc</Link>
                <Link href="/products?category=oc-so" className="hs-fc-link">Ốc – Sò</Link>
                <Link href="/products?category=combo" className="hs-fc-link">Combo tiết kiệm</Link>
              </nav>
            </div>

            {/* Col 3 — Support */}
            <div className="hs-fc-nav">
              <h3 className="hs-fc-title">Hỗ trợ</h3>
              <nav>
                <Link href="/orders" className="hs-fc-link">Theo dõi đơn hàng</Link>
                <Link href="/account" className="hs-fc-link">Tài khoản của tôi</Link>
                <Link href="/products" className="hs-fc-link">Hướng dẫn đặt hàng</Link>
                <Link href="/products?promotion=true" className="hs-fc-link">Khuyến mãi</Link>
                <Link href="/chinh-sach-doi-tra" className="hs-fc-link">Chính sách đổi trả</Link>
                <Link href="/chinh-sach-giao-hang" className="hs-fc-link">Chính sách giao hàng</Link>
              </nav>
            </div>

            {/* Col 4 — Contact */}
            <div className="hs-fc-contact">
              <h3 className="hs-fc-title">Liên hệ</h3>
              {phone && (
                <a href={`tel:${phone.replace(/\s/g, '')}`} className="hs-hotline-card">
                  <div className="hs-hotline-card-icon"><Phone size={18} /></div>
                  <div>
                    <div className="hs-hotline-card-label">Hotline đặt hàng</div>
                    <div className="hs-hotline-card-num">{formattedPhone}</div>
                  </div>
                </a>
              )}
              <div className="hs-fc-info-group">
                <div className="hs-fc-info">
                  <MapPin size={14} /><span>{city} — Giao toàn TP</span>
                </div>
                {email && (
                  <div className="hs-fc-info">
                    <MessageCircle size={14} />
                    <a href={`mailto:${email}`} className="hs-fc-email">{email}</a>
                  </div>
                )}
                <div className="hs-fc-info">
                  <Clock size={14} /><span>6:00 – 22:00 · Cả tuần</span>
                </div>
              </div>
              <div className="hs-fc-payments">
                <div className="hs-fc-pay-label">Phương thức thanh toán</div>
                <div className="hs-fc-pay-grid">
                  <span className="hs-pay-badge hs-pay-cod">COD</span>
                  <span className="hs-pay-badge hs-pay-bank">Chuyển khoản</span>
                  <span className="hs-pay-badge hs-pay-vnpay">VNPAY</span>
                  <span className="hs-pay-badge hs-pay-zalo">ZaloPay</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* C — Bottom Bar */}
      <div className="hs-footer-bar">
        <div className="hs-container">
          <div className="hs-footer-bar-row">
            <span>&copy; 2026 {storeName}. Tất cả quyền được bảo lưu.</span>
            <div className="hs-footer-policies">
              <Link href="/chinh-sach-bao-mat">Bảo mật</Link>
              <span className="hs-policy-sep">·</span>
              <Link href="/dieu-khoan-su-dung">Điều khoản</Link>
              <span className="hs-policy-sep">·</span>
              <Link href="/chinh-sach-giao-hang">Giao hàng</Link>
              <span className="hs-policy-sep">·</span>
              <Link href="/chinh-sach-doi-tra">Đổi trả</Link>
            </div>
          </div>
        </div>
      </div>

    </footer>
  );
}

export function MobileBottomNav({ className = '' }: { className?: string }) {
  const pathname = usePathname();
  const { isLoggedIn, user } = useAuth();
  const displayName = user?.fullName || user?.phone || null;
  return (
    <div className={`hs-mobile-nav ${className}`}>
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
      <div className="hs-desktop-chrome">
        <TopBar />
        <SiteHeader />
        <Suspense fallback={<div className="hs-nav"><div className="hs-container hs-nav-inner" /></div>}>
          <SiteNavBar />
        </Suspense>
      </div>
      {children}
      <div className="hs-desktop-chrome">
        <SiteFooter />
      </div>
      <MobileBottomNav />
    </div>
  );
}
