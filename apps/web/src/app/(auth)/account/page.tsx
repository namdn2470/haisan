'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  User, Package, Heart, MapPin, LogOut, ShoppingCart, Phone, Lock,
  Eye, EyeOff, Truck, ShieldCheck, RotateCcw, CheckCircle2, Leaf, Home,
} from 'lucide-react';
import { api, getToken, img } from '@/lib/api';
import { money } from '@/lib/money';
import {
  getMe,
  getOrders,
  login as loginUser,
  logout as logoutUser,
  register as registerUser,
} from '@/services';
import { useAuth } from '@/contexts/AuthContext';

type Profile = {
  id: string; fullName?: string; phone?: string; email?: string; role: string;
};

type Order = {
  id: string; orderCode: string; customerName: string; totalAmount: number;
  orderStatus: string; paymentStatus: string; createdAt: string;
  items: { productName: string; quantity: number; price?: number; unitPrice?: number }[];
};

type Favorite = {
  id: string; product: { id: string; name: string; slug: string; basePrice: number; images?: { imageUrl: string }[] };
};

type Address = {
  id: string; label?: string; fullName: string; phone: string;
  addressLine: string; isDefault: boolean; city?: string; district?: string; ward?: string;
};

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  NEW: { label: 'Mới đặt', color: '#f59e0b' },
  CONFIRMED: { label: 'Đã xác nhận', color: '#3b82f6' },
  PREPARING: { label: 'Đang chuẩn bị', color: '#8b5cf6' },
  DELIVERING: { label: 'Đang giao', color: '#06b6d4' },
  COMPLETED: { label: 'Hoàn tất', color: '#10b981' },
  CANCELLED: { label: 'Đã hủy', color: '#ef4444' },
  RETURNED: { label: 'Trả hàng', color: '#f97316' },
};

const ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN', 'MANAGER'];

export default function AccountPage() {
  return (
    <Suspense fallback={<AccountPageFallback />}>
      <AccountPageContent />
    </Suspense>
  );
}

