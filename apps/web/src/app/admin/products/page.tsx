'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, Filter, Edit2, Trash2, Eye, EyeOff,
  AlertTriangle, Package, Star, TrendingUp,
  ChevronUp, ChevronDown,
} from 'lucide-react';
import { useToast, useConfirm } from '../layout-client';
import {
  fetchProducts, fetchProductById, fetchCategories,
  createProduct, updateProduct, deleteProduct,
  createCategory,
} from '@/lib/admin/api';
import ProductModal from '@/components/admin/ProductModal';
import type { ProductImage, ProductFormData, Category } from '@/components/admin/ProductModal';

interface Product {
  id: string;
  name: string;
  slug: string;
  category?: { id: string; name: string; slug: string };
  categoryId?: string;
  shortDescription?: string;
  description?: string;
  basePrice: number;
  oldPrice?: number;
  unit: string;
  stockQuantity?: number;
  lowStockThreshold?: number;
  status: string;
  isFeatured: boolean;
  isBestSeller: boolean;
  seoTitle?: string;
  seoDescription?: string;
  images: ProductImage[];
}

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Đang bán' },
  { value: 'OUT_OF_STOCK', label: 'Hết hàng' },
  { value: 'INACTIVE', label: 'Tạm ẩn' },
];

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  ACTIVE: { label: 'Đang bán', color: '#059669', bg: '#f0fdf4' },
  OUT_OF_STOCK: { label: 'Hết hàng', color: '#ef4444', bg: '#fef2f2' },
  INACTIVE: { label: 'Tạm ẩn', color: '#6b7280', bg: '#f1f5f9' },
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace('₫', '') + 'đ';
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

const initialFormData: ProductFormData = {
  name: '',
  slug: '',
  categoryId: '',
  shortDescription: '',
  description: '',
  basePrice: '',
  oldPrice: '',
  unit: 'kg',
  stockQuantity: '0',
  lowStockThreshold: '10',
  status: 'ACTIVE',
  isFeatured: false,
  isBestSeller: false,
  seoTitle: '',
  seoDescription: '',
  images: [],
};

