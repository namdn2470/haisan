'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, Phone, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { setToken } from '@/lib/api';

type LoginResponse = {
  data?: {
    token?: string;
    user?: {
      id: string;
      phone?: string;
      fullName?: string;
      email?: string;
      role: string;
    };
  };
  message?: string;
};

export default function AdminLoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      });

      const data = await res.json() as LoginResponse;

      if (!res.ok) {
        throw new Error(data.message || 'Đăng nhập thất bại');
      }

      const token = data.data?.token;
      const user = data.data?.user;

      if (!token || !user) {
        throw new Error('Phản hồi đăng nhập không hợp lệ. Vui lòng thử lại.');
      }

      // Chỉ cho phép admin/staff/manager
      const role = user.role;
      const allowedRoles = ['ADMIN', 'MANAGER', 'STAFF', 'SUPER_ADMIN'];
      if (!allowedRoles.includes(role)) {
        throw new Error('Tài khoản không có quyền truy cập khu vực quản trị. Vui lòng đăng nhập bằng tài khoản quản trị.');
      }

      // Lưu cùng session key với toàn bộ web app để layout admin đọc được.
      setToken(token, user);
      localStorage.removeItem('hsbx_admin_token');
      localStorage.removeItem('hsbx_admin_user');

      router.push('/admin/dashboard');
    } catch (err: any) {
      setError(err.message || 'Số điện thoại hoặc mật khẩu không đúng');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="adm-login-root">
      <div className="adm-login-left">
        <div className="adm-login-brand">
          <div className="adm-login-logo">
            <svg width="48" height="48" viewBox="0 0 40 40" fill="none">
              <path d="M6 24c3-4 7-6 12-6s6 3 6 3 3-3 6-3 9 3 12 6" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
              <path d="M6 30c3-4 7-6 12-6s6 3 6 3 3-3 6-3 9 3 12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
            </svg>
          </div>
          <div>
            <h1 className="adm-login-brand-name">HẢI SẢN BIỂN XANH</h1>
            <p className="adm-login-brand-sub">Hệ thống quản trị</p>
          </div>
        </div>

        <div className="adm-login-features">
          <div className="adm-login-feature">
            <div className="adm-login-feature-icon"><ShieldCheck size={20} /></div>
            <div>
              <b>Bảo mật cao</b>
              <p>Phân quyền theo vai trò rõ ràng</p>
            </div>
          </div>
          <div className="adm-login-feature">
            <div className="adm-login-feature-icon"><ShieldCheck size={20} /></div>
            <div>
              <b>Quản lý toàn diện</b>
              <p>Sản phẩm, đơn hàng, khách hàng</p>
            </div>
          </div>
          <div className="adm-login-feature">
            <div className="adm-login-feature-icon"><ShieldCheck size={20} /></div>
            <div>
              <b>Báo cáo chi tiết</b>
              <p>Doanh thu, tồn kho, hoạt động</p>
            </div>
          </div>
        </div>

        <p className="adm-login-footer">
          © {new Date().getFullYear()} Hải Sản Biển Xanh — Hệ thống quản trị nội bộ
        </p>
      </div>

      <div className="adm-login-right">
        <div className="adm-login-form-wrap">
          <div className="adm-login-form-header">
            <h2>Đăng nhập quản trị</h2>
            <p>Trờ về <Link href="/">trang chủ</Link></p>
          </div>

          {error && (
            <div className="adm-login-error">
              <Lock size={16} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="adm-login-form">
            <div className="adm-login-field">
              <label>Số điện thoại</label>
              <div className="adm-login-input-wrap">
                <Phone size={18} />
                <input
                  type="tel"
                  placeholder="0901 234 567"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  required
                  autoComplete="tel"
                />
              </div>
            </div>

            <div className="adm-login-field">
              <label>Mật khẩu</label>
              <div className="adm-login-input-wrap">
                <Lock size={18} />
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button type="button" className="adm-login-pass-toggle" onClick={() => setShowPass(!showPass)}>
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="adm-login-submit" disabled={loading}>
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>

          <div className="adm-login-note">
            <b>⚠️ Lưu ý:</b> Chỉ tài khoản có vai trò <b>Admin, Manager, Staff</b> mới được truy cập khu vực này.
          </div>
        </div>
      </div>
    </div>
  );
}
