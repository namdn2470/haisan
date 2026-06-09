'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, Filter, Edit2, Trash2, AlertTriangle,
  FileText, Eye, EyeOff,
} from 'lucide-react';
import { useToast, useConfirm } from '../layout';
import {
  fetchPosts,
  fetchPostById,
  createPost,
  updatePost,
  deletePost,
} from '@/lib/admin/api';
import PostFormModal from '@/components/admin/posts/PostFormModal';
import type { PostFormData } from '@/components/admin/posts/PostFormModal';

interface Post {
  id: string;
  title: string;
  slug: string;
  thumbnailUrl?: string;
  excerpt?: string;
  content?: string;
  status: string;
  authorId?: string;
  authorName?: string;
  seoTitle?: string;
  seoDescription?: string;
  viewCount?: number;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

const POST_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  PUBLISHED: { label: 'Đã đăng', color: '#10b981', bg: '#d1fae5' },
  DRAFT: { label: 'Bản nháp', color: '#6b7280', bg: '#f1f5f9' },
  HIDDEN: { label: 'Đã ẩn', color: '#f59e0b', bg: '#fef3c7' },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const EMPTY_POST_FORM: PostFormData = {
  title: '',
  slug: '',
  thumbnailUrl: '',
  excerpt: '',
  content: '',
  status: 'DRAFT',
  seoTitle: '',
  seoDescription: '',
};

export default function PostsPage() {
  const { success, error: showError } = useToast();
  const { confirm } = useConfirm();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [form, setForm] = useState<PostFormData>(EMPTY_POST_FORM);
  const [saving, setSaving] = useState(false);
  const [slugManual, setSlugManual] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const limit = 10;

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchPosts({
        status: statusFilter || undefined,
        page,
        limit,
      });
      setPosts(result.data || []);
      setTotal(result.total || 0);
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách bài viết');
      showError(err.message || 'Không thể tải danh sách bài viết');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page, showError]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (searchTimeout) clearTimeout(searchTimeout);
    const timeout = setTimeout(() => {
      setPage(1);
      loadPostsWithSearch(value);
    }, 400);
    setSearchTimeout(timeout);
  };

  const loadPostsWithSearch = async (searchVal: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchPosts({
        search: searchVal || undefined,
        status: statusFilter || undefined,
        page: 1,
        limit,
      });
      setPosts(result.data || []);
      setTotal(result.total || 0);
    } catch (err: any) {
      showError(err.message || 'Không thể tải danh sách bài viết');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setForm(EMPTY_POST_FORM);
    setSlugManual(false);
    setFormErrors({});
    setModalMode('create');
    setEditingPost(null);
    setShowModal(true);
  };

  const openEdit = async (post: Post) => {
    try {
      const res = await fetchPostById(post.id);
      const data = res.data;
      setEditingPost(data);
      setForm({
        title: data.title || '',
        slug: data.slug || '',
        thumbnailUrl: data.thumbnailUrl || '',
        excerpt: data.excerpt || '',
        content: data.content || '',
        status: data.status || 'DRAFT',
        seoTitle: data.seoTitle || '',
        seoDescription: data.seoDescription || '',
      });
      setSlugManual(true);
      setFormErrors({});
      setModalMode('edit');
      setShowModal(true);
    } catch {
      showError('Không thể tải thông tin bài viết');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingPost(null);
    setForm(EMPTY_POST_FORM);
    setFormErrors({});
  };

  const handleFormChange = (field: string, value: string) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'title' && !slugManual) {
        next.slug = slugify(value);
      }
      return next;
    });
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.title.trim()) errors.title = 'Tiêu đề là bắt buộc';
    if (!form.slug.trim()) errors.slug = 'Slug là bắt buộc';
    if (!/^[a-z0-9-]+$/.test(form.slug)) errors.slug = 'Slug chỉ chứa chữ thường, số và dấu gạch ngang';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        slug: form.slug.trim(),
        thumbnailUrl: form.thumbnailUrl.trim() || null,
        excerpt: form.excerpt.trim() || null,
        content: form.content || null,
        status: form.status,
        seoTitle: form.seoTitle.trim() || null,
        seoDescription: form.seoDescription.trim() || null,
      };

      if (modalMode === 'create') {
        await createPost(payload);
        success('Đã tạo bài viết mới');
      } else {
        await updatePost(editingPost!.id, payload);
        success('Đã cập nhật bài viết');
      }

      closeModal();
      loadPosts();
    } catch (err: any) {
      showError(err.message || 'Không thể lưu bài viết');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = (post: Post) => {
    const nextStatus = post.status === 'PUBLISHED' ? 'HIDDEN' : post.status === 'HIDDEN' ? 'PUBLISHED' : 'PUBLISHED';
    const actions: Record<string, string> = {
      PUBLISHED: 'Ẩn bài viết',
      HIDDEN: 'Hiện bài viết',
      DRAFT: 'Xuất bản',
    };
    const titles: Record<string, string> = {
      PUBLISHED: 'Ẩn bài viết',
      HIDDEN: 'Hiện bài viết',
      DRAFT: 'Xuất bản bài viết',
    };
    const messages: Record<string, string> = {
      PUBLISHED: `Ẩn bài viết "${post.title}"? Bài viết sẽ không hiển thị trên website.`,
      HIDDEN: `Hiện bài viết "${post.title}"? Bài viết sẽ được công khai.`,
      DRAFT: `Xuất bản bài viết "${post.title}"? Bài viết sẽ hiển thị trên website.`,
    };
    confirm({
      title: titles[nextStatus],
      message: messages[nextStatus],
      confirmText: actions[nextStatus],
      type: 'warning',
      onConfirm: async () => {
        try {
          await updatePost(post.id, { status: nextStatus });
          success(actions[nextStatus] + ' thành công');
          loadPosts();
        } catch (err: any) {
          showError(err.message || 'Không thể cập nhật trạng thái');
        }
      },
    });
  };

  const handleDelete = (post: Post) => {
    confirm({
      title: 'Xóa bài viết',
      message: `Xóa vĩnh viễn bài viết "${post.title}"? Hành động này không thể hoàn tác.`,
      confirmText: 'Xóa',
      cancelText: 'Hủy',
      type: 'danger',
      onConfirm: async () => {
        try {
          await deletePost(post.id);
          success('Đã xóa bài viết');
          loadPosts();
        } catch (err: any) {
          showError(err.message || 'Không thể xóa bài viết');
        }
      },
    });
  };

  const totalPages = Math.ceil(total / limit);
  const startItem = total > 0 ? (page - 1) * limit + 1 : 0;
  const endItem = Math.min(page * limit, total);

  return (
    <div className="adm-page">
      {/* Page Header */}
      <div className="adm-page-header">
        <div>
          <h2>Quản lý Bài viết</h2>
          <p>{total} bài viết</p>
        </div>
        <button className="adm-btn-primary" onClick={openCreate}>
          <Plus size={16} />
          Thêm Bài viết
        </button>
      </div>

      {/* Toolbar */}
      <div className="adm-toolbar">
        <div className="adm-search-wrap">
          <Search size={16} />
          <input
            type="text"
            placeholder="Tìm kiếm bài viết..."
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
            onChange={e => { setStatusFilter(e.target.value); setPage(1); loadPostsWithSearch(search); }}
            className="adm-select"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="PUBLISHED">Đã đăng</option>
            <option value="DRAFT">Bản nháp</option>
            <option value="HIDDEN">Đã ẩn</option>
          </select>
          {statusFilter && (
            <button
              className="adm-btn-ghost"
              onClick={() => { setStatusFilter(''); setPage(1); loadPostsWithSearch(search); }}
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
            <button className="adm-error-retry" onClick={loadPosts}>Thử lại</button>
          </div>
        ) : posts.length === 0 ? (
          <div className="adm-empty">
            <div className="adm-empty-icon"><FileText size={32} /></div>
            <p className="adm-empty-title">Không có bài viết nào</p>
            <p className="adm-empty-desc">
              {search || statusFilter
                ? 'Không tìm thấy bài viết phù hợp'
                : 'Bắt đầu bằng cách thêm bài viết đầu tiên'}
            </p>
            {!search && !statusFilter && (
              <button className="adm-btn-primary" style={{ marginTop: 12 }} onClick={openCreate}>
                <Plus size={16} /> Thêm Bài viết
              </button>
            )}
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="adm-table">
                <thead>
                  <tr>
                    <th style={{ width: 70 }}>Ảnh</th>
                    <th>Tiêu đề</th>
                    <th style={{ width: 110 }}>Trạng thái</th>
                    <th style={{ width: 80 }}>Lượt xem</th>
                    <th style={{ width: 120 }}>Ngày tạo</th>
                    <th style={{ width: 120, textAlign: 'center' as const }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map(post => {
                    const st = POST_STATUS[post.status] || {
                      label: post.status,
                      color: '#64748b',
                      bg: '#f1f5f9',
                    };

                    return (
                      <tr key={post.id}>
                        <td>
                          <div style={{
                            width: 48,
                            height: 36,
                            borderRadius: 6,
                            overflow: 'hidden',
                            background: '#f1f5f9',
                            flexShrink: 0,
                          }}>
                            {post.thumbnailUrl ? (
                              <img
                                src={post.thumbnailUrl}
                                alt={post.title}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' as const }}
                              />
                            ) : (
                              <div style={{
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#cbd5e1',
                              }}>
                                <FileText size={18} />
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <div>
                            <div style={{
                              fontWeight: 600,
                              color: '#0f172a',
                              maxWidth: 280,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap' as const,
                            }}>
                              {post.title}
                            </div>
                            <div style={{ fontSize: 11, color: '#94a3b8' }}>
                              /{post.slug}
                            </div>
                            {post.excerpt && (
                              <div style={{
                                fontSize: 12,
                                color: '#64748b',
                                maxWidth: 280,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap' as const,
                                marginTop: 2,
                              }}>
                                {post.excerpt}
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
                          <span style={{ color: '#64748b', fontSize: 13 }}>
                            {post.viewCount || 0}
                          </span>
                        </td>
                        <td>
                          <span className="adm-date-cell">
                            {formatDate(post.createdAt)}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                            <button
                              className="adm-action-trigger"
                              title="Sửa"
                              onClick={() => openEdit(post)}
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              className="adm-action-trigger"
                              title={post.status === 'PUBLISHED' ? 'Ẩn' : post.status === 'HIDDEN' ? 'Hiện' : 'Xuất bản'}
                              onClick={() => handleToggleStatus(post)}
                            >
                              {post.status === 'PUBLISHED' ? (
                                <EyeOff size={15} />
                              ) : (
                                <Eye size={15} />
                              )}
                            </button>
                            <button
                              className="adm-action-trigger"
                              title="Xóa"
                              style={{ color: '#ef4444' }}
                              onClick={() => handleDelete(post)}
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
                  Hiển thị {startItem} - {endItem} trong {total} bài viết
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

      {/* Post Form Modal */}
      <PostFormModal
        isOpen={showModal}
        mode={modalMode}
        form={form}
        slugManual={slugManual}
        formErrors={formErrors}
        saving={saving}
        onClose={closeModal}
        onChange={handleFormChange}
        onSlugManualChange={setSlugManual}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