function AccountPageFallback() {
  return (
    <div className="auth-wrap">
      <div className="auth-right">
        <div className="auth-form-wrapper">
          <div className="auth-form-header">
            <h2>Đang tải tài khoản</h2>
            <p>Vui lòng chờ trong giây lát.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function AccountPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { login: authLogin, logout: authLogout } = useAuth();
  const tab = searchParams.get('tab') || 'profile';
  const authMode = searchParams.get('mode');

  const [profile, setProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(true);
  const [authForm, setAuthForm] = useState({ phone: '', password: '', fullName: '' });
  const [authError, setAuthError] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState({ fullName: '', phone: '', addressLine: '', label: 'Nhà' });
  const [editingAddress, setEditingAddress] = useState<string | null>(null);

  useEffect(() => {
    if (authMode === 'register') setShowLogin(false);
    if (authMode === 'login') setShowLogin(true);
  }, [authMode]);

  useEffect(() => {
    const token = getToken();
    if (token) {
      getMe().then(user => {
        setProfile(user);
        setLoading(false);
      }).catch(() => setLoading(false));
      getOrders().then(data => setOrders(data as unknown as Order[])).catch(() => {});
      api<{ data: Favorite[] }>('/api/favorites').then(r => setFavorites(r.data || [])).catch(() => {});
      api<{ data: Address[] }>('/api/addresses').then(r => setAddresses(r.data || [])).catch(() => {});
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = showLogin
        ? await loginUser(authForm.phone, authForm.password)
        : await registerUser(authForm.phone, authForm.password, authForm.fullName);
      authLogin(res.token, res.user);
      if (showLogin) {
        setProfile(res.user);
        // Admin/staff → admin dashboard, customer → homepage
        if (ADMIN_ROLES.includes(res.user?.role)) {
          router.push('/admin/dashboard');
        } else {
          router.push('/');
        }
      } else {
        setProfile(res.user);
        setAuthForm(prev => ({ ...prev, password: '', fullName: '' }));
        setAuthError('');
        router.push('/account');
      }
    } catch (err: any) {
      setAuthError(err?.message || (showLogin ? 'Sai số điện thoại hoặc mật khẩu' : 'Đăng ký thất bại'));
    }
  };

  const logout = () => {
    logoutUser();
    authLogout();
    setProfile(null);
    setOrders([]);
    setFavorites([]);
    setAddresses([]);
  };

  const toggleFavorite = async (productId: string) => {
    try {
      const r = await api<{ data: { favorited: boolean } }>('/api/favorites/toggle', {
        method: 'POST',
        body: JSON.stringify({ productId }),
      });
      if (r.data.favorited) {
        api<{ data: Favorite[] }>('/api/favorites').then(r => setFavorites(r.data || [])).catch(() => {});
      } else {
        setFavorites(prev => prev.filter(f => f.product.id !== productId));
      }
    } catch {
      setAuthError('Không thể cập nhật yêu thích. Vui lòng thử lại.');
    }
  };

  const saveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAddress) {
        await api(`/api/addresses/${editingAddress}`, {
          method: 'PUT',
          body: JSON.stringify(addressForm),
        });
      } else {
        await api('/api/addresses', {
          method: 'POST',
          body: JSON.stringify({ ...addressForm, isDefault: addresses.length === 0 }),
        });
      }
      api<{ data: Address[] }>('/api/addresses').then(r => setAddresses(r.data || [])).catch(() => {});
      setShowAddressForm(false);
      setEditingAddress(null);
      setAddressForm({ fullName: '', phone: '', addressLine: '', label: 'Nhà' });
    } catch {
      setAuthError('Không thể lưu địa chỉ. Vui lòng thử lại.');
    }
  };

  const deleteAddress = async (id: string) => {
    try {
      await api(`/api/addresses/${id}`, { method: 'DELETE' });
      setAddresses(prev => prev.filter(a => a.id !== id));
    } catch {
      setAuthError('Không thể xóa địa chỉ. Vui lòng thử lại.');
    }
  };

  const switchAuthMode = (login: boolean) => {
    setShowLogin(login);
    setAuthError('');
    setShowPass(false);
    router.replace(`/account?mode=${login ? 'login' : 'register'}`);
  };

  /* ========== AUTH PAGE (LOGIN / REGISTER) ========== */
  if (!profile && !loading) {
    return (
      <div className="auth-wrap">
        {/* Left Panel — Brand */}
        <div className="auth-left">
          <div className="auth-left-content">
            <Link href="/" className="auth-left-logo">
              <div className="auth-left-logo-icon">
                <svg width="48" height="48" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 24c3-4 7-6 12-6s6 3 6 3 3-3 6-3 9 3 12 6" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                  <path d="M6 30c3-4 7-6 12-6s6 3 6 3 3-3 6-3 9 3 12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
                </svg>
              </div>
              <div>
                <span className="auth-left-brand">HẢI SẢN BIỂN XANH</span>
                <span className="auth-left-tagline">Tươi sống mỗi ngày</span>
              </div>
            </Link>

            <h1 className="auth-left-title">
              Hải sản tươi sống<br />
              <span>Giao nhanh trong ngày</span>
            </h1>

            <div className="auth-features">
              <div className="auth-feature">
                <div className="auth-feature-icon"><Leaf size={20} /></div>
                <div>
                  <b>100% Tươi sống</b>
                  <p>Đánh bắt và giao trong ngày</p>
                </div>
              </div>
              <div className="auth-feature">
                <div className="auth-feature-icon"><Truck size={20} /></div>
                <div>
                  <b>Giao nhanh 2h</b>
                  <p>Nội thành TP.HCM</p>
                </div>
              </div>
              <div className="auth-feature">
                <div className="auth-feature-icon"><ShieldCheck size={20} /></div>
                <div>
                  <b>Cam kết chất lượng</b>
                  <p>Đổi trả nếu không tươi</p>
                </div>
              </div>
              <div className="auth-feature">
                <div className="auth-feature-icon"><RotateCcw size={20} /></div>
                <div>
                  <b>Đổi trả dễ dàng</b>
                  <p>Hoàn tiền 100% nếu không hài lòng</p>
                </div>
              </div>
            </div>

            <div className="auth-left-footer">
              <span><Phone size={14} /> Hotline: 0901 234 567</span>
              <span>Hỗ trợ 24/7</span>
            </div>
          </div>
          {/* Decorative wave */}
          <div className="auth-left-wave">
            <svg viewBox="0 0 400 80" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0,40 C100,80 200,0 400,40 L400,80 L0,80 Z" fill="rgba(255,255,255,0.06)"/>
            </svg>
          </div>
        </div>

        {/* Right Panel — Form */}
        <div className="auth-right">
          <div className="auth-form-wrapper">
            <div className="auth-form-header">
              <h2>{showLogin ? 'Chào mừng trở lại' : 'Tạo tài khoản mới'}</h2>
              <p>{showLogin ? 'Đăng nhập để quản lý đơn hàng và nhận ưu đãi' : 'Tham gia Hải Sản Biển Xanh để mua sắm hải sản tươi sống'}</p>
            </div>

            {/* Toggle tabs */}
            <div className="auth-toggle">
              <button
                className={`auth-toggle-btn ${showLogin ? 'active' : ''}`}
                onClick={() => switchAuthMode(true)}
              >
                Đăng nhập
              </button>
              <button
                className={`auth-toggle-btn ${!showLogin ? 'active' : ''}`}
                onClick={() => switchAuthMode(false)}
              >
                Đăng ký
              </button>
            </div>

            {authError && (
              <div className="auth-error">
                <Lock size={16} />
                {authError}
              </div>
            )}

            <form onSubmit={handleLogin} className="auth-form">
              {!showLogin && (
                <div className="auth-field">
                  <label>Họ và tên</label>
                  <div className="auth-input-wrap">
                    <User size={18} />
                    <input
                      type="text"
                      required
                      value={authForm.fullName}
                      onChange={e => setAuthForm(f => ({ ...f, fullName: e.target.value }))}
                      placeholder="Nguyễn Văn A"
                    />
                  </div>
                </div>
              )}

              <div className="auth-field">
                <label>Số điện thoại</label>
                <div className="auth-input-wrap">
                  <Phone size={18} />
                  <input
                    type="tel"
                    required
                    value={authForm.phone}
                    onChange={e => setAuthForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="0901 234 567"
                  />
                </div>
              </div>

              <div className="auth-field">
                <div className="auth-field-label-row">
                  <label>Mật khẩu</label>
                  {showLogin && <a href="#" className="auth-forgot">Quên mật khẩu?</a>}
                </div>
                <div className="auth-input-wrap">
                  <Lock size={18} />
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    value={authForm.password}
                    onChange={e => setAuthForm(f => ({ ...f, password: e.target.value }))}
                    placeholder={showPass ? 'Nhập mật khẩu' : '••••••••'}
                  />
                  <button type="button" className="auth-pass-toggle" onClick={() => setShowPass(!showPass)}>
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="auth-submit">
                {showLogin ? 'Đăng nhập' : 'Tạo tài khoản'}
              </button>
            </form>

            <div className="auth-switch-text">
              <span>{showLogin ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}</span>
              <button onClick={() => switchAuthMode(!showLogin)}>
                {showLogin ? 'Đăng ký ngay' : 'Đăng nhập'}
              </button>
            </div>

            <Link href="/" className="auth-back-home">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              Về trang chủ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ========== ACCOUNT DASHBOARD (logged in) ========== */
  const sidebarItems = [
    { key: 'profile', icon: <User size={18} />, label: 'Tài khoản', desc: 'Thông tin cá nhân' },
    { key: 'orders', icon: <Package size={18} />, label: 'Đơn hàng', desc: 'Quản lý đơn hàng' },
    { key: 'favorites', icon: <Heart size={18} />, label: 'Yêu thích', desc: 'Sản phẩm đã lưu' },
    { key: 'addresses', icon: <MapPin size={18} />, label: 'Địa chỉ', desc: 'Sổ địa chỉ' },
  ];

  const orderStats = {
    total: orders.length,
    delivering: orders.filter(o => o.orderStatus === 'DELIVERING').length,
    completed: orders.filter(o => o.orderStatus === 'COMPLETED').length,
    totalSpent: orders.reduce((s, o) => s + Number(o.totalAmount), 0),
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--soft, #f8fafc)' }}>
      {/* Minimal account header — no site header/footer */}
      <header className="ac-header">
        <div className="hs-container ac-header-inner">
          <Link href="/" className="ac-logo">
            <div className="ac-logo-icon">
              <svg width="20" height="20" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 20c2-3 5-5 8-5s4 2 4 2 2-2 4-2 6 2 8 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                <path d="M4 25c2-3 5-5 8-5s4 2 4 2 2-2 4-2 6 2 8 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
              </svg>
            </div>
            <span className="ac-logo-text">HẢI SẢN BIỂN XANH</span>
          </Link>

          <div className="ac-header-right">
            <Link href="/" className="ac-header-link">
              <Home size={14} /> Trang chủ
            </Link>
            <Link href="/products" className="ac-header-link">
              <ShoppingCart size={14} /> Mua sắm
            </Link>
            <div className="ac-header-user">
              <div className="ac-header-avatar">{profile?.fullName?.[0]?.toUpperCase() || 'U'}</div>
              <span className="ac-header-name">{profile?.fullName || profile?.phone}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="ac-container">
        <div className="ac-layout">
          {/* Sidebar */}
          <aside className="ac-sidebar">
            <div className="ac-profile-card">
              <div className="ac-profile-avatar">{profile?.fullName?.[0] || 'U'}</div>
              <div className="ac-profile-info">
                <b>{profile?.fullName || 'User'}</b>
                <span>{profile?.phone}</span>
                <small>{profile?.role === 'ADMIN' ? 'Quản trị viên' : 'Khách hàng'}</small>
              </div>
            </div>

            <nav className="ac-nav">
              {sidebarItems.map(item => (
                <Link
                  key={item.key}
                  href={`/account?tab=${item.key}`}
                  className={`ac-nav-item ${tab === item.key ? 'active' : ''}`}
                >
                  <div className="ac-nav-icon">{item.icon}</div>
                  <div>
                    <span className="ac-nav-label">{item.label}</span>
                    <span className="ac-nav-desc">{item.desc}</span>
                  </div>
                  {item.key === 'orders' && orders.length > 0 && (
                    <span className="ac-nav-badge">{orders.length}</span>
                  )}
                </Link>
              ))}
            </nav>

            <button onClick={logout} className="ac-logout">
              <LogOut size={18} />
              <span>Đăng xuất</span>
            </button>
          </aside>

          {/* Content */}
          <section className="ac-content">
            {/* Profile Tab */}
            {tab === 'profile' && (
              <div className="ac-content-inner">
                {/* Quick stats */}
                <div className="ac-stats">
                  <div className="ac-stat-card">
                    <div className="ac-stat-icon ac-stat-icon-blue"><Package size={22} /></div>
                    <div>
                      <span>Tổng đơn</span>
                      <b>{orderStats.total}</b>
                    </div>
                  </div>
                  <div className="ac-stat-card">
                    <div className="ac-stat-icon ac-stat-icon-cyan"><Truck size={22} /></div>
                    <div>
                      <span>Đang giao</span>
                      <b>{orderStats.delivering}</b>
                    </div>
                  </div>
                  <div className="ac-stat-card">
                    <div className="ac-stat-icon ac-stat-icon-green"><CheckCircle2 size={22} /></div>
                    <div>
                      <span>Hoàn tất</span>
                      <b>{orderStats.completed}</b>
                    </div>
                  </div>
                  <div className="ac-stat-card">
                    <div className="ac-stat-icon ac-stat-icon-red"><Heart size={22} /></div>
                    <div>
                      <span>Tổng chi</span>
                      <b>{money(orderStats.totalSpent)}</b>
                    </div>
                  </div>
                </div>

                <div className="ac-card">
                  <div className="ac-card-header">
                    <h2>Thông tin tài khoản</h2>
                    <button className="ac-card-action">Chỉnh sửa</button>
                  </div>
                  <div className="ac-profile-grid">
                    <div className="ac-info-item">
                      <label>Họ và tên</label>
                      <p>{profile?.fullName || 'Chưa cập nhật'}</p>
                    </div>
                    <div className="ac-info-item">
                      <label>Số điện thoại</label>
                      <p>{profile?.phone}</p>
                    </div>
                    <div className="ac-info-item">
                      <label>Email</label>
                      <p>{profile?.email || 'Chưa cập nhật'}</p>
                    </div>
                    <div className="ac-info-item">
                      <label>Vai trò</label>
                      <p className="ac-role-badge">{profile?.role === 'ADMIN' ? 'Quản trị viên' : 'Khách hàng'}</p>
                    </div>
                  </div>
                </div>

                <div className="ac-card">
                  <div className="ac-card-header">
                    <h2>Đơn hàng gần đây</h2>
                    <Link href="/account?tab=orders" className="ac-card-link">Xem tất cả</Link>
                  </div>
                  {orders.length === 0 ? (
                    <div className="ac-empty">
                      <Package size={40} strokeWidth={1.2} color="#c0c8d4" />
                      <p>Chưa có đơn hàng nào</p>
                      <Link href="/products" className="ac-empty-cta">Mua sắm ngay</Link>
                    </div>
                  ) : (
                    <div className="ac-orders-preview">
                      {orders.slice(0, 3).map(order => {
                        const st = STATUS_MAP[order.orderStatus] || { label: order.orderStatus, color: '#666' };
                        return (
                          <Link href={`/orders/${order.id}`} className="ac-order-row" key={order.id} style={{ textDecoration: 'none', color: 'inherit', display: 'flex' }}>
                            <div className="ac-order-left">
                              <div className="ac-order-code">#{order.orderCode}</div>
                              <div className="ac-order-items">
                                {order.items.slice(0, 2).map((item, i) => (
                                  <span key={i}>{item.productName} x{item.quantity}</span>
                                ))}
                                {order.items.length > 2 && <span>+{order.items.length - 2} sản phẩm khác</span>}
                              </div>
                            </div>
                            <div className="ac-order-right">
                              <span className="ac-order-status" style={{ background: st.color + '15', color: st.color }}>{st.label}</span>
                              <span className="ac-order-amount">{money(Number(order.totalAmount))}</span>
                              <span className="ac-order-date">{new Date(order.createdAt).toLocaleDateString('vi-VN')}</span>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Orders Tab */}
            {tab === 'orders' && (
              <div className="ac-content-inner">
                <div className="ac-card">
                  <div className="ac-card-header">
                    <h2>Đơn hàng của tôi</h2>
                    <span className="ac-order-count">{orders.length} đơn hàng</span>
                  </div>
                  {orders.length === 0 ? (
                    <div className="ac-empty">
                      <Package size={48} strokeWidth={1} color="#c0c8d4" />
                      <h3>Chưa có đơn hàng nào</h3>
                      <p>Hãy khám phá hải sản tươi sống và đặt hàng ngay!</p>
                      <Link href="/products" className="ac-empty-cta">Mua sắm ngay</Link>
                    </div>
                  ) : (
                    <div className="ac-orders-full">
                      {orders.map(order => {
                        const st = STATUS_MAP[order.orderStatus] || { label: order.orderStatus, color: '#666' };
                        return (
                          <Link href={`/orders/${order.id}`} className="ac-order-card" key={order.id} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                            <div className="ac-order-card-header">
                              <div className="ac-order-card-left">
                                <span className="ac-order-code-lg">#{order.orderCode}</span>
                                <span className="ac-order-date-sm">{new Date(order.createdAt).toLocaleDateString('vi-VN')}</span>
                              </div>
                              <span className="ac-order-status-lg" style={{ background: st.color + '15', color: st.color }}>
                                {st.label}
                              </span>
                            </div>
                            <div className="ac-order-card-body">
                              {order.items.map((item, i) => (
                                <div className="ac-order-item-row" key={i}>
                                  <span className="ac-order-item-name">{item.productName}</span>
                                  <span className="ac-order-item-qty">x{item.quantity}</span>
                                  <span className="ac-order-item-price">{money(Number(item.price ?? item.unitPrice ?? 0))}</span>
                                </div>
                              ))}
                            </div>
                            <div className="ac-order-card-footer">
                              <span className="ac-order-pay-status">
                                {order.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                              </span>
                              <div className="ac-order-total">
                                <span>Tổng cộng:</span>
                                <b>{money(Number(order.totalAmount))}</b>
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Favorites Tab */}
            {tab === 'favorites' && (
              <div className="ac-content-inner">
                <div className="ac-card">
                  <div className="ac-card-header">
                    <h2>Sản phẩm yêu thích</h2>
                    <span className="ac-order-count">{favorites.length} sản phẩm</span>
                  </div>
                  {favorites.length === 0 ? (
                    <div className="ac-empty">
                      <Heart size={48} strokeWidth={1} color="#c0c8d4" />
                      <h3>Chưa có sản phẩm yêu thích</h3>
                      <p>Hãy duyệt sản phẩm và thêm vào danh sách yêu thích!</p>
                      <Link href="/products" className="ac-empty-cta">Khám phá sản phẩm</Link>
                    </div>
                  ) : (
                    <div className="ac-fav-grid">
                      {favorites.map(f => (
                        <Link key={f.id} href={`/products/${f.product.slug}`} className="ac-fav-card">
                          <div className="ac-fav-img">
                            <img src={(() => { const first = f.product.images?.[0]; return !first ? img('prod-tom.jpg') : typeof first === 'string' ? first : first.imageUrl; })()} alt={f.product.name}
                              onError={(e) => { const t = e.currentTarget; if (!t.dataset.fallback) { t.dataset.fallback = 'true'; t.src = 'https://images.pexels.com/photos/14480456/pexels-photo-14480456.jpeg?auto=compress&cs=tinysrgb&w=400'; } }} />
                          </div>
                          <div className="ac-fav-info">
                            <b>{f.product.name}</b>
                            <span className="ac-fav-price">{money(Number(f.product.basePrice))}</span>
                          </div>
                          <button className="ac-fav-remove" onClick={e => { e.preventDefault(); toggleFavorite(f.product.id); }}>
                            <Heart size={16} fill="currentColor" />
                          </button>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Addresses Tab */}
            {tab === 'addresses' && (
              <div className="ac-content-inner">
                <div className="ac-card">
                  <div className="ac-card-header">
                    <h2>Địa chỉ giao hàng</h2>
                    <button className="ac-card-action" onClick={() => { setShowAddressForm(!showAddressForm); setEditingAddress(null); setAddressForm({ fullName: profile?.fullName || '', phone: profile?.phone || '', addressLine: '', label: 'Nhà' }); }}>
                      {showAddressForm ? 'Hủy' : 'Thêm địa chỉ'}
                    </button>
                  </div>
                  {showAddressForm && (
                    <form onSubmit={saveAddress} style={{ padding: '16px 0', display: 'flex', flexDirection: 'column', gap: 12, borderBottom: '1px solid #f1f5f9' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <input placeholder="Họ tên" required value={addressForm.fullName} onChange={e => setAddressForm(p => ({ ...p, fullName: e.target.value }))}
                          style={{ padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14 }} />
                        <input placeholder="Số điện thoại" required value={addressForm.phone} onChange={e => setAddressForm(p => ({ ...p, phone: e.target.value }))}
                          style={{ padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14 }} />
                      </div>
                      <input placeholder="Địa chỉ cụ thể (số nhà, đường, phường/xã)" required value={addressForm.addressLine}
                        onChange={e => setAddressForm(p => ({ ...p, addressLine: e.target.value }))}
                        style={{ padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14 }} />
                      <div style={{ display: 'flex', gap: 8 }}>
                        {['Nhà', 'Công ty', 'Khác'].map(l => (
                          <button type="button" key={l} onClick={() => setAddressForm(p => ({ ...p, label: l }))}
                            style={{ padding: '6px 16px', borderRadius: 999, fontSize: 13, border: addressForm.label === l ? '2px solid #0891b2' : '1px solid #e2e8f0', background: addressForm.label === l ? '#0891b210' : '#fff', color: addressForm.label === l ? '#0891b2' : '#64748b', fontWeight: 600, cursor: 'pointer' }}>
                            {l}
                          </button>
                        ))}
                      </div>
                      <button type="submit" style={{ padding: '10px 0', background: '#0891b2', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-start', paddingLeft: 24, paddingRight: 24 }}>
                        {editingAddress ? 'Cập nhật' : 'Lưu địa chỉ'}
                      </button>
                    </form>
                  )}
                  {addresses.length === 0 && !showAddressForm ? (
                    <div className="ac-empty">
                      <MapPin size={48} strokeWidth={1} color="#c0c8d4" />
                      <h3>Chưa có địa chỉ nào</h3>
                      <p>Thêm địa chỉ giao hàng để đặt hàng nhanh hơn.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 16 }}>
                      {addresses.map(addr => (
                        <div key={addr.id} style={{
                          display: 'flex', gap: 12, padding: '14px 16px', borderRadius: 10,
                          border: addr.isDefault ? '2px solid #0891b2' : '1px solid #f1f5f9',
                          background: addr.isDefault ? '#f0fdfa' : '#fff',
                          position: 'relative',
                        }}>
                          <MapPin size={18} style={{ color: '#0891b2', marginTop: 2, flexShrink: 0 }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                              <b style={{ fontSize: 14 }}>{addr.label || 'Nhà'}</b>
                              {addr.isDefault && <span style={{ fontSize: 11, background: '#0891b2', color: '#fff', padding: '2px 8px', borderRadius: 999 }}>Mặc định</span>}
                            </div>
                            <div style={{ fontSize: 14 }}>{addr.fullName} | {addr.phone}</div>
                            <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{addr.addressLine}</div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <button onClick={() => { setEditingAddress(addr.id); setShowAddressForm(true); setAddressForm({ fullName: addr.fullName, phone: addr.phone, addressLine: addr.addressLine, label: addr.label || 'Nhà' }); }}
                              style={{ fontSize: 12, color: '#0891b2', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: '4px 0' }}>Sửa</button>
                            <button onClick={() => deleteAddress(addr.id)}
                              style={{ fontSize: 12, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: '4px 0' }}>Xóa</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
