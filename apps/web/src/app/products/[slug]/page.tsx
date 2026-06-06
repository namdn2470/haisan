'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronRight, Star, ShieldCheck, Truck, Scale, RotateCcw,
  ShoppingCart, Minus, Plus, Heart, MapPin, Search, Menu,
  Home, Phone, ChevronLeft, Clock, CheckCircle2,
  MessageCircle, Award, Leaf, Fish, User,
} from 'lucide-react';
import { api, img } from '@/lib/api';
import { money } from '@/lib/money';
import CitySelector from '@/lib/CitySelector';

type Variant = {
  id: string; name: string; sizeLabel?: string; price: number;
  oldPrice?: number; stockQuantity: number; sku: string; isActive?: boolean;
  minWeight?: string; maxWeight?: string;
};
type Review = { id: string; rating: number; comment?: string; createdAt: string; user: { fullName?: string } };
type ProductImage = { id: string; imageUrl: string; altText?: string; isThumbnail: boolean; sortOrder: number };
type ProcessingOption = { processingService: { id: string; name: string; price: number; description?: string } };
type ProductDetail = {
  id: string; name: string; slug: string; shortDescription?: string;
  description?: string; origin?: string; storageInstruction?: string;
  basePrice: number; oldPrice?: number; unit: string; badge?: string;
  ratingAvg: number; ratingCount: number; soldCount: number;
  isFeatured: boolean; isBestSeller: boolean; isFreshLive: boolean;
  variants?: Variant[]; images?: ProductImage[];
  processingOptions?: ProcessingOption[];
  category?: { name: string; slug: string };
  reviews?: Review[];
};
type RelatedProduct = {
  id: string; name: string; slug: string; basePrice: number; unit: string;
  images?: { imageUrl: string }[];
};

