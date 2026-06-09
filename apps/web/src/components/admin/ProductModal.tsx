'use client';

import {
  X, Upload, Star, TrendingUp, Image, Info, AlertCircle,
  ChevronDown, Loader2, Check, Plus, Package,
} from 'lucide-react';
import { useState, useRef, useCallback, useEffect } from 'react';

function generateSlug(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export interface ProductImage {
  id?: string;
  imageUrl: string;
  altText?: string;
  isThumbnail?: boolean;
  sortOrder?: number;
}

export interface ProductFormData {
  name: string;
  slug: string;
  categoryId: string;
  shortDescription: string;
  description: string;
  basePrice: string;
  oldPrice: string;
  unit: string;
  stockQuantity: string;
  lowStockThreshold: string;
  status: string;
  isFeatured: boolean;
  isBestSeller: boolean;
  seoTitle: string;
  seoDescription: string;
  images: ProductImage[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

interface ProductModalProps {
  isOpen: boolean;
  editingProduct: any | null;
  formData: ProductFormData;
  categories: Category[];
  formLoading: boolean;
  onClose: () => void;
  onChange: (data: Partial<ProductFormData>) => void;
  onNameChange: (value: string) => void;
  onSlugChange: (value: string) => void;
  onImageUpload: (files: FileList | null) => void;
  onRemoveImage: (index: number) => void;
  onSetThumbnail: (index: number) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCreateCategory?: (name: string) => Promise<void>;
  creatingCategory?: boolean;
}

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Đang bán' },
  { value: 'OUT_OF_STOCK', label: 'Hết hàng' },
  { value: 'INACTIVE', label: 'Tạm ẩn' },
];

const UNIT_OPTIONS = [
  { value: 'kg', label: 'Kg' },
  { value: 'con', label: 'Con' },
  { value: 'hộp', label: 'Hộp' },
  { value: 'combo', label: 'Combo' },
];

// ─── Section header ────────────────────────────────────────────────────────────
function SectionHeader({
  number,
  title,
  subtitle,
}: {
  number: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="pm-section-header">
      <div className="pm-section-number">{number}</div>
      <div>
        <div className="pm-section-title">{title}</div>
        {subtitle && <div className="pm-section-subtitle">{subtitle}</div>}
      </div>
    </div>
  );
}

// ─── Toggle badge (replaces ugly checkboxes) ───────────────────────────────────
function ToggleBadge({
  icon,
  label,
  active,
  activeColor,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  activeColor?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`pm-toggle-badge ${active ? 'pm-toggle-badge--on' : ''}`}
      style={
        active
          ? ({ '--badge-accent': activeColor || '#0891b2' } as React.CSSProperties)
          : undefined
      }
      onClick={onClick}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

// ─── Image upload zone ─────────────────────────────────────────────────────────
function ImageUploadZone({
  images,
  onUpload,
  onRemove,
  onSetThumbnail,
  dragActive,
  onDragEnter,
  onDragLeave,
  onDrop,
  fileInputRef,
  onBrowseClick,
}: {
  images: ProductImage[];
  onUpload: (files: FileList | null) => void;
  onRemove: (index: number) => void;
  onSetThumbnail: (index: number) => void;
  dragActive: boolean;
  onDragEnter: () => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onBrowseClick: () => void;
}) {
  return (
    <div className="pm-image-zone">
      {images.length === 0 ? (
        <div
          className={`pm-image-dropzone ${dragActive ? 'pm-image-dropzone--active' : ''}`}
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={onBrowseClick}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={(e) => onUpload(e.target.files)}
          />
          <div className="pm-image-dropzone__icon">
            <Image size={28} strokeWidth={1.5} />
          </div>
          <div className="pm-image-dropzone__text">
            <span className="pm-image-dropzone__primary">Kéo &amp; thả ảnh vào đây</span>
            <span className="pm-image-dropzone__secondary">
              hoặc{' '}
              <span className="pm-image-dropzone__link">chọn tệp</span> từ máy
            </span>
          </div>
          <span className="pm-image-dropzone__hint">
            Hỗ trợ JPG, PNG, WEBP · Tối đa 5MB mỗi ảnh
          </span>
        </div>
      ) : (
        <div className="pm-image-grid">
          {images.map((img, idx) => (
            <div
              key={idx}
              className={`pm-image-card ${img.isThumbnail ? 'pm-image-card--thumb' : ''}`}
            >
              <img src={img.imageUrl} alt={`Ảnh ${idx + 1}`} />
              {img.isThumbnail && (
                <div className="pm-image-card__thumb-badge">Ảnh chính</div>
              )}
              <div className="pm-image-card__overlay">
                {!img.isThumbnail && (
                  <button
                    type="button"
                    className="pm-image-card__action pm-image-card__action--set"
                    onClick={() => onSetThumbnail(idx)}
                    title="Đặt làm ảnh chính"
                  >
                    <Star size={13} />
                  </button>
                )}
                <button
                  type="button"
                  className="pm-image-card__action pm-image-card__action--remove"
                  onClick={() => onRemove(idx)}
                  title="Xóa ảnh"
                >
                  <X size={13} />
                </button>
              </div>
            </div>
          ))}
          <div className="pm-image-add-btn" onClick={onBrowseClick} role="button" tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onBrowseClick()}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: 'none' }}
              onChange={(e) => onUpload(e.target.files)}
            />
            <Upload size={20} strokeWidth={1.5} />
            <span>Thêm ảnh</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Inline Add Category ──────────────────────────────────────────────────────
interface AddCategoryInlineProps {
  onCreate: (name: string) => Promise<void>;
  creating: boolean;
}

function AddCategoryInline({ onCreate, creating: _creating }: AddCategoryInlineProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleOpen = () => {
    setOpen(true);
    setName('');
    setSlug('');
    setError('');
    setSuccess(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleClose = () => {
    if (!saving) {
      setOpen(false);
      setName('');
      setSlug('');
      setError('');
      setSuccess(false);
    }
  };

  const handleNameChange = (val: string) => {
    setName(val);
    setSlug(generateSlug(val));
    setError('');
    setSuccess(false);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Vui lòng nhập tên danh mục');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onCreate(name.trim());
      setSuccess(true);
      setName('');
      setSlug('');
      setOpen(false);
    } catch (err: any) {
      setError(err.message || 'Không thể tạo danh mục');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pm-add-cat-wrap">
      {!open ? (
        <button
          type="button"
          className="pm-add-cat-trigger"
          onClick={handleOpen}
        >
          <Plus size={13} />
          Thêm danh mục mới
        </button>
      ) : (
        <div className="pm-add-cat-form">
          <div className="pm-add-cat-input-row">
            <input
              ref={inputRef}
              type="text"
              className={`pm-input pm-add-cat-name-input ${error ? 'pm-input--error' : ''}`}
              placeholder="VD: Hải sản cấp đông"
              value={name}
              onChange={e => handleNameChange(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') handleClose();
              }}
              disabled={saving}
            />
            <button
              type="button"
              className="pm-btn pm-btn--sm pm-btn--primary"
              onClick={handleSave}
              disabled={saving || !name.trim()}
            >
              {saving ? <Loader2 size={13} className="pm-spin" /> : <Check size={13} />}
              Lưu
            </button>
            <button
              type="button"
              className="pm-btn pm-btn--sm pm-btn--ghost"
              onClick={handleClose}
              disabled={saving}
            >
              <X size={13} />
            </button>
          </div>
          {slug && (
            <div className="pm-add-cat-slug-preview">
              Slug: <code>/danh-muc/{slug}</code>
            </div>
          )}
          {error && (
            <div className="pm-field__error">
              <AlertCircle size={12} />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="pm-add-cat-success">
              <Check size={12} />
              Đã thêm danh mục mới
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────
export default function ProductModal({
  isOpen,
  editingProduct,
  formData,
  categories,
  formLoading,
  onClose,
  onChange,
  onNameChange,
  onSlugChange,
  onImageUpload,
  onRemoveImage,
  onSetThumbnail,
  onSubmit,
  onCreateCategory,
  creatingCategory,
}: ProductModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [nameError, setNameError] = useState('');
  const [priceError, setPriceError] = useState('');
  const [categoryError, setCategoryError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setNameError('');
      setPriceError('');
      setCategoryError('');
    }
  }, [isOpen]);

  const handleDragEnter = useCallback(() => setDragActive(true), []);
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragActive(false);
  }, []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files.length > 0) {
      onImageUpload(e.dataTransfer.files);
    }
  }, [onImageUpload]);

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const isLowStock =
    formData.stockQuantity !== '' &&
    formData.lowStockThreshold !== '' &&
    Number(formData.stockQuantity) <= Number(formData.lowStockThreshold) &&
    Number(formData.stockQuantity) > 0;

  if (!isOpen) return null;

  const handleFormSubmit = (e: React.FormEvent) => {
    let hasError = false;
    if (!formData.name.trim()) {
      setNameError('Vui lòng nhập tên sản phẩm');
      hasError = true;
    } else {
      setNameError('');
    }
    if (!formData.categoryId) {
      setCategoryError('Vui lòng chọn danh mục');
      hasError = true;
    } else {
      setCategoryError('');
    }
    if (!formData.basePrice || Number(formData.basePrice) < 0) {
      setPriceError('Vui lòng nhập giá hợp lệ');
      hasError = true;
    } else {
      setPriceError('');
    }
    if (hasError) {
      e.preventDefault();
      return;
    }
    onSubmit(e);
  };

  return (
    <>
      <div className="pm-backdrop" onClick={onClose} aria-hidden="true" />

      <div className="pm-modal" role="dialog" aria-modal="true" aria-labelledby="pm-modal-title">

        {/* ── Header ── */}
        <div className="pm-header">
          <div className="pm-header__left">
            <div className="pm-header__icon">
              <Package size={20} />
            </div>
            <div>
              <h2 id="pm-modal-title" className="pm-header__title">
                {editingProduct ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}
              </h2>
              <p className="pm-header__subtitle">
                {editingProduct
                  ? `Cập nhật thông tin cho \u201C${formData.name || '…'}\u201D`
                  : 'Điền thông tin sản phẩm để đăng bán trên cửa hàng'}
              </p>
            </div>
          </div>
          <button type="button" className="pm-header__close" onClick={onClose} aria-label="Đóng">
            <X size={18} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="pm-body">
          <form id="product-form" onSubmit={handleFormSubmit} noValidate>

            {/* SECTION 1: Thông tin cơ bản */}
            <section className="pm-section">
              <SectionHeader
                number="01"
                title="Thông tin cơ bản"
                subtitle="Tên, danh mục và slug sản phẩm"
              />
              <div className="pm-grid pm-grid--2col">
                <div className="pm-field pm-field--full">
                  <label className="pm-label">
                    Tên sản phẩm <span className="pm-label__required">*</span>
                  </label>
                  <input
                    type="text"
                    className={`pm-input ${nameError ? 'pm-input--error' : ''}`}
                    placeholder="VD: Cá hồi Na Uy tươi"
                    value={formData.name}
                    onChange={e => {
                      onNameChange(e.target.value);
                      if (nameError) setNameError('');
                    }}
                  />
                  {nameError && (
                    <div className="pm-field__error">
                      <AlertCircle size={13} />
                      <span>{nameError}</span>
                    </div>
                  )}
                </div>

                <div className="pm-field">
                  <label className="pm-label">
                    Danh mục <span className="pm-label__required">*</span>
                  </label>
                  <div className="pm-select-wrap">
                    <select
                      className={`pm-select ${categoryError ? 'pm-select--error' : ''}`}
                      value={formData.categoryId}
                      onChange={e => {
                        onChange({ categoryId: e.target.value });
                        if (categoryError) setCategoryError('');
                      }}
                    >
                      <option value="">Chọn danh mục</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                    <ChevronDown size={15} className="pm-select-wrap__icon" />
                  </div>
                  {categoryError && (
                    <div className="pm-field__error">
                      <AlertCircle size={13} />
                      <span>{categoryError}</span>
                    </div>
                  )}

                  {/* Inline add category */}
                  {onCreateCategory && (
                    <AddCategoryInline
                      onCreate={onCreateCategory}
                      creating={creatingCategory ?? false}
                    />
                  )}
                </div>

                <div className="pm-field">
                  <label className="pm-label">
                    Slug
                    <span className="pm-label__hint">
                      <Info size={11} />
                      <span>Tự động tạo từ tên sản phẩm</span>
                    </span>
                  </label>
                  <div className="pm-input-prefix-wrap">
                    <span className="pm-input-prefix">/</span>
                    <input
                      type="text"
                      className="pm-input pm-input--prefixed"
                      placeholder="tu-dong-tu-ten"
                      value={formData.slug}
                      onChange={e => onSlugChange(e.target.value)}
                    />
                  </div>
                  <div className="pm-field__hint">
                    Dùng cho URL:{' '}
                    <code>/san-pham/{formData.slug || 'slug'}</code>
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 2: Giá & Kho */}
            <section className="pm-section">
              <SectionHeader
                number="02"
                title="Giá &amp; Kho"
                subtitle="Thiết lập giá bán, giá cũ và số lượng tồn kho"
              />
              <div className="pm-grid pm-grid--2col">
                <div className="pm-field">
                  <label className="pm-label">
                    Giá bán <span className="pm-label__required">*</span>
                  </label>
                  <div className="pm-input-suffix-wrap">
                    <input
                      type="number"
                      className={`pm-input pm-input--suffixed ${priceError ? 'pm-input--error' : ''}`}
                      placeholder="0"
                      min="0"
                      value={formData.basePrice}
                      onChange={e => {
                        onChange({ basePrice: e.target.value });
                        if (priceError) setPriceError('');
                      }}
                    />
                    <span className="pm-input-suffix">đ</span>
                  </div>
                  {priceError && (
                    <div className="pm-field__error">
                      <AlertCircle size={13} />
                      <span>{priceError}</span>
                    </div>
                  )}
                </div>

                <div className="pm-field">
                  <label className="pm-label">
                    Giá cũ
                    <span className="pm-label__hint">
                      <Info size={11} />
                      <span>Để trống nếu không có</span>
                    </span>
                  </label>
                  <div className="pm-input-suffix-wrap">
                    <input
                      type="number"
                      className="pm-input pm-input--suffixed"
                      placeholder="0"
                      min="0"
                      value={formData.oldPrice}
                      onChange={e => onChange({ oldPrice: e.target.value })}
                    />
                    <span className="pm-input-suffix">đ</span>
                  </div>
                </div>

                <div className="pm-field">
                  <label className="pm-label">Đơn vị tính</label>
                  <div className="pm-select-wrap">
                    <select
                      className="pm-select"
                      value={formData.unit}
                      onChange={e => onChange({ unit: e.target.value })}
                    >
                      {UNIT_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <ChevronDown size={15} className="pm-select-wrap__icon" />
                  </div>
                </div>

                <div className="pm-field">
                  <label className="pm-label">Trạng thái</label>
                  <div className="pm-select-wrap">
                    <select
                      className="pm-select"
                      value={formData.status}
                      onChange={e => onChange({ status: e.target.value })}
                    >
                      {STATUS_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <ChevronDown size={15} className="pm-select-wrap__icon" />
                  </div>
                </div>

                <div className="pm-field">
                  <label className="pm-label">Số lượng tồn kho</label>
                  <input
                    type="number"
                    className={`pm-input ${isLowStock ? 'pm-input--warn' : ''}`}
                    placeholder="0"
                    min="0"
                    value={formData.stockQuantity}
                    onChange={e => onChange({ stockQuantity: e.target.value })}
                  />
                  {isLowStock && (
                    <div className="pm-field__warn">
                      <AlertCircle size={13} />
                      <span>Dưới ngưỡng cảnh báo — sắp hết hàng</span>
                    </div>
                  )}
                </div>

                <div className="pm-field">
                  <label className="pm-label">
                    Ngưỡng cảnh báo
                    <span className="pm-label__hint">
                      <Info size={11} />
                      <span>Cảnh báo khi tồn kho ≤ ngưỡng này</span>
                    </span>
                  </label>
                  <input
                    type="number"
                    className="pm-input"
                    placeholder="10"
                    min="0"
                    value={formData.lowStockThreshold}
                    onChange={e => onChange({ lowStockThreshold: e.target.value })}
                  />
                </div>

                <div className="pm-field pm-field--full">
                  <label className="pm-label">Phân loại sản phẩm</label>
                  <div className="pm-toggle-row">
                    <ToggleBadge
                      icon={<Star size={14} />}
                      label="Sản phẩm nổi bật"
                      active={formData.isFeatured}
                      activeColor="#f59e0b"
                      onClick={() => onChange({ isFeatured: !formData.isFeatured })}
                    />
                    <ToggleBadge
                      icon={<TrendingUp size={14} />}
                      label="Sản phẩm bán chạy"
                      active={formData.isBestSeller}
                      activeColor="#ef4444"
                      onClick={() => onChange({ isBestSeller: !formData.isBestSeller })}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 3: Mô tả */}
            <section className="pm-section">
              <SectionHeader
                number="03"
                title="Mô tả"
                subtitle="Mô tả ngắn và mô tả chi tiết sản phẩm"
              />
              <div className="pm-grid pm-grid--2col">
                <div className="pm-field pm-field--full">
                  <label className="pm-label">
                    Mô tả ngắn
                    <span className="pm-label__hint">
                      <Info size={11} />
                      <span>Hiển thị dưới tên sản phẩm trong danh sách</span>
                    </span>
                  </label>
                  <textarea
                    className="pm-textarea"
                    placeholder="VD: Cá hồi Na Uy tươi, giàu omega-3, thích hợp chế biến nhiều món ăn ngon..."
                    rows={2}
                    value={formData.shortDescription}
                    onChange={e => onChange({ shortDescription: e.target.value })}
                  />
                </div>

                <div className="pm-field pm-field--full">
                  <label className="pm-label">
                    Mô tả chi tiết
                    <span className="pm-label__hint">
                      <Info size={11} />
                      <span>Hiển thị trong trang chi tiết sản phẩm</span>
                    </span>
                  </label>
                  <textarea
                    className="pm-textarea pm-textarea--tall"
                    placeholder="Mô tả chi tiết về sản phẩm: nguồn gốc, cách chế biến, giá trị dinh dưỡng, bảo quản..."
                    rows={4}
                    value={formData.description}
                    onChange={e => onChange({ description: e.target.value })}
                  />
                </div>
              </div>
            </section>

            {/* SECTION 4: Hình ảnh */}
            <section className="pm-section">
              <SectionHeader
                number="04"
                title="Hình ảnh"
                subtitle="Tải lên ảnh sản phẩm — ảnh đầu tiên sẽ là ảnh chính"
              />
              <ImageUploadZone
                images={formData.images}
                onUpload={onImageUpload}
                onRemove={onRemoveImage}
                onSetThumbnail={onSetThumbnail}
                dragActive={dragActive}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                fileInputRef={fileInputRef}
                onBrowseClick={handleBrowseClick}
              />
            </section>

            {/* SECTION 5: SEO */}
            <section className="pm-section">
              <SectionHeader
                number="05"
                title="SEO"
                subtitle="Tối ưu tiêu đề và mô tả cho công cụ tìm kiếm"
              />
              <div className="pm-grid pm-grid--2col">
                <div className="pm-field">
                  <label className="pm-label">SEO Title</label>
                  <input
                    type="text"
                    className="pm-input"
                    placeholder="Tiêu đề SEO (mặc định dùng tên sản phẩm)"
                    value={formData.seoTitle}
                    onChange={e => onChange({ seoTitle: e.target.value })}
                  />
                </div>
                <div className="pm-field">
                  <label className="pm-label">SEO Description</label>
                  <textarea
                    className="pm-textarea"
                    placeholder="Mô tả ngắn cho Google hiển thị (120–160 ký tự)"
                    rows={2}
                    value={formData.seoDescription}
                    onChange={e => onChange({ seoDescription: e.target.value })}
                  />
                </div>
              </div>
            </section>
          </form>
        </div>

        {/* ── Footer (sticky) ── */}
        <div className="pm-footer">
          <button
            type="button"
            className="pm-btn pm-btn--ghost"
            onClick={onClose}
            disabled={formLoading}
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            form="product-form"
            className="pm-btn pm-btn--primary"
            disabled={formLoading}
          >
            {formLoading ? (
              <>
                <Loader2 size={15} className="pm-spin" />
                Đang lưu...
              </>
            ) : editingProduct ? (
              <>
                <Check size={15} />
                Lưu thay đổi
              </>
            ) : (
              <>
                <Plus size={15} />
                Thêm sản phẩm
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