export default function ProductsPage() {
  const { success, error: showError } = useToast();
  const { confirm } = useConfirm();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [formLoading, setFormLoading] = useState(false);
  const [slugEdited, setSlugEdited] = useState(false);
  const [creatingCategory, setCreatingCategory] = useState(false);

  const limit = 15;

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchProducts({
        search: search || undefined,
        status: statusFilter || undefined,
        category: categoryFilter || undefined,
        lowStock: lowStockFilter || undefined,
        page,
        limit,
      });
      setProducts(result.data || []);
      setTotal(result.total || 0);
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách sản phẩm');
      showError(err.message || 'Không thể tải danh sách sản phẩm');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, categoryFilter, lowStockFilter, showError]);

  const loadCategories = useCallback(async () => {
    try {
      const result = await fetchCategories();
      setCategories(result.data || []);
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleNameChange = (value: string) => {
    setFormData(prev => ({ ...prev, name: value }));
    if (!slugEdited) {
      setFormData(prev => ({ ...prev, slug: slugify(value) }));
    }
  };

  const handleSlugChange = (value: string) => {
    setSlugEdited(true);
    setFormData(prev => ({ ...prev, slug: slugify(value) }));
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData(initialFormData);
    setSlugEdited(false);
    setShowModal(true);
  };

  const openEditModal = async (product: Product) => {
    try {
      const result = await fetchProductById(product.id);
      // adminFetch unwraps { data: product } → returns product directly
      const fullProduct = result.data ?? result;
      setEditingProduct(fullProduct);
      setFormData({
        name: fullProduct.name || '',
        slug: fullProduct.slug || '',
        categoryId: fullProduct.category?.id || fullProduct.categoryId || '',
        shortDescription: fullProduct.shortDescription || '',
        description: fullProduct.description || '',
        basePrice: String(fullProduct.basePrice || ''),
        oldPrice: String(fullProduct.oldPrice || ''),
        unit: fullProduct.unit || 'kg',
        stockQuantity: String(fullProduct.stockQuantity ?? 0),
        lowStockThreshold: String(fullProduct.lowStockThreshold ?? 10),
        status: fullProduct.status || 'ACTIVE',
        isFeatured: fullProduct.isFeatured || false,
        isBestSeller: fullProduct.isBestSeller || false,
        seoTitle: fullProduct.seoTitle || '',
        seoDescription: fullProduct.seoDescription || '',
        images: fullProduct.images || [],
      });
      setSlugEdited(true);
      setShowModal(true);
    } catch {
      showError('Không thể tải thông tin sản phẩm');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setFormData(initialFormData);
    setSlugEdited(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const MAX_SIZE = 2 * 1024 * 1024; // 2MB
    Array.from(files).forEach(file => {
      if (file.size > MAX_SIZE) {
        showError(`Ảnh "${file.name}" vượt quá 2MB. Vui lòng chọn ảnh nhỏ hơn.`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        const imageUrl = ev.target?.result as string;
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, {
            imageUrl,
            isThumbnail: prev.images.length === 0,
            sortOrder: prev.images.length + 1,
          }],
        }));
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setFormData(prev => {
      const newImages = prev.images.filter((_, i) => i !== index);
      if (newImages.length > 0 && !newImages.some(img => img.isThumbnail)) {
        newImages[0].isThumbnail = true;
      }
      return { ...prev, images: newImages };
    });
  };

  const setThumbnail = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.map((img, i) => ({
        ...img,
        isThumbnail: i === index,
      })),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formLoading) return;

    if (!formData.name.trim()) {
      showError('Vui lòng nhập tên sản phẩm');
      return;
    }
    if (!formData.categoryId) {
      showError('Vui lòng chọn danh mục');
      return;
    }
    if (!formData.basePrice || Number(formData.basePrice) < 0) {
      showError('Vui lòng nhập giá hợp lệ');
      return;
    }

    setFormLoading(true);
    try {
      const payload = {
        name: formData.name.trim(),
        slug: formData.slug.trim() || slugify(formData.name),
        categoryId: formData.categoryId,
        shortDescription: formData.shortDescription.trim() || null,
        description: formData.description.trim() || null,
        basePrice: Number(formData.basePrice),
        oldPrice: formData.oldPrice ? Number(formData.oldPrice) : null,
        unit: formData.unit,
        stockQuantity: Number(formData.stockQuantity) || 0,
        lowStockThreshold: Number(formData.lowStockThreshold) || 10,
        status: formData.status,
        isFeatured: formData.isFeatured,
        isBestSeller: formData.isBestSeller,
        seoTitle: formData.seoTitle.trim() || null,
        seoDescription: formData.seoDescription.trim() || null,
        images: formData.images.map((img, idx) => ({
          imageUrl: img.imageUrl,
          isThumbnail: img.isThumbnail ?? idx === 0,
          altText: formData.name,
          sortOrder: idx + 1,
        })),
      };

      if (editingProduct) {
        await updateProduct(editingProduct.id, payload);
        success('Đã cập nhật sản phẩm');
      } else {
        await createProduct(payload);
        success('Đã thêm sản phẩm mới');
      }
      closeModal();
      loadProducts();
    } catch (err: any) {
      showError(err.message || 'Không thể lưu sản phẩm');
    } finally {
      setFormLoading(false);
    }
  };

  const handleCreateCategory = async (name: string) => {
    setCreatingCategory(true);
    try {
      const result = await createCategory({ name });
      // adminFetch unwraps { data: category } → result is the category directly
      const newCat = result.data ?? result;
      if (newCat && newCat.id) {
        // Add to categories list
        setCategories(prev => [...prev, { id: newCat.id, name: newCat.name, slug: newCat.slug }]);
        // Auto-select the new category
        setFormData(prev => ({ ...prev, categoryId: newCat.id }));
        success(`Đã thêm danh mục "${newCat.name}"`);
      }
    } catch (err: any) {
      throw new Error(err.message || 'Không thể tạo danh mục');
    } finally {
      setCreatingCategory(false);
    }
  };

  const handleToggleStatus = async (product: Product) => {
    const newStatus = product.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    confirm({
      title: product.status === 'ACTIVE' ? 'Ẩn sản phẩm' : 'Hiển thị sản phẩm',
      message: product.status === 'ACTIVE'
        ? `Ẩn sản phẩm "${product.name}"? Sản phẩm sẽ không hiển thị trên website.`
        : `Hiển thị sản phẩm "${product.name}" trên website?`,
      confirmText: product.status === 'ACTIVE' ? 'Ẩn' : 'Hiển thị',
      type: 'warning',
      onConfirm: async () => {
        try {
          await updateProduct(product.id, { status: newStatus });
          success(product.status === 'ACTIVE' ? 'Đã ẩn sản phẩm' : 'Đã hiển thị sản phẩm');
          setProducts(prev => prev.map(p =>
            p.id === product.id ? { ...p, status: newStatus } : p
          ));
        } catch (err: any) {
          showError(err.message || 'Không thể cập nhật trạng thái');
        }
      },
    });
  };

  const handleToggleFeatured = async (product: Product) => {
    try {
      await updateProduct(product.id, { isFeatured: !product.isFeatured });
      success(!product.isFeatured ? 'Đã đánh dấu sản phẩm nổi bật' : 'Đã bỏ đánh dấu nổi bật');
      setProducts(prev => prev.map(p =>
        p.id === product.id ? { ...p, isFeatured: !product.isFeatured } : p
      ));
    } catch (err: any) {
      showError(err.message || 'Không thể cập nhật');
    }
  };

  const handleToggleBestSeller = async (product: Product) => {
    try {
      await updateProduct(product.id, { isBestSeller: !product.isBestSeller });
      success(!product.isBestSeller ? 'Đã đánh dấu sản phẩm bán chạy' : 'Đã bỏ đánh dấu bán chạy');
      setProducts(prev => prev.map(p =>
        p.id === product.id ? { ...p, isBestSeller: !product.isBestSeller } : p
      ));
    } catch (err: any) {
      showError(err.message || 'Không thể cập nhật');
    }
  };

  const handleDelete = (product: Product) => {
    confirm({
      title: 'Xóa sản phẩm',
      message: `Xóa sản phẩm "${product.name}"? Sản phẩm đã có trong đơn hàng sẽ được chuyển sang trạng thái ẩn.`,
      confirmText: 'Xóa',
      cancelText: 'Hủy',
      type: 'danger',
      onConfirm: async () => {
        try {
          const result = await deleteProduct(product.id);
          if (result.softDeleted) {
            success('Sản phẩm đã có trong đơn hàng nên được chuyển sang trạng thái ẩn');
            setProducts(prev => prev.map(p =>
              p.id === product.id ? { ...p, status: 'INACTIVE' } : p
            ));
          } else {
            success('Đã xóa sản phẩm');
            setProducts(prev => prev.filter(p => p.id !== product.id));
            setTotal(prev => prev - 1);
          }
        } catch (err: any) {
          showError(err.message || 'Không thể xóa sản phẩm');
        }
      },
    });
  };

  const totalPages = Math.ceil(total / limit);
  const startItem = total > 0 ? (page - 1) * limit + 1 : 0;
  const endItem = Math.min(page * limit, total);

  const getStockStatus = (product: Product) => {
    const qty = product.stockQuantity ?? 0;
    const threshold = product.lowStockThreshold ?? 10;
    if (qty === 0) return 'Hết hàng';
    if (qty <= threshold) return `Còn ${qty}`;
    return `${qty}`;
  };

  const getStockStatusColor = (product: Product) => {
    const qty = product.stockQuantity ?? 0;
    const threshold = product.lowStockThreshold ?? 10;
    if (qty === 0) return { color: '#ef4444', bg: '#fef2f2' };
    if (qty <= threshold) return { color: '#d97706', bg: '#fffbeb' };
    return { color: '#059669', bg: '#f0fdf4' };
  };

  return (
    <div className="adm-page">
      {/* Page Header */}
      <div className="adm-page-header">
        <div>
          <h2>Quản lý sản phẩm</h2>
          <p>{total} sản phẩm</p>
        </div>
        <button className="adm-btn-primary" onClick={openAddModal}>
          <Plus size={16} />
          Thêm sản phẩm
        </button>
      </div>

      {/* Toolbar */}
      <div className="adm-toolbar" style={{ marginBottom: showFilters ? 12 : 0 }}>
        <div className="adm-search-wrap">
          <Search size={16} className="adm-search-icon" />
          <input
            type="text"
            placeholder="Tìm theo tên, slug..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
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

      {showFilters && (
        <div className="adm-filters-panel" style={{ marginBottom: 16 }}>
          <div className="adm-filter-row">
            <div className="adm-filter-group">
              <label>Danh mục</label>
              <select
                value={categoryFilter}
                onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}
                className="adm-select"
              >
                <option value="">Tất cả danh mục</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.slug}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="adm-filter-group">
              <label>Trạng thái</label>
              <select
                value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                className="adm-select"
              >
                <option value="">Tất cả trạng thái</option>
                {STATUS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="adm-filter-group">
              <label>Tồn kho</label>
              <select
                value={lowStockFilter ? 'low' : ''}
                onChange={e => { setLowStockFilter(e.target.value === 'low'); setPage(1); }}
                className="adm-select"
              >
                <option value="">Tất cả</option>
                <option value="low">Sắp hết hàng</option>
              </select>
            </div>
            {(categoryFilter || statusFilter || lowStockFilter) && (
              <button
                className="adm-btn-ghost"
                onClick={() => { setCategoryFilter(''); setStatusFilter(''); setLowStockFilter(false); setPage(1); }}
              >
                Xóa lọc
              </button>
            )}
          </div>
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
            <button className="adm-error-retry" onClick={loadProducts}>Thử lại</button>
          </div>
        ) : products.length === 0 ? (
          <div className="adm-empty">
            <div className="adm-empty-icon"><Package size={32} /></div>
            <p className="adm-empty-title">Không có sản phẩm nào</p>
            <p className="adm-empty-desc">
              {search || statusFilter || categoryFilter || lowStockFilter
                ? 'Không tìm thấy sản phẩm phù hợp'
                : 'Bắt đầu bằng cách thêm sản phẩm đầu tiên'}
            </p>
            {!search && !statusFilter && !categoryFilter && !lowStockFilter && (
              <button className="adm-btn-primary" style={{ marginTop: 12 }} onClick={openAddModal}>
                <Plus size={16} /> Thêm sản phẩm
              </button>
            )}
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="adm-table">
                <thead>
                  <tr>
                    <th style={{ width: 56 }}>Ảnh</th>
                    <th>Sản phẩm</th>
                    <th>Danh mục</th>
                    <th>Giá</th>
                    <th>Tồn kho</th>
                    <th>Trạng thái</th>
                    <th style={{ textAlign: 'center', width: 100 }}>Nổi bật</th>
                    <th style={{ textAlign: 'center', width: 140 }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(product => {
                    const st = STATUS_STYLE[product.status] || { label: product.status, color: '#64748b', bg: '#f1f5f9' };
                    const stockSt = getStockStatusColor(product);
                    const thumbnail = product.images?.find(img => img.isThumbnail) || product.images?.[0];

                    return (
                      <tr key={product.id}>
                        <td>
                          <div className="adm-product-thumb">
                            {thumbnail?.imageUrl ? (
                              <img src={thumbnail.imageUrl} alt={product.name} />
                            ) : (
                              <Package size={20} color="#94a3b8" />
                            )}
                          </div>
                        </td>
                        <td>
                          <div>
                            <div className="adm-product-name">{product.name}</div>
                            <div className="adm-product-slug">/{product.slug}</div>
                          </div>
                        </td>
                        <td style={{ color: '#64748b' }}>{product.category?.name || '-'}</td>
                        <td>
                          <div>
                            <span className="adm-price">{formatCurrency(product.basePrice)}</span>
                            {product.oldPrice && product.oldPrice > product.basePrice && (
                              <span className="adm-price-old">{formatCurrency(product.oldPrice)}</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span
                            className="adm-badge"
                            style={{ color: stockSt.color, background: stockSt.bg }}
                          >
                            {getStockStatus(product)}
                          </span>
                        </td>
                        <td>
                          <span className="adm-badge" style={{ color: st.color, background: st.bg }}>
                            {st.label}
                          </span>
                        </td>
                        <td>
                          <div className="adm-badge-group" style={{ justifyContent: 'center' }}>
                            <button
                              className={`adm-badge-btn ${product.isFeatured ? 'active' : ''}`}
                              title="Nổi bật"
                              onClick={() => handleToggleFeatured(product)}
                            >
                              <Star size={12} />
                            </button>
                            <button
                              className={`adm-badge-btn ${product.isBestSeller ? 'active' : ''}`}
                              title="Bán chạy"
                              onClick={() => handleToggleBestSeller(product)}
                            >
                              <TrendingUp size={12} />
                            </button>
                          </div>
                        </td>
                        <td>
                          <div className="adm-action-group">
                            <button
                              className="adm-action-trigger"
                              title="Sửa"
                              onClick={() => openEditModal(product)}
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              className="adm-action-trigger"
                              title={product.status === 'ACTIVE' ? 'Ẩn' : 'Hiển thị'}
                              onClick={() => handleToggleStatus(product)}
                            >
                              {product.status === 'ACTIVE' ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                            <button
                              className="adm-action-trigger adm-action-danger"
                              title="Xóa"
                              onClick={() => handleDelete(product)}
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
            {totalPages > 1 && (
              <div className="adm-pagination">
                <span className="adm-pagination-info">
                  Hiển thị {startItem} - {endItem} trong {total} sản phẩm
                </span>
                <div className="adm-pagination-buttons">
                  <button
                    className="adm-pagination-btn"
                    disabled={page <= 1}
                    onClick={() => setPage(p => p - 1)}
                  >
                    <ChevronUp size={14} style={{ transform: 'rotate(-90deg)' }} />
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
                  {totalPages > 5 && (
                    <>
                      <span className="adm-pagination-ellipsis">...</span>
                      <button
                        className={`adm-pagination-btn ${page === totalPages ? 'active' : ''}`}
                        onClick={() => setPage(totalPages)}
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
                  <button
                    className="adm-pagination-btn"
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => p + 1)}
                  >
                    <ChevronDown size={14} style={{ transform: 'rotate(-90deg)' }} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Product Modal */}
      <ProductModal
        isOpen={showModal}
        editingProduct={editingProduct}
        formData={formData}
        categories={categories}
        formLoading={formLoading}
        onClose={closeModal}
        onChange={(data) => setFormData(prev => ({ ...prev, ...data }))}
        onNameChange={handleNameChange}
        onSlugChange={handleSlugChange}
        onImageUpload={(files) => {
          if (!files) return;
          const fakeEvent = { target: { files } } as unknown as React.ChangeEvent<HTMLInputElement>;
          handleImageUpload(fakeEvent);
        }}
        onRemoveImage={removeImage}
        onSetThumbnail={setThumbnail}
        onSubmit={handleSubmit}
        onCreateCategory={handleCreateCategory}
        creatingCategory={creatingCategory}
      />
    </div>
  );
}
