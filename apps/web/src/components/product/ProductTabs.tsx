'use client';

import { useState } from 'react';
import { Star, CheckCircle2, Truck, ShieldCheck, Scale, Award, MessageCircle } from 'lucide-react';
import { img } from '@/lib/api';

type Review = { id: string; rating: number; comment?: string; createdAt: string; user: { fullName?: string } };

const TABS = ['Chi tiết sản phẩm', 'Hướng dẫn chế biến', 'Đánh giá', 'Hỏi đáp'];

function ReviewsTab({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <Star size={48} strokeWidth={1} color="#d1d5db" />
        <p style={{ marginTop: 12, color: 'var(--muted)' }}>Chưa có đánh giá nào</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {reviews.map(r => (
        <div key={r.id} style={{ paddingBottom: 16, borderBottom: '1px solid var(--line)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="review-avatar">{r.user.fullName?.[0] || 'K'}</div>
            <div>
              <b style={{ fontSize: 14 }}>{r.user.fullName || 'Khách'}</b>
              <div style={{ display: 'flex', gap: 2 }}>
                {[1, 2, 3, 4, 5].map(s => (
                  <Star key={s} size={12} fill={s <= r.rating ? '#f59e0b' : 'none'} stroke={s <= r.rating ? '#f59e0b' : '#d1d5db'} />
                ))}
              </div>
            </div>
            <small style={{ marginLeft: 'auto', color: 'var(--muted)' }}>{new Date(r.createdAt).toLocaleDateString('vi-VN')}</small>
          </div>
          {r.comment && <p style={{ marginTop: 8, fontSize: 14, lineHeight: 1.6 }}>{r.comment}</p>}
        </div>
      ))}
    </div>
  );
}

function DetailsTab({
  name, description, shortDescription, imageUrl,
}: {
  name: string; description?: string | null; shortDescription?: string | null; imageUrl?: string;
}) {
  const descText = description || shortDescription || 'Hải sản tươi sống, chất lượng cao, đánh bắt mỗi ngày.';
  const tipImage = imageUrl || img('prod-ghe.jpg');
  const productType = name.toLowerCase().split(' ')[0];

  return (
    <div>
      <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>{name}</h3>
      <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 16 }}>
        {descText}
      </p>
      <ul style={{ paddingLeft: 20, marginBottom: 16 }}>
        <li style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.8 }}>100% hải sản tự nhiên, tuyển chọn mỗi ngày</li>
        <li style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.8 }}>Thịt chắc, ngọt, chất lượng cao</li>
        <li style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.8 }}>Giao hàng nhanh trong 2h tại TP.HCM</li>
        <li style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.8 }}>Đóng gói chắc chắn, giữ tươi sống khi giao</li>
      </ul>
      <div style={{ background: 'var(--blue-light)', borderRadius: 12, padding: 20, display: 'flex', gap: 16, alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <b style={{ fontSize: 14, fontWeight: 800 }}>Mẹo nhỏ</b>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, marginTop: 4 }}>
            Để {productType} ngon nhất, bạn nên hấp hoặc luộc với sả, gừng, bia khoảng 15 phút. Chấm muối tiêu chanh rất ngon!
          </p>
        </div>
        <img
          src={tipImage}
          alt="Mẹo"
          style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }}
          onError={(e) => { const t = e.currentTarget; if (!t.dataset.fallback) { t.dataset.fallback = 'true'; t.src = img('prod-ghe.jpg'); } }}
        />
      </div>
    </div>
  );
}

function CookingGuideTab({ description }: { description?: string | null }) {
  return (
    <div>
      <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>Hướng dẫn chế biến</h3>
      <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
        {description || 'Hướng dẫn chế biến chi tiết cho sản phẩm này.'}
      </p>
    </div>
  );
}

function QATab() {
  return (
    <div>
      <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>Hỏi đáp</h3>
      <p style={{ fontSize: 14, color: 'var(--muted)' }}>Chưa có câu hỏi nào. Hãy là người đầu tiên đặt câu hỏi!</p>
    </div>
  );
}

const SIDEBAR_ITEMS = [
  { icon: CheckCircle2, text: 'Hải sản tươi sống 100%' },
  { icon: Truck, text: 'Giao hàng nhanh trong 2h' },
  { icon: ShieldCheck, text: 'Đổi trả nếu không tươi' },
  { icon: Scale, text: 'Cân đúng, giá rõ ràng' },
  { icon: Award, text: 'Cam kết chất lượng' },
  { icon: MessageCircle, text: 'Tư vấn 24/7' },
];

export default function ProductTabs({
  name, description, shortDescription, reviews, imageUrl,
}: {
  name: string; description?: string | null; shortDescription?: string | null;
  reviews: Review[]; imageUrl?: string;
}) {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="pd-tabs-layout">
      <div>
        <div style={{ display: 'flex', borderBottom: '2px solid var(--line)', marginBottom: 24 }}>
          {TABS.map((label, i) => (
            <button
              key={label}
              className={`pd-tab-btn ${activeTab === i ? 'active' : ''}`}
              onClick={() => setActiveTab(i)}
            >
              {label}{i === 2 ? ` (${reviews.length})` : ''}
            </button>
          ))}
        </div>

        <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: 24 }}>
          {activeTab === 0 && <DetailsTab name={name} description={description} shortDescription={shortDescription} imageUrl={imageUrl} />}
          {activeTab === 1 && <CookingGuideTab description={description} />}
          {activeTab === 2 && <ReviewsTab reviews={reviews} />}
          {activeTab === 3 && <QATab />}
        </div>
      </div>

      <div className="pd-tabs-sidebar">
        <div className="pd-sidebar-card">
          <h4>Tại sao mua tại Hải Sản Biển Xanh?</h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {SIDEBAR_ITEMS.map((item, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                <span style={{ color: 'var(--green)' }}><item.icon size={16} /></span> {item.text}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
