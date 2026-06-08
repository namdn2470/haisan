'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search, Filter, AlertTriangle, CheckCircle, XCircle,
  Star, Trash2, Image as ImageIcon, MessageSquare, X,
} from 'lucide-react';
import { useToast, useConfirm } from '../layout';
import { fetchReviews, updateReviewStatus, deleteReview, fetchProducts } from '@/lib/admin/api';

const REVIEW_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: 'Chờ duyệt', color: '#d97706', bg: '#fffbeb' },
  APPROVED: { label: 'Đã duyệt', color: '#10b981', bg: '#d1fae5' },
  REJECTED: { label: 'Đã ẩn', color: '#6b7280', bg: '#f1f5f9' },
};

interface Review {
  id: string;
  productId: string;
  productName: string;
  userId: string;
  customerName: string;
  rating: number;
  comment: string;
  images: any[];
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface Product {
  id: string;
  name: string;
}

function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {[1, 2, 3, 4, 5].map(star => (
        <Star
          key={star}
          size={size}
          fill={star <= rating ? '#f59e0b' : 'none'}
          color={star <= rating ? '#f59e0b' : '#e2e8f0'}
        />
      ))}
    </div>
  );
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function truncate(str: string, maxLen: number): string {
  if (!str || str.length <= maxLen) return str || '';
  return str.slice(0, maxLen) + '...';
}

