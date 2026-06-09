'use client';

import {
  X, Upload, ImageIcon, Link2, Loader2,
  AlertCircle, Check, Trash2,
} from 'lucide-react';
import { useState, useRef, useCallback, useEffect } from 'react';

export interface BannerFormData {
  title: string;
  subtitle: string;
  imageUrl: string;
  linkUrl: string;
  position: string;
  sortOrder: number;
  isActive: boolean;
  startAt: string;
  endAt: string;
}

interface BannerFormModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  initialData?: Partial<BannerFormData>;
  onClose: () => void;
  onSubmit: (data: BannerFormData) => Promise<void>;
}

const POSITION_OPTIONS = [
  { value: 'HOME_HERO', label: 'Hero Trang chủ' },
  { value: 'HOME_PROMO', label: 'Khuyến mãi Trang chủ' },
  { value: 'MOBILE_HERO', label: 'Banner Di động' },
  { value: 'SIDEBAR_PROMO', label: 'Banner Sidebar' },
];

const POSITION_COLORS: Record<string, string> = {
  HOME_HERO: '#0891b2',
  HOME_PROMO: '#7c3aed',
  MOBILE_HERO: '#059669',
  SIDEBAR_PROMO: '#d97706',
};

function toDateLocal(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export default function BannerFormModal({
  isOpen, mode, initialData, onClose, onSubmit,
}: BannerFormModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [submitError, setSubmitError] = useState('');

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState(initialData?.imageUrl || '');
  const [imageUrlInput, setImageUrlInput] = useState(initialData?.imageUrl || '');

  const [formErrors, setFormErrors] = useState<Partial<Record<keyof BannerFormData, string>>>({});

  const [form, setForm] = useState<BannerFormData>({
    title: initialData?.title || '',
    subtitle: initialData?.subtitle || '',
    imageUrl: initialData?.imageUrl || '',
    linkUrl: initialData?.linkUrl || '',
    position: initialData?.position || 'HOME_HERO',
    sortOrder: initialData?.sortOrder || 0,
    isActive: initialData?.isActive !== false,
    startAt: initialData?.startAt
      ? toDateLocal(initialData.startAt)
      : '',
    endAt: initialData?.endAt
      ? toDateLocal(initialData.endAt)
      : '',
  });

  useEffect(() => {
    if (!isOpen) return;
    setForm({
      title: initialData?.title || '',
      subtitle: initialData?.subtitle || '',
      imageUrl: initialData?.imageUrl || '',
      linkUrl: initialData?.linkUrl || '',
      position: initialData?.position || 'HOME_HERO',
      sortOrder: initialData?.sortOrder || 0,
      isActive: initialData?.isActive !== false,
      startAt: initialData?.startAt ? toDateLocal(initialData.startAt) : '',
      endAt: initialData?.endAt ? toDateLocal(initialData.endAt) : '',
    });
    setSelectedFile(null);
    setPreviewUrl(initialData?.imageUrl || '');
    setImageUrlInput(initialData?.imageUrl || '');
    setUploadError('');
    setSubmitError('');
    setFormErrors({});
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  }, [isOpen]);

  // ── Image helpers ────────────────────────────────────────────────────────────

  const processFile = useCallback((file: File) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) {
      setUploadError('Chỉ hỗ trợ JPG, PNG, WEBP, GIF');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File vượt quá 10MB');
      return;
    }
    setSelectedFile(file);
    setUploadError('');
    const reader = new FileReader();
    reader.onload = (e) => setPreviewUrl(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleImageUrlChange = (val: string) => {
    setImageUrlInput(val);
    setForm(prev => ({ ...prev, imageUrl: val }));
    setSelectedFile(null);
    setUploadError('');
    if (val && (val.startsWith('http://') || val.startsWith('https://'))) {
      setPreviewUrl(val);
    } else if (!val) {
      setPreviewUrl('');
    }
    setFormErrors(prev => ({ ...prev, imageUrl: '' }));
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  };

  const handleBrowseClick = () => fileInputRef.current?.click();

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setForm(prev => ({ ...prev, imageUrl: '' }));
    setImageUrlInput('');
    setUploadError('');
  };

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  // ── Validation ─────────────────────────────────────────────────────────────

  const validate = (): boolean => {
    const errors: Partial<Record<keyof BannerFormData, string>> = {};
    if (!form.title.trim()) errors.title = 'Tiêu đề là bắt buộc';
    if (!form.position) errors.position = 'Vị trí là bắt buộc';
    if (!form.imageUrl.trim() && !previewUrl && !selectedFile) {
      errors.imageUrl = 'Vui lòng chọn ảnh banner hoặc nhập URL';
    }
    if (form.startAt && form.endAt && new Date(form.endAt) <= new Date(form.startAt)) {
      errors.endAt = 'Ngày kết thúc phải sau ngày bắt đầu';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setUploading(true);
    setSubmitError('');
    try {
      let finalImageUrl = form.imageUrl || previewUrl;

      if (selectedFile) {
        const fd = new FormData();
        fd.append('file', selectedFile);
        const res = await fetch('/api/admin/banners/upload', {
          method: 'POST',
          body: fd,
        });
        const json = await res.json() as { success: boolean; data?: { imageUrl: string }; message?: string };
        if (!res.ok || !json.success) {
          setSubmitError(json.message || 'Upload ảnh thất bại');
          return;
        }
        finalImageUrl = json.data!.imageUrl;
      }

      await onSubmit({ ...form, imageUrl: finalImageUrl });
    } catch {
      setSubmitError('Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  const positionColor = POSITION_COLORS[form.position] || '#0891b2';
  const hasImage = !!(selectedFile || previewUrl);
  const showImageError = !!formErrors.imageUrl;

  return (
    <>
      {/* Backdrop */}
      <div className="bfm-backdrop" onClick={onClose} aria-hidden="true" />

      {/* Modal */}
      <div className="bfm-modal" role="dialog" aria-modal="true">

        {/* Header */}
        <div className="bfm-header">
          <div className="bfm-header__left">
            <div className="bfm-header__icon">
              <ImageIcon size={20} strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="bfm-header__title">
                {mode === 'create' ? 'Thêm banner mới' : 'Chỉnh sửa banner'}
              </h2>
              <p className="bfm-header__subtitle">
                Tạo banner hiển thị cho website, hỗ trợ upload ảnh hoặc dùng URL.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="bfm-header__close"
            onClick={onClose}
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form id="banner-form" onSubmit={handleSubmit} noValidate>
          <div className="bfm-body">

            {/* Two-column grid */}
            <div className="bfm-grid">

              {/* ── LEFT: Image Area ── */}
              <div className="bfm-col bfm-col--left">

                {/* Upload Zone */}
                <div className="bfm-section">
                  <p className="bfm-section-label">Ảnh banner</p>

                  {!hasImage ? (
                    <div
                      className={`bfm-dropzone ${dragActive ? 'bfm-dropzone--active' : ''}`}
                      onDragEnter={handleDragEnter}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={handleBrowseClick}
                      role="button"
                      tabIndex={0}
                      onKeyDown={e => e.key === 'Enter' && handleBrowseClick()}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        style={{ display: 'none' }}
                        onChange={handleFileInput}
                      />
                      <div className="bfm-dropzone__icon">
                        <Upload size={28} strokeWidth={1.5} />
                      </div>
                      <p className="bfm-dropzone__text">Kéo &amp; thả ảnh banner vào đây</p>
                      <p className="bfm-dropzone__hint">hoặc bấm để chọn ảnh từ máy</p>
                      <button type="button" className="bfm-dropzone__btn">
                        Chọn ảnh
                      </button>
                      <p className="bfm-dropzone__formats">JPG, PNG, WEBP, GIF · Tối đa 10MB</p>
                    </div>
                  ) : (
                    <div className="bfm-selected-image">
                      <div className="bfm-selected-image__preview">
                        <img
                          src={previewUrl}
                          alt="Banner preview"
                          className="bfm-selected-image__img"
                        />
                        {selectedFile && (
                          <div className="bfm-selected-image__badge">
                            <Check size={11} />
                            Đã chọn từ máy
                          </div>
                        )}
                      </div>
                      <div className="bfm-selected-image__actions">
                        <button
                          type="button"
                          className="bfm-selected-image__change"
                          onClick={handleBrowseClick}
                        >
                          <Upload size={13} />
                          Đổi ảnh khác
                        </button>
                        <button
                          type="button"
                          className="bfm-selected-image__remove"
                          onClick={handleRemoveImage}
                        >
                          <Trash2 size={13} />
                          Xóa
                        </button>
                      </div>
                      {selectedFile && (
                        <p className="bfm-selected-image__filename">
                          {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                        </p>
                      )}
                    </div>
                  )}

                  {(uploadError || (showImageError && !hasImage)) && (
                    <div className="bfm-error-msg">
                      <AlertCircle size={13} />
                      {uploadError || formErrors.imageUrl}
                    </div>
                  )}
                </div>

                {/* URL fallback */}
                <div className="bfm-section">
                  <p className="bfm-section-label bfm-section-label--sub">Hoặc dùng URL ảnh</p>
                  <input
                    type="url"
                    className={`bfm-input ${showImageError && !hasImage ? 'bfm-input--error' : ''}`}
                    placeholder="https://example.com/banner.jpg"
                    value={imageUrlInput}
                    onChange={e => handleImageUrlChange(e.target.value)}
                  />
                  {imageUrlInput && (imageUrlInput.startsWith('http://') || imageUrlInput.startsWith('https://')) && (
                    <div className="bfm-url-preview">
                      <Check size={12} />
                      <span>Dùng ảnh từ URL</span>
                    </div>
                  )}
                </div>

                {/* Preview card */}
                {hasImage && (
                  <div className="bfm-preview-card">
                    <div className="bfm-preview-card__img-wrap">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="bfm-preview-card__img"
                        onError={e => { (e.target as HTMLImageElement).style.opacity = '0.4'; }}
                      />
                    </div>
                    <div className="bfm-preview-card__footer">
                      <p className="bfm-preview-card__title">Xem trước banner</p>
                      <p className="bfm-preview-card__desc">Ảnh sẽ hiển thị trên website theo vị trí đã chọn</p>
                    </div>
                  </div>
                )}
              </div>

              {/* ── RIGHT: Info fields ── */}
              <div className="bfm-col bfm-col--right">

                {/* Title */}
                <div className="bfm-field">
                  <label className="bfm-label">
                    Tiêu đề <span className="bfm-label__required">*</span>
                  </label>
                  <input
                    type="text"
                    className={`bfm-input ${formErrors.title ? 'bfm-input--error' : ''}`}
                    placeholder="VD: Summer Sale — Giảm đến 30%"
                    value={form.title}
                    onChange={e => {
                      setForm(prev => ({ ...prev, title: e.target.value }));
                      setFormErrors(prev => ({ ...prev, title: '' }));
                    }}
                  />
                  {formErrors.title && (
                    <div className="bfm-field__error">
                      <AlertCircle size={12} />
                      {formErrors.title}
                    </div>
                  )}
                </div>

                {/* Subtitle */}
                <div className="bfm-field">
                  <label className="bfm-label">Mô tả ngắn</label>
                  <input
                    type="text"
                    className="bfm-input"
                    placeholder="VD: Ưu đãi đặc biệt nhân dịp hè 2026"
                    value={form.subtitle}
                    onChange={e => setForm(prev => ({ ...prev, subtitle: e.target.value }))}
                  />
                </div>

                {/* Link */}
                <div className="bfm-field">
                  <label className="bfm-label">
                    <Link2 size={13} />
                    Link điều hướng
                  </label>
                  <input
                    type="url"
                    className="bfm-input"
                    placeholder="https://example.com/khuyen-mai"
                    value={form.linkUrl}
                    onChange={e => setForm(prev => ({ ...prev, linkUrl: e.target.value }))}
                  />
                </div>

                {/* Position */}
                <div className="bfm-field">
                  <label className="bfm-label">
                    Vị trí <span className="bfm-label__required">*</span>
                  </label>
                  <div className="bfm-select-wrap">
                    <select
                      className={`bfm-select ${formErrors.position ? 'bfm-select--error' : ''}`}
                      value={form.position}
                      onChange={e => {
                        setForm(prev => ({ ...prev, position: e.target.value }));
                        setFormErrors(prev => ({ ...prev, position: '' }));
                      }}
                    >
                      {POSITION_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <div
                      className="bfm-select__dot"
                      style={{ background: positionColor }}
                    />
                  </div>
                  {formErrors.position && (
                    <div className="bfm-field__error">
                      <AlertCircle size={12} />
                      {formErrors.position}
                    </div>
                  )}
                </div>

                {/* Sort order */}
                <div className="bfm-field">
                  <label className="bfm-label">
                    Thứ tự hiển thị
                    <span className="bfm-label__hint">Số nhỏ hơn hiển thị trước</span>
                  </label>
                  <input
                    type="number"
                    className="bfm-input bfm-input--sm"
                    min={0}
                    value={form.sortOrder}
                    onChange={e => setForm(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
                  />
                </div>

                {/* Active switch */}
                <div className="bfm-field">
                  <label className="bfm-switch-row">
                    <div className="bfm-switch">
                      <input
                        type="checkbox"
                        checked={form.isActive}
                        onChange={e => setForm(prev => ({ ...prev, isActive: e.target.checked }))}
                      />
                      <span className="bfm-switch__slider" />
                    </div>
                    <div>
                      <span className="bfm-switch__label">
                        {form.isActive ? 'Hiển thị ngay' : 'Đang ẩn'}
                      </span>
                      <span className="bfm-switch__desc">
                        Banner sẽ hiển thị khi đang trong thời gian hiệu lực
                      </span>
                    </div>
                  </label>
                </div>

                {/* Date range */}
                <div className="bfm-field-group">
                  <div className="bfm-field">
                    <label className="bfm-label">Ngày bắt đầu</label>
                    <input
                      type="datetime-local"
                      className="bfm-input bfm-input--sm"
                      value={form.startAt}
                      onChange={e => setForm(prev => ({ ...prev, startAt: e.target.value }))}
                    />
                  </div>
                  <div className="bfm-field">
                    <label className="bfm-label">
                      Ngày kết thúc
                      {formErrors.endAt && (
                        <span className="bfm-label__required" style={{ marginLeft: 6, fontSize: 11 }}>— {formErrors.endAt}</span>
                      )}
                    </label>
                    <input
                      type="datetime-local"
                      className={`bfm-input bfm-input--sm ${formErrors.endAt ? 'bfm-input--error' : ''}`}
                      value={form.endAt}
                      onChange={e => {
                        setForm(prev => ({ ...prev, endAt: e.target.value }));
                        setFormErrors(prev => ({ ...prev, endAt: '' }));
                      }}
                    />
                  </div>
                </div>

                <p className="bfm-date-hint">
                  Để trống nếu banner luôn hiển thị (không giới hạn thời gian)
                </p>

                {/* Submit error */}
                {submitError && (
                  <div className="bfm-error-msg bfm-error-msg--alert">
                    <AlertCircle size={14} />
                    {submitError}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bfm-footer">
            <button
              type="button"
              className="bfm-btn bfm-btn--ghost"
              onClick={onClose}
              disabled={uploading}
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              form="banner-form"
              className="bfm-btn bfm-btn--primary"
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Loader2 size={15} className="bfm-spin" />
                  Đang tải lên...
                </>
              ) : mode === 'create' ? (
                <>
                  <ImageIcon size={15} />
                  Thêm banner
                </>
              ) : (
                <>
                  <Check size={15} />
                  Lưu thay đổi
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
