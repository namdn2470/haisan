'use client';

import {
  X, FolderTree, Upload, Link2, Trash2, Loader2, AlertCircle, Check,
} from 'lucide-react';
import { useState, useRef, useCallback, useEffect } from 'react';

export interface CategoryFormValues {
  name: string;
  slug: string;
  parentId: string;
  description: string;
  imageUrl: string;
  iconUrl: string;
  sortOrder: string;
  isActive: boolean;
}

export interface ParentOption {
  id: string;
  name: string;
  depth: number;
}

interface CategoryFormModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  initialData?: Partial<CategoryFormValues>;
  parentOptions: ParentOption[];
  onClose: () => void;
  onSubmit: (data: CategoryFormValues) => Promise<void>;
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

const EMPTY: CategoryFormValues = {
  name: '', slug: '', parentId: '', description: '',
  imageUrl: '', iconUrl: '', sortOrder: '', isActive: true,
};

export default function CategoryFormModal({
  isOpen, mode, initialData, parentOptions, onClose, onSubmit,
}: CategoryFormModalProps) {
  const imageFileRef = useRef<HTMLInputElement>(null);
  const iconFileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<CategoryFormValues>(EMPTY);
  const [slugEdited, setSlugEdited] = useState(false);
  const [iconMode, setIconMode] = useState<'url' | 'upload'>('url');
  const [errors, setErrors] = useState<Partial<Record<keyof CategoryFormValues, string>>>({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const d = initialData ?? EMPTY;
    setForm({ ...EMPTY, ...d });
    setSlugEdited(mode === 'edit');
    const hasUploadedIcon = (d.iconUrl ?? '').startsWith('data:');
    setIconMode(hasUploadedIcon ? 'upload' : 'url');
    setErrors({});
    setSubmitError('');
    setSubmitting(false);
  }, [isOpen]); // intentionally omit initialData/mode — reset only when modal opens

  const handleNameChange = (value: string) => {
    setForm(prev => ({
      ...prev,
      name: value,
      slug: slugEdited ? prev.slug : slugify(value),
    }));
    if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
  };

  const handleSlugChange = (value: string) => {
    setSlugEdited(true);
    setForm(prev => ({ ...prev, slug: slugify(value) }));
    if (errors.slug) setErrors(prev => ({ ...prev, slug: '' }));
  };

  const handleImageFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, imageUrl: 'Ảnh vượt quá 5MB' }));
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setForm(prev => ({ ...prev, imageUrl: e.target?.result as string }));
      setErrors(prev => ({ ...prev, imageUrl: '' }));
    };
    reader.readAsDataURL(file);
  }, []);

  const handleIconFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    if (file.size > 2 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, iconUrl: 'Icon vượt quá 2MB' }));
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setForm(prev => ({ ...prev, iconUrl: e.target?.result as string }));
      setErrors(prev => ({ ...prev, iconUrl: '' }));
    };
    reader.readAsDataURL(file);
  }, []);

  const validate = (): boolean => {
    const errs: Partial<Record<keyof CategoryFormValues, string>> = {};
    if (!form.name.trim()) errs.name = 'Tên danh mục là bắt buộc';
    const slug = form.slug.trim() || slugify(form.name);
    if (!slug) errs.slug = 'Slug là bắt buộc';
    else if (!/^[a-z0-9-]+$/.test(slug)) errs.slug = 'Slug chỉ gồm chữ thường, số và dấu gạch ngang';
    if (form.sortOrder !== '' && Number(form.sortOrder) < 0) errs.sortOrder = 'Thứ tự phải ≥ 0';
    if (
      form.imageUrl &&
      !form.imageUrl.startsWith('data:') &&
      !/^https?:\/\/.+/.test(form.imageUrl)
    ) {
      errs.imageUrl = 'URL ảnh không hợp lệ';
    }
    if (
      iconMode === 'url' &&
      form.iconUrl &&
      !form.iconUrl.startsWith('data:') &&
      !/^https?:\/\/.+/.test(form.iconUrl)
    ) {
      errs.iconUrl = 'URL icon không hợp lệ';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      await onSubmit(form);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Có lỗi xảy ra, vui lòng thử lại';
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const descLen = form.description.length;
  const iconUrlValue = form.iconUrl.startsWith('data:') ? '' : form.iconUrl;

  return (
    <>
      <div className="cfm-backdrop" onClick={onClose} aria-hidden="true" />
      <div className="cfm-modal" role="dialog" aria-modal="true">

        {/* ── Header ── */}
        <div className="cfm-header">
          <div className="cfm-header__left">
            <div className="cfm-header__icon">
              <FolderTree size={20} strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="cfm-header__title">
                {mode === 'create' ? 'Thêm danh mục mới' : 'Chỉnh sửa danh mục'}
              </h2>
              <p className="cfm-header__subtitle">
                Tạo nhóm sản phẩm để khách hàng dễ tìm kiếm hơn
              </p>
            </div>
          </div>
          <button
            type="button"
            className="cfm-header__close"
            onClick={onClose}
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Form ── */}
        <form id="cfm-form" onSubmit={handleSubmit} noValidate>
          <div className="cfm-body">

            {/* Section 1: Thông tin cơ bản */}
            <div className="cfm-section">
              <div className="cfm-section-header">
                <span className="cfm-section-badge">1</span>
                <span className="cfm-section-title">Thông tin cơ bản</span>
              </div>
              <div className="cfm-fields">

                {/* Name */}
                <div className="cfm-field">
                  <label className="cfm-label">
                    Tên danh mục <span className="cfm-label__required">*</span>
                  </label>
                  <input
                    type="text"
                    className={`cfm-input ${errors.name ? 'cfm-input--error' : ''}`}
                    placeholder="VD: Tôm tươi sống, Cua biển, Combo tiết kiệm..."
                    value={form.name}
                    onChange={e => handleNameChange(e.target.value)}
                    autoFocus
                  />
                  {errors.name && (
                    <div className="cfm-field__error">
                      <AlertCircle size={12} /> {errors.name}
                    </div>
                  )}
                </div>

                {/* Slug */}
                <div className="cfm-field">
                  <label className="cfm-label">
                    Slug
                    <span className="cfm-label__auto">— tự tạo từ tên</span>
                  </label>
                  <div className="cfm-slug-wrap">
                    <span className="cfm-slug-prefix">/products?category=</span>
                    <input
                      type="text"
                      className={`cfm-input cfm-input--slug ${errors.slug ? 'cfm-input--error' : ''}`}
                      placeholder="ten-danh-muc"
                      value={form.slug}
                      onChange={e => handleSlugChange(e.target.value)}
                    />
                  </div>
                  {errors.slug && (
                    <div className="cfm-field__error">
                      <AlertCircle size={12} /> {errors.slug}
                    </div>
                  )}
                </div>

                {/* Parent category */}
                <div className="cfm-field">
                  <label className="cfm-label">Danh mục cha</label>
                  <div className="cfm-select-wrap">
                    <select
                      className="cfm-select"
                      value={form.parentId}
                      onChange={e => setForm(prev => ({ ...prev, parentId: e.target.value }))}
                    >
                      <option value="">— Danh mục gốc (không có cha) —</option>
                      {parentOptions.map(opt => (
                        <option key={opt.id} value={opt.id}>
                          {' '.repeat(opt.depth * 4)}{opt.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div className="cfm-field">
                  <label className="cfm-label cfm-label--row">
                    <span>Mô tả</span>
                    <span className="cfm-desc-counter">{descLen}/200</span>
                  </label>
                  <textarea
                    className="cfm-textarea"
                    placeholder="Mô tả ngắn về danh mục để khách hàng hiểu rõ hơn..."
                    rows={3}
                    maxLength={200}
                    value={form.description}
                    onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Hình ảnh & biểu tượng */}
            <div className="cfm-section">
              <div className="cfm-section-header">
                <span className="cfm-section-badge">2</span>
                <span className="cfm-section-title">Hình ảnh &amp; biểu tượng</span>
              </div>
              <div className="cfm-fields cfm-fields--2col">

                {/* Category image */}
                <div className="cfm-field">
                  <label className="cfm-label">Ảnh danh mục</label>
                  {form.imageUrl ? (
                    <div className="cfm-img-preview">
                      <img
                        src={form.imageUrl}
                        alt="Ảnh danh mục"
                        className="cfm-img-preview__img"
                      />
                      <div className="cfm-img-preview__actions">
                        <button
                          type="button"
                          className="cfm-img-preview__change"
                          onClick={() => imageFileRef.current?.click()}
                        >
                          <Upload size={13} /> Đổi ảnh
                        </button>
                        <button
                          type="button"
                          className="cfm-img-preview__remove"
                          onClick={() => setForm(prev => ({ ...prev, imageUrl: '' }))}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="cfm-dropzone"
                      onClick={() => imageFileRef.current?.click()}
                      role="button"
                      tabIndex={0}
                      onKeyDown={e => e.key === 'Enter' && imageFileRef.current?.click()}
                      onDragOver={e => e.preventDefault()}
                      onDrop={e => {
                        e.preventDefault();
                        const file = e.dataTransfer.files?.[0];
                        if (file) handleImageFile(file);
                      }}
                    >
                      <div className="cfm-dropzone__icon">
                        <Upload size={22} strokeWidth={1.5} />
                      </div>
                      <p className="cfm-dropzone__text">Chọn ảnh</p>
                      <p className="cfm-dropzone__hint">PNG, JPG, WEBP · tối đa 5MB</p>
                    </div>
                  )}
                  <input
                    ref={imageFileRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) handleImageFile(file);
                      e.target.value = '';
                    }}
                  />
                  {errors.imageUrl && (
                    <div className="cfm-field__error">
                      <AlertCircle size={12} /> {errors.imageUrl}
                    </div>
                  )}
                </div>

                {/* Icon */}
                <div className="cfm-field">
                  <label className="cfm-label">Biểu tượng (icon)</label>

                  {/* Tab toggle: URL / Upload */}
                  <div className="cfm-icon-tabs">
                    <button
                      type="button"
                      className={`cfm-icon-tab ${iconMode === 'url' ? 'active' : ''}`}
                      onClick={() => setIconMode('url')}
                    >
                      <Link2 size={12} /> Nhập URL
                    </button>
                    <button
                      type="button"
                      className={`cfm-icon-tab ${iconMode === 'upload' ? 'active' : ''}`}
                      onClick={() => { setIconMode('upload'); }}
                    >
                      <Upload size={12} /> Upload
                    </button>
                  </div>

                  {iconMode === 'url' ? (
                    <div className="cfm-icon-url-wrap">
                      <input
                        type="url"
                        className={`cfm-input ${errors.iconUrl ? 'cfm-input--error' : ''}`}
                        placeholder="https://example.com/icon.png"
                        value={iconUrlValue}
                        onChange={e => {
                          setForm(prev => ({ ...prev, iconUrl: e.target.value }));
                          if (errors.iconUrl) setErrors(prev => ({ ...prev, iconUrl: '' }));
                        }}
                      />
                      {iconUrlValue && (
                        <div className="cfm-icon-url-preview">
                          <img
                            src={iconUrlValue}
                            alt="icon preview"
                            onError={e => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                          <span className="cfm-icon-url-preview__label">
                            <Check size={11} /> Xem trước
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      {form.iconUrl ? (
                        <div className="cfm-icon-preview">
                          <img
                            src={form.iconUrl}
                            alt="icon"
                            className="cfm-icon-preview__img"
                          />
                          <div className="cfm-icon-preview__overlay">
                            <button
                              type="button"
                              className="cfm-icon-preview__btn"
                              onClick={() => iconFileRef.current?.click()}
                              title="Đổi icon"
                            >
                              <Upload size={13} />
                            </button>
                            <button
                              type="button"
                              className="cfm-icon-preview__btn cfm-icon-preview__btn--danger"
                              onClick={() => setForm(prev => ({ ...prev, iconUrl: '' }))}
                              title="Xóa icon"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          className="cfm-dropzone cfm-dropzone--sm"
                          onClick={() => iconFileRef.current?.click()}
                          role="button"
                          tabIndex={0}
                          onKeyDown={e => e.key === 'Enter' && iconFileRef.current?.click()}
                        >
                          <div className="cfm-dropzone__icon cfm-dropzone__icon--sm">
                            <Upload size={16} strokeWidth={1.5} />
                          </div>
                          <p className="cfm-dropzone__hint">PNG, JPG · tối đa 2MB</p>
                        </div>
                      )}
                      <input
                        ref={iconFileRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) handleIconFile(file);
                          e.target.value = '';
                        }}
                      />
                    </div>
                  )}

                  {errors.iconUrl && (
                    <div className="cfm-field__error">
                      <AlertCircle size={12} /> {errors.iconUrl}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Section 3: Hiển thị */}
            <div className="cfm-section">
              <div className="cfm-section-header">
                <span className="cfm-section-badge">3</span>
                <span className="cfm-section-title">Hiển thị</span>
              </div>
              <div className="cfm-fields cfm-fields--2col">

                {/* Sort order */}
                <div className="cfm-field">
                  <label className="cfm-label">
                    Thứ tự hiển thị
                    <span className="cfm-label__hint">Số nhỏ hơn hiển thị trước</span>
                  </label>
                  <input
                    type="number"
                    className={`cfm-input cfm-input--sm ${errors.sortOrder ? 'cfm-input--error' : ''}`}
                    placeholder="0"
                    min="0"
                    value={form.sortOrder}
                    onChange={e => {
                      setForm(prev => ({ ...prev, sortOrder: e.target.value }));
                      if (errors.sortOrder) setErrors(prev => ({ ...prev, sortOrder: '' }));
                    }}
                  />
                  {errors.sortOrder && (
                    <div className="cfm-field__error">
                      <AlertCircle size={12} /> {errors.sortOrder}
                    </div>
                  )}
                </div>

                {/* isActive switch */}
                <div className="cfm-field">
                  <label className="cfm-label" style={{ visibility: 'hidden', pointerEvents: 'none' }}>
                    &nbsp;
                  </label>
                  <label className="cfm-switch-row">
                    <div className="cfm-switch">
                      <input
                        type="checkbox"
                        checked={form.isActive}
                        onChange={e => setForm(prev => ({ ...prev, isActive: e.target.checked }))}
                      />
                      <span className="cfm-switch__slider" />
                    </div>
                    <div>
                      <span className="cfm-switch__label">
                        {form.isActive ? 'Hiển thị trên website' : 'Đang ẩn'}
                      </span>
                      <span className="cfm-switch__desc">
                        Tắt nếu muốn ẩn danh mục khỏi trang khách hàng
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Submit error alert */}
            {submitError && (
              <div className="cfm-error-alert">
                <AlertCircle size={14} /> {submitError}
              </div>
            )}
          </div>

          {/* ── Footer ── */}
          <div className="cfm-footer">
            <button
              type="button"
              className="cfm-btn cfm-btn--ghost"
              onClick={onClose}
              disabled={submitting}
            >
              Hủy
            </button>
            <button
              type="submit"
              form="cfm-form"
              className="cfm-btn cfm-btn--primary"
              disabled={submitting}
            >
              {submitting ? (
                <><Loader2 size={15} className="cfm-spin" /> Đang lưu...</>
              ) : mode === 'create' ? (
                <><FolderTree size={15} /> Thêm danh mục</>
              ) : (
                <><Check size={15} /> Lưu thay đổi</>
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