export default function ReviewsPage() {
  const { success, error: showError } = useToast();
  const { confirm } = useConfirm();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState('');
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const limit = 10;

  const loadReviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchReviews({
        status: statusFilter || undefined,
        productId: productFilter || undefined,
        search: search || undefined,
        rating: ratingFilter ? parseInt(ratingFilter) : undefined,
        page,
        limit,
      }) as { data: Review[]; total: number };
      setReviews(result.data || []);
      setTotal(result.total || 0);
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách đánh giá');
      showError(err.message || 'Không thể tải danh sách đánh giá');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, productFilter, ratingFilter, search, page, showError]);

  const loadProducts = useCallback(async () => {
    try {
      const result = await fetchProducts({ limit: 100 }) as { data: Product[] };
      setProducts(result.data || []);
    } catch {
      // Silently fail
    }
  }, []);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (searchTimeout) clearTimeout(searchTimeout);
    const timeout = setTimeout(() => {
      setPage(1);
      loadReviews();
    }, 400);
    setSearchTimeout(timeout);
  };

  const handleStatusChange = (review: Review, newStatus: string) => {
    const statusLabels: Record<string, string> = {
      APPROVED: 'Duyệt đánh giá',
      REJECTED: 'Ẩn đánh giá',
    };
    const actionLabel = statusLabels[newStatus] || newStatus;
    const messages: Record<string, string> = {
      APPROVED: `Duyệt đánh giá của "${review.customerName}" cho sản phẩm "${review.productName}"? Đánh giá sẽ hiển thị trên website.`,
      REJECTED: `Ẩn đánh giá của "${review.customerName}" cho sản phẩm "${review.productName}"?`,
    };

    confirm({
      title: actionLabel,
      message: messages[newStatus] || `${actionLabel}?`,
      confirmText: actionLabel,
      type: newStatus === 'APPROVED' ? 'info' : 'warning',
      onConfirm: async () => {
        try {
          await updateReviewStatus(review.id, newStatus);
          success(newStatus === 'APPROVED' ? 'Đã duyệt đánh giá' : 'Đã ẩn đánh giá');
          loadReviews();
        } catch (err: any) {
          showError(err.message || 'Không thể cập nhật trạng thái');
        }
      },
    });
  };

  const handleDelete = (review: Review) => {
    confirm({
      title: 'Xóa đánh giá',
      message: `Xóa vĩnh viễn đánh giá của "${review.customerName}" cho sản phẩm "${review.productName}"? Hành động này không thể hoàn tác.`,
      confirmText: 'Xóa',
      cancelText: 'Hủy',
      type: 'danger',
      onConfirm: async () => {
        try {
          await deleteReview(review.id);
          success('Đã xóa đánh giá');
          loadReviews();
        } catch (err: any) {
          showError(err.message || 'Không thể xóa đánh giá');
        }
      },
    });
  };

  const openDetail = (review: Review) => {
    setSelectedReview(review);
    setShowDetailModal(true);
  };

  const closeDetail = () => {
    setShowDetailModal(false);
    setSelectedReview(null);
  };

  const totalPages = Math.ceil(total / limit);
  const startItem = total > 0 ? (page - 1) * limit + 1 : 0;
  const endItem = Math.min(page * limit, total);

  return (
    <div className="adm-page">
      {/* Page Header */}
      <div className="adm-page-header">
        <div>
          <h2>Quản lý Đánh giá Sản phẩm</h2>
          <p>{total} đánh giá</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="adm-toolbar">
        <div className="adm-search-wrap">
          <Search size={16} />
          <input
            type="text"
            placeholder="Tìm theo khách hàng, sản phẩm, nội dung..."
            value={search}
            onChange={e => handleSearchChange(e.target.value)}
            className="adm-search-input"
          />
        </div>
        <button
          className={`adm-btn-filter ${showFilters ? 'active' : ''}`}
          onClick={() => setShowFilters(f => !f)}
        >
          <Filter size={15} />
          Bộ lọc
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="adm-filter-row">
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); loadReviews(); }}
            className="adm-select"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="PENDING">Chờ duyệt</option>
            <option value="APPROVED">Đã duyệt</option>
            <option value="REJECTED">Đã ẩn</option>
          </select>
          <select
            value={productFilter}
            onChange={e => { setProductFilter(e.target.value); setPage(1); loadReviews(); }}
            className="adm-select"
          >
            <option value="">Tất cả sản phẩm</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <select
            value={ratingFilter}
            onChange={e => { setRatingFilter(e.target.value); setPage(1); loadReviews(); }}
            className="adm-select"
          >
            <option value="">Tất cả sao</option>
            <option value="5">5 sao</option>
            <option value="4">4 sao</option>
            <option value="3">3 sao</option>
            <option value="2">2 sao</option>
            <option value="1">1 sao</option>
          </select>
          {(statusFilter || productFilter || ratingFilter) && (
            <button
              className="adm-btn-ghost"
              onClick={() => {
                setStatusFilter('');
                setProductFilter('');
                setRatingFilter('');
                setPage(1);
                loadReviews();
              }}
            >
              Xóa lọc
            </button>
          )}
        </div>
      )}

      {/* Table */}
      <div className="adm-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="adm-loading-spinner" style={{ padding: 60 }} />
        ) : error ? (
          <div className="adm-error">
            <div className="adm-error-icon"><AlertTriangle size={24} /></div>
            <h3 className="adm-error-title">Đã xảy ra lỗi</h3>
            <p className="adm-error-desc">{error}</p>
            <button className="adm-error-retry" onClick={loadReviews}>Thử lại</button>
          </div>
        ) : reviews.length === 0 ? (
          <div className="adm-empty">
            <div className="adm-empty-icon"><Star size={32} /></div>
            <p className="adm-empty-title">Không có đánh giá nào</p>
            <p className="adm-empty-desc">
              {search || statusFilter || productFilter || ratingFilter
                ? 'Không tìm thấy đánh giá phù hợp'
                : 'Chưa có đánh giá nào từ khách hàng'}
            </p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="adm-table">
                <thead>
                  <tr>
                    <th style={{ width: 50 }}>#</th>
                    <th>Sản phẩm</th>
                    <th>Khách hàng</th>
                    <th style={{ width: 100 }}>Sao</th>
                    <th>Nhận xét</th>
                    <th style={{ width: 110 }}>Trạng thái</th>
                    <th style={{ width: 100 }}>Ngày</th>
                    <th style={{ width: 120, textAlign: 'center' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.map((review, idx) => {
                    const st = REVIEW_STATUS[review.status] || {
                      label: review.status,
                      color: '#64748b',
                      bg: '#f1f5f9',
                    };
                    const hasImages = review.images && Array.isArray(review.images) && review.images.length > 0;

                    return (
                      <tr key={review.id}>
                        <td>
                          <span style={{ color: '#94a3b8', fontSize: 12 }}>
                            {(page - 1) * limit + idx + 1}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: '#0f172a', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {review.productName}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 500, color: '#334155' }}>
                            {review.customerName}
                          </div>
                        </td>
                        <td>
                          <StarRating rating={review.rating} />
                        </td>
                        <td>
                          <div style={{ maxWidth: 200 }}>
                            <div
                              className="adm-desc-cell"
                              style={{ cursor: 'pointer' }}
                              onClick={() => openDetail(review)}
                              title="Nhấn để xem chi tiết"
                            >
                              {review.comment ? truncate(review.comment, 50) : <span style={{ color: '#cbd5e1', fontStyle: 'italic' }}>Không có nhận xét</span>}
                            </div>
                            {hasImages && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                                <ImageIcon size={12} style={{ color: '#94a3b8' }} />
                                <span style={{ fontSize: 11, color: '#94a3b8' }}>
                                  {review.images.length} ảnh
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <span
                            className="adm-status-badge"
                            style={{ color: st.color, background: st.bg }}
                          >
                            {st.label}
                          </span>
                        </td>
                        <td>
                          <span className="adm-date-cell">
                            {formatDate(review.createdAt)}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                            <button
                              className="adm-action-trigger"
                              title="Xem chi tiết"
                              onClick={() => openDetail(review)}
                            >
                              <MessageSquare size={15} />
                            </button>
                            {review.status === 'PENDING' && (
                              <>
                                <button
                                  className="adm-action-trigger"
                                  title="Duyệt"
                                  style={{ color: '#10b981' }}
                                  onClick={() => handleStatusChange(review, 'APPROVED')}
                                >
                                  <CheckCircle size={15} />
                                </button>
                                <button
                                  className="adm-action-trigger"
                                  title="Từ chối"
                                  style={{ color: '#ef4444' }}
                                  onClick={() => handleStatusChange(review, 'REJECTED')}
                                >
                                  <XCircle size={15} />
                                </button>
                              </>
                            )}
                            {review.status === 'APPROVED' && (
                              <button
                                className="adm-action-trigger"
                                title="Ẩn đánh giá"
                                style={{ color: '#f59e0b' }}
                                onClick={() => handleStatusChange(review, 'REJECTED')}
                              >
                                <XCircle size={15} />
                              </button>
                            )}
                            {review.status === 'REJECTED' && (
                              <button
                                className="adm-action-trigger"
                                title="Hiện lại đánh giá"
                                style={{ color: '#10b981' }}
                                onClick={() => handleStatusChange(review, 'APPROVED')}
                              >
                                <CheckCircle size={15} />
                              </button>
                            )}
                            <button
                              className="adm-action-trigger"
                              title="Xóa"
                              style={{ color: '#ef4444' }}
                              onClick={() => handleDelete(review)}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {total > 0 && (
              <div className="adm-pagination">
                <span className="adm-pagination-info">
                  Hiển thị {startItem} - {endItem} trong {total} đánh giá
                </span>
                <div className="adm-pagination-buttons">
                  <button
                    className="adm-pagination-btn"
                    disabled={page <= 1}
                    onClick={() => setPage(p => p - 1)}
                  >
                    ‹
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        className={`adm-pagination-btn ${page === pageNum ? 'active' : ''}`}
                        onClick={() => setPage(pageNum)}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  {totalPages > 5 && <span className="adm-pagination-ellipsis">...</span>}
                  <button
                    className="adm-pagination-btn"
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => p + 1)}
                  >
                    ›
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedReview && (
        <div className="adm-modal-overlay" onClick={e => e.target === e.currentTarget && closeDetail()}>
          <div className="adm-modal">
            <div className="adm-modal-header">
              <h3>Chi tiết đánh giá</h3>
              <button className="adm-modal-close" onClick={closeDetail}>
                <X size={18} />
              </button>
            </div>
            <div className="adm-modal-body" style={{ padding: 20, maxHeight: 'calc(100vh - 220px)', overflowY: 'auto' as const }}>
              {/* Product & Customer */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>Sản phẩm</label>
                    <div style={{ fontWeight: 600, color: '#0f172a', marginTop: 4 }}>{selectedReview.productName}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>Khách hàng</label>
                    <div style={{ fontWeight: 600, color: '#0f172a', marginTop: 4 }}>{selectedReview.customerName}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>Số sao</label>
                    <div style={{ marginTop: 4 }}><StarRating rating={selectedReview.rating} size={18} /></div>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>Trạng thái</label>
                    <div style={{ marginTop: 4 }}>
                      {(() => {
                        const st = REVIEW_STATUS[selectedReview.status] || { label: selectedReview.status, color: '#64748b', bg: '#f1f5f9' };
                        return (
                          <span className="adm-status-badge" style={{ color: st.color, background: st.bg }}>
                            {st.label}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>Ngày đánh giá</label>
                    <div style={{ marginTop: 4, color: '#64748b' }}>{formatDate(selectedReview.createdAt)}</div>
                  </div>
                </div>
              </div>

              {/* Comment */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>Nhận xét</label>
                <div style={{
                  marginTop: 8,
                  padding: 12,
                  background: '#f8fafc',
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                  color: '#334155',
                  lineHeight: 1.6,
                  fontSize: 14,
                }}>
                  {selectedReview.comment || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Không có nhận xét</span>}
                </div>
              </div>

              {/* Images */}
              {selectedReview.images && Array.isArray(selectedReview.images) && selectedReview.images.length > 0 && (
                <div>
                  <label style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
                    Hình ảnh ({selectedReview.images.length})
                  </label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const, marginTop: 8 }}>
                    {selectedReview.images.map((img: string, i: number) => (
                      <div key={i} style={{
                        width: 80,
                        height: 80,
                        borderRadius: 8,
                        overflow: 'hidden',
                        border: '1px solid #e2e8f0',
                      }}>
                        <img
                          src={img}
                          alt={`Review image ${i + 1}`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' as const }}
                          onError={e => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="adm-modal-footer">
              {selectedReview.status === 'PENDING' && (
                <>
                  <button
                    className="adm-btn-danger"
                    onClick={() => {
                      handleStatusChange(selectedReview, 'REJECTED');
                      closeDetail();
                    }}
                  >
                    Từ chối
                  </button>
                  <button
                    className="adm-btn-primary"
                    onClick={() => {
                      handleStatusChange(selectedReview, 'APPROVED');
                      closeDetail();
                    }}
                  >
                    Duyệt đánh giá
                  </button>
                </>
              )}
              {selectedReview.status === 'APPROVED' && (
                <>
                  <button
                    className="adm-btn-secondary"
                    onClick={() => {
                      handleDelete(selectedReview);
                      closeDetail();
                    }}
                    style={{ color: '#ef4444', borderColor: '#ef4444' }}
                  >
                    Xóa
                  </button>
                  <button
                    className="adm-btn-secondary"
                    onClick={() => {
                      handleStatusChange(selectedReview, 'REJECTED');
                      closeDetail();
                    }}
                  >
                    Ẩn đánh giá
                  </button>
                </>
              )}
              {selectedReview.status === 'REJECTED' && (
                <>
                  <button
                    className="adm-btn-secondary"
                    onClick={() => {
                      handleDelete(selectedReview);
                      closeDetail();
                    }}
                    style={{ color: '#ef4444', borderColor: '#ef4444' }}
                  >
                    Xóa
                  </button>
                  <button
                    className="adm-btn-primary"
                    onClick={() => {
                      handleStatusChange(selectedReview, 'APPROVED');
                      closeDetail();
                    }}
                  >
                    Hiện lại
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