const BADGE_MAP: Record<string, string> = {
  BAN_CHAY: 'BÁN CHẠY', UU_DAI: 'ƯU ĐÃI', MOI: 'MỚI',
  TUOI_NGON: 'TƯƠI NGON', SALE: 'SALE',
};
const UNIT_OPTIONS = ['kg', 'con'];

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [related, setRelated] = useState<RelatedProduct[]>([]);
  const [qty, setQty] = useState(1);
  const [selectedUnit, setSelectedUnit] = useState('kg');
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [selectedProcessing, setSelectedProcessing] = useState<string>('');
  const [activeImage, setActiveImage] = useState(0);
  const [activeTab, setActiveTab] = useState(0);
  const [adding, setAdding] = useState(false);
  const [deliverySlot, setDeliverySlot] = useState('today-16-18');

  useEffect(() => {
    api<{ data: ProductDetail }>(`/api/products/slug/${slug}`).then(r => {
      setProduct(r.data);
      if (r.data.variants?.length) {
        const def = r.data.variants.find(v => v.isActive !== false) || r.data.variants[0];
        setSelectedVariant(def);
      }
    }).catch(() => {});
    api<{ data: RelatedProduct[] }>('/api/products?sort=sold&limit=4').then(r => setRelated(r.data)).catch(() => {});
  }, [slug]);

  const currentPrice = useMemo(() => {
    if (selectedVariant) return Number(selectedVariant.price);
    return Number(product?.basePrice || 0);
  }, [selectedVariant, product]);

  const oldPrice = useMemo(() => {
    if (selectedVariant?.oldPrice) return Number(selectedVariant.oldPrice);
    if (product?.oldPrice) return Number(product.oldPrice);
    return 0;
  }, [selectedVariant, product]);

  const processingFee = useMemo(() => {
    return Number(product?.processingOptions?.find(o => o.processingService.id === selectedProcessing)?.processingService.price || 0);
  }, [selectedProcessing, product]);

  const totalPrice = (currentPrice + processingFee) * qty;

  const allImages = useMemo(() => {
    if (!product) return [];
    const imgs = product.images?.length ? [...product.images] : [];
    if (imgs.length === 0) {
      imgs.push({ id: 'fallback', imageUrl: img('prod-ghe.jpg'), altText: product.name, isThumbnail: true, sortOrder: 0 });
    }
    return imgs.sort((a, b) => a.sortOrder - b.sortOrder);
  }, [product]);

  const handleAddToCart = async () => {
    if (!product) return;
    setAdding(true);
    try {
      await api('/api/carts/items', {
        method: 'POST',
        body: JSON.stringify({
          product_id: product.id,
          variant_id: selectedVariant?.id || null,
          quantity: qty,
          selected_unit: selectedUnit,
          processing_service_id: selectedProcessing || null,
          price_at_time: currentPrice,
        }),
      });
    } catch {}
    setAdding(false);
  };

  const handleBuyNow = async () => {
    if (!product) return;
    setAdding(true);
    try {
      await api('/api/carts/items', {
        method: 'POST',
        body: JSON.stringify({
          product_id: product.id,
          variant_id: selectedVariant?.id || null,
          quantity: qty,
          selected_unit: selectedUnit,
          processing_service_id: selectedProcessing || null,
          price_at_time: currentPrice,
        }),
      });
      window.location.href = '/checkout';
    } catch {}
    setAdding(false);
  };

  const variantWeight = useMemo(() => {
    if (!selectedVariant) return '';
    if (selectedVariant.minWeight && selectedVariant.maxWeight) {
      return `${selectedVariant.minWeight} - ${selectedVariant.maxWeight} kg/con`;
    }
    return selectedVariant.sizeLabel || '';
  }, [selectedVariant]);

  const reviews = product?.reviews || [];

  if (!product) {
    return (
      <>
        <header className="header"><div className="container header-inner"><Link href="/" className="brand"><img src={img('logo.jpg')} alt="Hải Sản Biển Xanh" /></Link></div></header>
        <div className="container detail-page" style={{ padding: '40px 24px' }}>
          <div className="skeleton-card" style={{ height: 400 }} />
        </div>
      </>
    );
  }

  const badgeLabel = product.badge ? (BADGE_MAP[product.badge] || product.badge) : '';

  return (
    <>
      <header className="header">
        <div className="container header-inner">
          <Link href="/" className="brand"><img src={img('logo.jpg')} alt="Hải Sản Biển Xanh" /></Link>
          <CitySelector />
          <div className="searchbox"><Search size={20} /><input placeholder="Tìm kiếm hải sản tươi ngon..." /><button>Tìm kiếm</button></div>
          <Link href="/account" className="header-action"><User size={24} /><span>Tài khoản</span></Link>
          <Link href="/account?tab=favorites" className="header-action"><Heart size={24} /><span>Yêu thích</span></Link>
          <Link href="/cart" className="cart-button"><ShoppingCart size={26} /><span>Giỏ hàng</span></Link>
        </div>
      </header>

      <nav className="nav">
        <div className="container nav-inner">
          <Link href="/products" className="category-menu"><Menu size={22} /> DANH MỤC</Link>
          <Link href="/">Trang chủ</Link>
          <Link href="/products?category=tom">Tôm</Link>
          <Link href="/products?category=cua-ghe">Cua - Ghẹ</Link>
          <Link href="/products?category=ca">Cá</Link>
          <Link href="/products?category=muc">Mực</Link>
          <Link href="/products?category=oc-so">Ốc - Sò</Link>
          <Link href="/products?category=combo">Combo</Link>
        </div>
      </nav>

      <main className="container detail-page">
        <div className="breadcrumb">
          <Link href="/">Trang chủ</Link> <ChevronRight size={14} />
          {product.category && (
            <>
              <Link href={`/products?category=${product.category.slug}`}>{product.category.name}</Link> <ChevronRight size={14} />
            </>
          )}
          <span>{product.name}</span>
        </div>

        <div className="detail-grid">
          {/* LEFT: Gallery */}
          <div>
            <div className="detail-photo">
              {badgeLabel && <span className="badge">{badgeLabel}</span>}
              <img
                src={allImages[activeImage]?.imageUrl || img('prod-ghe.jpg')}
                alt={allImages[activeImage]?.altText || product.name}
              />
              {allImages.length > 1 && (
                <>
                  <button
                    className="pd-nav-btn pd-nav-prev"
                    onClick={() => setActiveImage(i => i > 0 ? i - 1 : allImages.length - 1)}
                  >
                    <ChevronLeft size={22} />
                  </button>
                  <button
                    className="pd-nav-btn pd-nav-next"
                    onClick={() => setActiveImage(i => i < allImages.length - 1 ? i + 1 : 0)}
                  >
                    <ChevronRight size={22} />
                  </button>
                </>
              )}
            </div>
            {allImages.length > 1 && (
              <div className="thumbs">
                {allImages.map((image, i) => (
                  <button key={image.id} onClick={() => setActiveImage(i)}>
                    <img
                      src={image.imageUrl}
                      alt={image.altText || product.name}
                      style={{ border: i === activeImage ? '2px solid var(--blue)' : '2px solid transparent', opacity: i === activeImage ? 1 : 0.6 }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* CENTER: Product Info */}
          <div className="detail-info">
            <h1>{product.name}</h1>

            <div className="detail-rating">
              {[1, 2, 3, 4, 5].map(s => (
                <Star key={s} size={16} fill={s <= Math.round(Number(product.ratingAvg)) ? '#f59e0b' : 'none'} stroke={s <= Math.round(Number(product.ratingAvg)) ? '#f59e0b' : '#d1d5db'} />
              ))}
              <span>{Number(product.ratingAvg)} ({product.ratingCount})</span>
              <i />
              <span>Đã bán {product.soldCount}+</span>
            </div>

            <div className="detail-services">
              <div className="mini-point"><span><Leaf size={18} /></span><b>Tươi sống mỗi ngày</b></div>
              <div className="mini-point"><span><Truck size={18} /></span><b>Giao nhanh 2h</b></div>
              <div className="mini-point"><span><Scale size={18} /></span><b>Cân đúng</b></div>
              <div className="mini-point"><span><RotateCcw size={18} /></span><b>Đổi trả</b></div>
            </div>

            {product.shortDescription && (
              <p className="detail-desc">{product.shortDescription}</p>
            )}

            <table className="spec-table">
              <tbody>
                <tr><td>Xuất xứ</td><td>{product.origin || 'Việt Nam'}</td></tr>
                <tr><td>Tình trạng</td><td><span className="stock"><CheckCircle2 size={14} /> Còn hàng</span></td></tr>
                <tr><td>Bảo quản</td><td>{product.storageInstruction || 'Bảo quản mát 0 - 5°C'}</td></tr>
                <tr><td>Giao hàng</td><td>Giao nhanh trong 2h tại HCM</td></tr>
              </tbody>
            </table>

            {/* Size selector */}
            {product.variants && product.variants.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--muted)', marginBottom: 8 }}>Chọn size</label>
                <div className="size-grid">
                  {product.variants.filter(v => v.isActive !== false).map(v => (
                    <button
                      key={v.id}
                      className={selectedVariant?.id === v.id ? 'active' : ''}
                      onClick={() => setSelectedVariant(v)}
                    >
                      {v.name}
                      {v.minWeight && v.maxWeight && <small>{v.minWeight}-{v.maxWeight}kg</small>}
                      <small>{money(Number(v.price))}</small>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Purchase Card */}
          <div className="buy-card">
            <label>Giá bán</label>
            <div className="detail-price">
              {money(currentPrice)}<small>/{selectedUnit}</small>
              {oldPrice > 0 && <del style={{ fontSize: 14, fontWeight: 600, color: 'var(--muted)', marginLeft: 8 }}>{money(oldPrice)}</del>}
            </div>

            <div className="buy-line">
              <b>Số lượng</b>
              <div className="qty">
                <button onClick={() => setQty(Math.max(1, qty - 1))} disabled={qty <= 1}><Minus size={15} /></button>
                <span>{qty}</span>
                <button onClick={() => setQty(qty + 1)}><Plus size={15} /></button>
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--muted)', marginBottom: 8 }}>Đơn vị</label>
              <div className="chip-grid">
                {UNIT_OPTIONS.map(u => (
                  <button key={u} className={selectedUnit === u ? 'active' : ''} onClick={() => setSelectedUnit(u)}>{u}</button>
                ))}
              </div>
            </div>

            {variantWeight && (
              <div className="buy-line">
                <span>Ước tính</span>
                <b>{variantWeight}</b>
              </div>
            )}

            <div className="buy-row">
              <b>Thành tiền</b>
              <b className="red">{money(totalPrice)}</b>
            </div>

            <button className="cart-cta" onClick={handleAddToCart} disabled={adding}>
              <ShoppingCart size={18} /> {adding ? 'Đang thêm...' : 'THÊM VÀO GIỎ'}
            </button>
            <button className="buy-cta" onClick={handleBuyNow} disabled={adding}>
              MUA NGAY <small style={{ fontWeight: 500, opacity: 0.8, marginLeft: 4 }}>Giao nhanh 2h</small>
            </button>

            {product.processingOptions && product.processingOptions.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--muted)', marginBottom: 8 }}>Chế biến</label>
                <div className="chip-grid">
                  <button className={selectedProcessing === '' ? 'active' : ''} onClick={() => setSelectedProcessing('')}>Để sống</button>
                  {product.processingOptions.map(opt => (
                    <button
                      key={opt.processingService.id}
                      className={selectedProcessing === opt.processingService.id ? 'active' : ''}
                      onClick={() => setSelectedProcessing(opt.processingService.id)}
                    >
                      {opt.processingService.name}
                      {Number(opt.processingService.price) > 0 && <small> +{money(Number(opt.processingService.price))}</small>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginTop: 16, padding: 12, background: 'var(--green-light)', borderRadius: 8, fontSize: 13, fontWeight: 600, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={18} />
              <div>
                <div>Giao nhanh trong ngày</div>
                <select
                  value={deliverySlot}
                  onChange={e => setDeliverySlot(e.target.value)}
                  style={{ border: 'none', background: 'transparent', fontWeight: 700, fontSize: 13, color: 'var(--green)', cursor: 'pointer', padding: 0 }}
                >
                  <option value="today-16-18">Hôm nay 16:00 - 18:00</option>
                  <option value="today-18-20">Hôm nay 18:00 - 20:00</option>
                  <option value="tomorrow-08-10">Ngày mai 08:00 - 10:00</option>
                  <option value="tomorrow-14-16">Ngày mai 14:00 - 16:00</option>
                </select>
              </div>
            </div>

            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { icon: <CheckCircle2 size={15} />, text: 'Miễn phí giao đơn từ 500k' },
                { icon: <RotateCcw size={15} />, text: 'Đổi trả nếu không tươi' },
                { icon: <ShieldCheck size={15} />, text: 'Cam kết đúng hàng' },
                { icon: <MessageCircle size={15} />, text: 'Tư vấn 24/7' },
              ].map((t, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                  <span style={{ color: 'var(--green)' }}>{t.icon}</span> {t.text}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ===== TABS SECTION ===== */}
        <div style={{ marginTop: 32 }}>
          <div className="pd-tabs-layout">
            <div>
              <div style={{ display: 'flex', borderBottom: '2px solid var(--line)', marginBottom: 24 }}>
                {['Chi tiết sản phẩm', 'Hướng dẫn chế biến', `Đánh giá (${reviews.length})`, 'Hỏi đáp'].map((label, i) => (
                  <button
                    key={label}
                    className={`pd-tab-btn ${activeTab === i ? 'active' : ''}`}
                    onClick={() => setActiveTab(i)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: 24 }}>
                {activeTab === 0 && (
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>{product.name}</h3>
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 16 }}>
                      {product.description || product.shortDescription || 'Hải sản tươi sống, chất lượng cao, đánh bắt mỗi ngày.'}
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
                          Để {product.name.toLowerCase().split(' ')[0]} ngon nhất, bạn nên hấp hoặc luộc với sả, gừng, bia khoảng 15 phút. Chấm muối tiêu chanh rất ngon!
                        </p>
                      </div>
                      <img src={allImages[0]?.imageUrl || img('prod-ghe.jpg')} alt="Mẹo" style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
                    </div>
                  </div>
                )}

                {activeTab === 1 && (
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>Hướng dẫn chế biến</h3>
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                      {product.description || 'Sắp xếp hướng dẫn chế biến chi tiết cho sản phẩm này.'}
                    </p>
                  </div>
                )}

                {activeTab === 2 && (
                  <div>
                    {reviews.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                        <Star size={48} strokeWidth={1} color="#d1d5db" />
                        <p style={{ marginTop: 12, color: 'var(--muted)' }}>Chưa có đánh giá nào</p>
                      </div>
                    ) : (
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
                    )}
                  </div>
                )}

                {activeTab === 3 && (
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>Hỏi đáp</h3>
                    <p style={{ fontSize: 14, color: 'var(--muted)' }}>Chưa có câu hỏi nào. Hãy là người đầu tiên đặt câu hỏi!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="pd-tabs-sidebar">
              <div className="pd-sidebar-card">
                <h4>Tại sao mua tại Hải Sản Biển Xanh?</h4>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { icon: <CheckCircle2 size={16} />, text: 'Hải sản tươi sống 100%' },
                    { icon: <Truck size={16} />, text: 'Giao hàng nhanh trong 2h' },
                    { icon: <ShieldCheck size={16} />, text: 'Đổi trả nếu không tươi' },
                    { icon: <Scale size={16} />, text: 'Cân đúng, giá rõ ràng' },
                    { icon: <Award size={16} />, text: 'Cam kết chất lượng' },
                    { icon: <MessageCircle size={16} />, text: 'Tư vấn 24/7' },
                  ].map((item, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                      <span style={{ color: 'var(--green)' }}>{item.icon}</span> {item.text}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* ===== RELATED PRODUCTS ===== */}
        {related.filter(r => r.slug !== slug).length > 0 && (
          <section style={{ marginTop: 36 }}>
            <div className="section-title">
              <div>
                <h2>SẢN PHẨM THƯỜNG MUA CÙNG</h2>
                <div className="section-title-line" />
              </div>
              <Link href="/products" className="section-link">Xem tất cả <ChevronRight size={16} /></Link>
            </div>
            <div className="product-grid">
              {related.filter(r => r.slug !== slug).slice(0, 4).map(rp => (
                <article className="product-card" key={rp.id}>
                  <Link href={`/products/${rp.slug}`} className="product-image">
                    <img src={rp.images?.[0]?.imageUrl || img('prod-tom.jpg')} alt={rp.name} />
                  </Link>
                  <div className="product-body">
                    <Link href={`/products/${rp.slug}`} className="product-name">{rp.name}</Link>
                    <div className="price-row">
                      <b>{money(Number(rp.basePrice))}</b>
                      <em>/{rp.unit}</em>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="site-footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="footer-logo">
                <div className="footer-logo-icon"><Fish size={24} /></div>
                <span>HẢI SẢN BIỂN XANH</span>
              </div>
              <p>Hải sản tươi sống đánh bắt mỗi ngày, giao hàng nhanh trong 2 giờ tại TP.HCM, Hà Nội & Đà Nẵng.</p>
              <div className="footer-social">
                <a href="#" className="social-link"><Phone size={18} /></a>
              </div>
            </div>
            <div className="footer-links">
              <h4>Sản phẩm</h4>
              <Link href="/products?category=tom">Tôm tươi sống</Link>
              <Link href="/products?category=cua-ghe">Cua — Ghẹ</Link>
              <Link href="/products?category=ca">Cá biển tươi</Link>
              <Link href="/products?category=combo">Combo tiết kiệm</Link>
            </div>
            <div className="footer-links">
              <h4>Hỗ trợ</h4>
              <Link href="/account?tab=orders">Theo dõi đơn hàng</Link>
              <Link href="/account">Tài khoản của tôi</Link>
              <Link href="/products">Chính sách đổi trả</Link>
            </div>
            <div className="footer-contact">
              <h4>Hệ thống cửa hàng</h4>
              <div className="contact-item"><MapPin size={16} /><div><b>TP. Hồ Chí Minh</b><span>123 Đường Biển, Q.1</span></div></div>
              <div className="contact-item"><MapPin size={16} /><div><b>Hà Nội</b><span>45 Phố Biển, Hoàn Kiếm</span></div></div>
              <div className="contact-item"><MapPin size={16} /><div><b>Đà Nẵng</b><span>78 Bạch Đằng, Hải Châu</span></div></div>
              <div className="contact-item"><Phone size={16} /><div><b>Hotline</b><span>0901 234 567</span></div></div>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© 2026 Hải Sản Biển Xanh. Tất cả quyền được bảo lưu.</span>
            <div className="footer-bottom-links">
              <Link href="#">Chính sách bảo mật</Link>
              <Link href="#">Điều khoản sử dụng</Link>
            </div>
          </div>
        </div>
      </footer>

      <div className="bottom-nav">
        <Link href="/"><Home size={22} />Trang chủ</Link>
        <Link href="/products"><Menu size={22} />Danh mục</Link>
        <Link href="/cart"><ShoppingCart size={22} />Giỏ hàng</Link>
        <Link href="/account?tab=favorites"><Heart size={22} />Yêu thích</Link>
        <Link href="/account"><User size={22} />Tài khoản</Link>
      </div>
    </>
  );
}
