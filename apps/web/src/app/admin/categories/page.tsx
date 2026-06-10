'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, Tag, Edit2, Trash2, AlertTriangle, FolderTree,
  Eye, EyeOff, Image as ImageIcon, ChevronUp, ChevronDown,
} from 'lucide-react';
import { useToast, useConfirm } from '../layout-client';
import {
  fetchCategories, fetchCategoryById, createCategory, updateCategory, deleteCategory,
} from '@/lib/admin/api';
import CategoryFormModal, { type CategoryFormValues } from '@/components/admin/categories/CategoryFormModal';

interface Category {
  id: string;
  name: string;
  slug: string;
  iconUrl?: string;
  imageUrl?: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
  parentId?: string;
  _count?: { products: number };
  children?: Category[];
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

const SAMPLE_CATEGORIES = [
  { name: 'Tôm', slug: 'tom' },
  { name: 'Cua - Ghẹ', slug: 'cua-ghe' },
  { name: 'Cá', slug: 'ca' },
  { name: 'Mực', slug: 'muc' },
  { name: 'Ốc - Sò', slug: 'oc-so' },
  { name: 'Combo', slug: 'combo' },
  { name: 'Khuyến mãi', slug: 'khuyen-mai' },
];

export default function CategoriesPage() {
  const { success, error: showError } = useToast();
  const { confirm } = useConfirm();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [modalInitialData, setModalInitialData] = useState<Partial<CategoryFormValues> | undefined>(undefined);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchCategories();
      setCategories(result.data || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể tải danh mục';
      setError(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const filtered = categories.filter(c =>
    !search ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.slug.toLowerCase().includes(search.toLowerCase())
  );

  const rootCategories = filtered.filter(c => !c.parentId);
  const getChildren = (parentId: string) => filtered.filter(c => c.parentId === parentId);

  const getParentOptions = () => {
    const flatten = (cats: Category[], depth = 0): { id: string; name: string; depth: number }[] => {
      let result: { id: string; name: string; depth: number }[] = [];
      for (const cat of cats) {
        if (editingCategory && cat.id === editingCategory.id) continue;
        result.push({ id: cat.id, name: cat.name, depth });
        if (cat.children?.length) {
          result = result.concat(flatten(cat.children, depth + 1));
        }
      }
      return result;
    };
    return flatten(categories);
  };

  const openAddModal = () => {
    setEditingCategory(null);
    setModalInitialData(undefined);
    setShowModal(true);
  };

  const openEditModal = async (cat: Category) => {
    try {
      const result = await fetchCategoryById(cat.id);
      const fullCat = result.data ?? result;
      setEditingCategory(fullCat);
      setModalInitialData({
        name: fullCat.name || '',
        slug: fullCat.slug || '',
        parentId: fullCat.parentId || '',
        description: fullCat.description || '',
        imageUrl: fullCat.imageUrl || '',
        iconUrl: fullCat.iconUrl || '',
        sortOrder: String(fullCat.sortOrder ?? ''),
        isActive: fullCat.isActive !== false,
      });
      setShowModal(true);
    } catch {
      showError('Không thể tải thông tin danh mục');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setModalInitialData(undefined);
  };

  const handleModalSubmit = async (values: CategoryFormValues) => {
    const payload = {
      name: values.name.trim(),
      slug: values.slug.trim() || slugify(values.name),
      parentId: values.parentId || null,
      description: values.description.trim() || null,
      imageUrl: values.imageUrl || null,
      iconUrl: values.iconUrl || null,
      sortOrder: values.sortOrder ? Number(values.sortOrder) : undefined,
      isActive: values.isActive,
    };

    if (editingCategory) {
      await updateCategory(editingCategory.id, payload);
      success('Đã cập nhật danh mục');
    } else {
      await createCategory(payload);
      success('Đã thêm danh mục mới');
    }
    loadCategories();
  };

  const handleToggleActive = async (cat: Category) => {
    try {
      await updateCategory(cat.id, { isActive: !cat.isActive });
      success(!cat.isActive ? 'Đã hiển thị danh mục' : 'Đã ẩn danh mục');
      loadCategories();
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Không thể cập nhật trạng thái');
    }
  };

  const handleDelete = (cat: Category) => {
    const hasChildren = categories.some(c => c.parentId === cat.id);
    confirm({
      title: 'Xóa danh mục',
      message: hasChildren
        ? `Danh mục "${cat.name}" có danh mục con. Bạn có chắc muốn xóa không?`
        : `Xóa danh mục "${cat.name}"?`,
      confirmText: 'Xóa',
      cancelText: 'Hủy',
      type: 'danger',
      onConfirm: async () => {
        try {
          const result = await deleteCategory(cat.id);
          if (result.softDeleted) {
            success('Danh mục có sản phẩm nên được chuyển sang trạng thái ẩn');
          } else {
            success('Đã xóa danh mục');
          }
          loadCategories();
        } catch (err: unknown) {
          showError(err instanceof Error ? err.message : 'Không thể xóa danh mục');
        }
      },
    });
  };

  const handleMoveUp = async (cat: Category, index: number) => {
    if (index === 0) return;
    const siblings = rootCategories.filter(c => c.parentId === cat.parentId);
    const prev = siblings[index - 1];
    try {
      await updateCategory(cat.id, { sortOrder: prev.sortOrder + 1 });
      await updateCategory(prev.id, { sortOrder: cat.sortOrder });
      loadCategories();
    } catch {
      showError('Không thể sắp xếp');
    }
  };

  const handleMoveDown = async (cat: Category, index: number) => {
    const siblings = rootCategories.filter(c => c.parentId === cat.parentId);
    if (index >= siblings.length - 1) return;
    const next = siblings[index + 1];
    try {
      await updateCategory(cat.id, { sortOrder: next.sortOrder + 1 });
      await updateCategory(next.id, { sortOrder: cat.sortOrder });
      loadCategories();
    } catch {
      showError('Không thể sắp xếp');
    }
  };

  const handleCreateSamples = () => {
    confirm({
      title: 'Tạo danh mục mẫu',
      message: 'Tạo 7 danh mục mẫu: Tôm, Cua - Ghẹ, Cá, Mực, Ốc - Sò, Combo, Khuyến mãi?',
      confirmText: 'Tạo',
      cancelText: 'Hủy',
      type: 'info',
      onConfirm: async () => {
        try {
          for (let i = 0; i < SAMPLE_CATEGORIES.length; i++) {
            await createCategory({
              name: SAMPLE_CATEGORIES[i].name,
              slug: SAMPLE_CATEGORIES[i].slug,
              sortOrder: i + 1,
              isActive: true,
            });
          }
          success('Đã tạo 7 danh mục mẫu');
          loadCategories();
        } catch (err: unknown) {
          showError(err instanceof Error ? err.message : 'Không thể tạo danh mục mẫu');
        }
      },
    });
  };

  const parentOptions = getParentOptions();

  return (
    <div className="adm-page">
      {/* Page Header */}
      <div className="adm-page-header">
        <div>
          <h2>Quản lý danh mục</h2>
          <p>{categories.length} danh mục</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="adm-btn-ghost" onClick={handleCreateSamples}>
            <Plus size={16} />
            Tạo mẫu
          </button>
          <button className="adm-btn-primary" onClick={openAddModal}>
            <Plus size={16} />
            Thêm danh mục
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="adm-toolbar" style={{ marginBottom: 16 }}>
        <div className="adm-search-wrap">
          <Search size={16} className="adm-search-icon" />
          <input
            type="text"
            placeholder="Tìm theo tên, slug..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="adm-search-input"
          />
        </div>
      </div>

      {/* Table */}
      <div className="adm-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="adm-loading-spinner" style={{ padding: 60 }} />
        ) : error ? (
          <div className="adm-error">
            <div className="adm-error-icon"><AlertTriangle size={24} /></div>
            <h3 className="adm-error-title">Đã xảy ra lỗi</h3>
            <p className="adm-error-desc">{error}</p>
            <button className="adm-error-retry" onClick={loadCategories}>Thử lại</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="adm-empty">
            <div className="adm-empty-icon"><FolderTree size={32} /></div>
            <p className="adm-empty-title">Không có danh mục nào</p>
            <p className="adm-empty-desc">
              {search ? 'Không tìm thấy danh mục phù hợp' : 'Bắt đầu bằng cách thêm danh mục đầu tiên'}
            </p>
            {!search && (
              <button className="adm-btn-primary" style={{ marginTop: 12 }} onClick={openAddModal}>
                <Plus size={16} /> Thêm danh mục
              </button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="adm-table">
              <thead>
                <tr>
                  <th style={{ width: 60 }}>STT</th>
                  <th style={{ width: 56 }}>Icon</th>
                  <th style={{ width: 56 }}>Ảnh</th>
                  <th>Danh mục</th>
                  <th>Slug</th>
                  <th style={{ textAlign: 'center' }}>Sản phẩm</th>
                  <th>Trạng thái</th>
                  <th style={{ textAlign: 'center', width: 140 }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {rootCategories.sort((a, b) => a.sortOrder - b.sortOrder).map((cat, rootIdx) => {
                  const children = getChildren(cat.id).sort((a, b) => a.sortOrder - b.sortOrder);
                  const siblings = rootCategories.filter(c => c.parentId === cat.parentId);
                  const sibIndex = siblings.findIndex(c => c.id === cat.id);

                  return (
                    <>
                      <tr key={cat.id} className={!cat.isActive ? 'adm-row-inactive' : ''}>
                        <td>
                          <div className="adm-sort-controls">
                            <button
                              className="adm-sort-btn"
                              onClick={() => handleMoveUp(cat, sibIndex)}
                              disabled={sibIndex === 0}
                              title="Di chuyển lên"
                            >
                              <ChevronUp size={12} />
                            </button>
                            <span style={{ fontWeight: 700, color: '#64748b', minWidth: 16, textAlign: 'center' }}>
                              {rootIdx + 1}
                            </span>
                            <button
                              className="adm-sort-btn"
                              onClick={() => handleMoveDown(cat, sibIndex)}
                              disabled={sibIndex >= siblings.length - 1}
                              title="Di chuyển xuống"
                            >
                              <ChevronDown size={12} />
                            </button>
                          </div>
                        </td>
                        <td>
                          <div className="adm-cat-thumb">
                            {cat.iconUrl ? (
                              <img src={cat.iconUrl} alt={cat.name} />
                            ) : (
                              <FolderTree size={18} color="#64748b" />
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="adm-cat-thumb">
                            {cat.imageUrl ? (
                              <img src={cat.imageUrl} alt={cat.name} />
                            ) : (
                              <ImageIcon size={18} color="#94a3b8" />
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="adm-cat-name">
                            <span style={{ fontWeight: 700, color: cat.isActive ? '#0f172a' : '#94a3b8' }}>
                              {cat.name}
                            </span>
                            {children.length > 0 && (
                              <span className="adm-child-count">({children.length} con)</span>
                            )}
                          </div>
                        </td>
                        <td style={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: 12 }}>/{cat.slug}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span className="adm-badge adm-badge-gray">
                            <Tag size={10} />
                            {cat._count?.products || 0}
                          </span>
                        </td>
                        <td>
                          <span
                            className="adm-badge"
                            style={{
                              color: cat.isActive ? '#059669' : '#64748b',
                              background: cat.isActive ? '#f0fdf4' : '#f1f5f9',
                            }}
                          >
                            {cat.isActive ? 'Hiển thị' : 'Ẩn'}
                          </span>
                        </td>
                        <td>
                          <div className="adm-action-group">
                            <button
                              className="adm-action-trigger"
                              title={cat.isActive ? 'Ẩn' : 'Hiển thị'}
                              onClick={() => handleToggleActive(cat)}
                            >
                              {cat.isActive ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                            <button
                              className="adm-action-trigger"
                              title="Sửa"
                              onClick={() => openEditModal(cat)}
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              className="adm-action-trigger adm-action-danger"
                              title="Xóa"
                              onClick={() => handleDelete(cat)}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {children.sort((a, b) => a.sortOrder - b.sortOrder).map((child) => (
                        <tr key={child.id} className={!child.isActive ? 'adm-row-inactive' : ''}>
                          <td></td>
                          <td></td>
                          <td>
                            <div className="adm-cat-thumb">
                              {child.imageUrl ? (
                                <img src={child.imageUrl} alt={child.name} />
                              ) : (
                                <ImageIcon size={16} color="#94a3b8" />
                              )}
                            </div>
                          </td>
                          <td style={{ paddingLeft: 32 }}>
                            <span style={{ color: child.isActive ? '#475569' : '#94a3b8' }}>
                              └─ {child.name}
                            </span>
                          </td>
                          <td style={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: 11 }}>/{child.slug}</td>
                          <td style={{ textAlign: 'center' }}>
                            <span className="adm-badge adm-badge-gray" style={{ fontSize: 11 }}>
                              <Tag size={10} />
                              {child._count?.products || 0}
                            </span>
                          </td>
                          <td>
                            <span
                              className="adm-badge"
                              style={{
                                color: child.isActive ? '#059669' : '#64748b',
                                background: child.isActive ? '#f0fdf4' : '#f1f5f9',
                              }}
                            >
                              {child.isActive ? 'Hiển thị' : 'Ẩn'}
                            </span>
                          </td>
                          <td>
                            <div className="adm-action-group">
                              <button
                                className="adm-action-trigger"
                                title={child.isActive ? 'Ẩn' : 'Hiển thị'}
                                onClick={() => handleToggleActive(child)}
                              >
                                {child.isActive ? <EyeOff size={15} /> : <Eye size={15} />}
                              </button>
                              <button
                                className="adm-action-trigger"
                                title="Sửa"
                                onClick={() => openEditModal(child)}
                              >
                                <Edit2 size={15} />
                              </button>
                              <button
                                className="adm-action-trigger adm-action-danger"
                                title="Xóa"
                                onClick={() => handleDelete(child)}
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Category Form Modal */}
      <CategoryFormModal
        isOpen={showModal}
        mode={editingCategory ? 'edit' : 'create'}
        initialData={modalInitialData}
        parentOptions={parentOptions}
        onClose={closeModal}
        onSubmit={handleModalSubmit}
      />
    </div>
  );
}
