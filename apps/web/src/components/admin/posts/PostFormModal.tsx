'use client';

import {
  X, Image as ImageIcon, FileText, AlertCircle,
  ChevronDown, Loader2, Check, Plus, Link, Eye,
  Bold, Italic, Underline, List, Quote, Code,
  Table, Image,
} from 'lucide-react';
import { useState, useRef, useCallback, useEffect } from 'react';
import { uploadImage } from '@/lib/admin/api';

export interface PostFormData {
  title: string;
  slug: string;
  thumbnailUrl: string;
  excerpt: string;
  content: string;
  status: string;
  seoTitle: string;
  seoDescription: string;
}

interface PostFormModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  form: PostFormData;
  slugManual: boolean;
  formErrors: Record<string, string>;
  saving: boolean;
  onClose: () => void;
  onChange: (field: string, value: string) => void;
  onSlugManualChange: (v: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
}

// ─── Section header ──────────────────────────────────────────────────────────────
function SectionHeader({ number, title, subtitle }: { number: string; title: string; subtitle?: string }) {
  return (
    <div className="pfm-section-header">
      <div className="pfm-section-number">{number}</div>
      <div>
        <div className="pfm-section-title">{title}</div>
        {subtitle && <div className="pfm-section-subtitle">{subtitle}</div>}
      </div>
    </div>
  );
}

// ─── Image upload zone ────────────────────────────────────────────────────────
function ImageUploadSection({
  thumbnailUrl,
  onThumbnailUrlChange,
  onFileUpload,
  dragActive,
  uploading,
  onDragEnter,
  onDragLeave,
  onDrop,
  fileInputRef,
  onBrowseClick,
}: {
  thumbnailUrl: string;
  onThumbnailUrlChange: (v: string) => void;
  onFileUpload: (files: FileList | null) => void;
  dragActive: boolean;
  uploading: boolean;
  onDragEnter: () => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onBrowseClick: () => void;
}) {
  const [urlError, setUrlError] = useState(false);
  const [previewError, setPreviewError] = useState(false);

  const displayUrl = thumbnailUrl && !previewError ? thumbnailUrl : null;

  const handleUrlChange = (v: string) => {
    setPreviewError(false);
    setUrlError(false);
    onThumbnailUrlChange(v);
  };

  return (
    <div className="pfm-image-layout">
      {/* Left: drag & drop + upload */}
      <div className="pfm-image-left">
        <div
          className={`pfm-dropzone ${dragActive ? 'pfm-dropzone--active' : ''}`}
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={uploading ? undefined : onBrowseClick}
          style={uploading ? { cursor: 'default', opacity: 0.7 } : undefined}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => onFileUpload(e.target.files)}
          />
          {uploading ? (
            <>
              <Loader2 size={26} className="pfm-spin" style={{ color: '#0ea5e9' }} />
              <span className="pfm-dropzone__primary">Đang tải ảnh lên...</span>
            </>
          ) : (
            <>
              <div className="pfm-dropzone__icon">
                <ImageIcon size={26} strokeWidth={1.5} />
              </div>
              <div className="pfm-dropzone__text">
                <span className="pfm-dropzone__primary">Kéo &amp; thả ảnh vào đây</span>
                <span className="pfm-dropzone__secondary">
                  hoặc <span className="pfm-dropzone__link">bấm để tải ảnh lên</span>
                </span>
              </div>
              <span className="pfm-dropzone__hint">PNG, JPG, WEBP · tối đa 5MB</span>
            </>
          )}
        </div>

        {/* URL input */}
        <div className="pfm-url-input-group">
          <div className="pfm-url-input-header">
            <Link size={13} />
            <span>URL ảnh đại diện</span>
          </div>
          <input
            type="url"
            className={`pfm-input ${urlError ? 'pfm-input--error' : ''}`}
            placeholder="https://example.com/anh-bai-viet.jpg"
            value={thumbnailUrl}
            onChange={e => handleUrlChange(e.target.value)}
          />
          <span className="pfm-field-hint">
            Nhập URL ảnh nếu muốn dùng ảnh từ liên kết
          </span>
        </div>
      </div>

      {/* Right: preview */}
      <div className="pfm-image-preview">
        <div className="pfm-preview-label">
          <Eye size={13} />
          <span>Xem trước</span>
        </div>
        <div className={`pfm-preview-card ${displayUrl ? '' : 'pfm-preview-card--empty'}`}>
          {displayUrl ? (
            <img
              src={displayUrl}
              alt="Preview"
              onError={() => setPreviewError(true)}
            />
          ) : (
            <div className="pfm-preview-empty">
              <ImageIcon size={28} strokeWidth={1.2} />
              <span>Ảnh đại diện sẽ hiển thị tại đây</span>
            </div>
          )}
        </div>
        <span className="pfm-field-hint pfm-preview-hint">
          Kích thước khuyến nghị: 1200 × 630px
        </span>
      </div>
    </div>
  );
}

// ─── Content editor ────────────────────────────────────────────────────────────
function ContentEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertAt = (before: string, after = '') => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = value.slice(start, end);
    const newVal =
      value.slice(0, start) + before + selected + after + value.slice(end);
    onChange(newVal);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(
        start + before.length,
        start + before.length + selected.length,
      );
    }, 0);
  };

  const tools = [
    { icon: <Bold size={13} />, title: 'Bold', action: () => insertAt('**', '**') },
    { icon: <Italic size={13} />, title: 'Italic', action: () => insertAt('_', '_') },
    { icon: <Underline size={13} />, title: 'Underline', action: () => insertAt('__', '__') },
    { icon: <List size={13} />, title: 'List', action: () => insertAt('\n- ') },
    { icon: <Quote size={13} />, title: 'Quote', action: () => insertAt('\n> ') },
    { icon: <Code size={13} />, title: 'Code', action: () => insertAt('`', '`') },
    { icon: <Link size={13} />, title: 'Link', action: () => insertAt('[', '](url)') },
    { icon: <Image size={13} />, title: 'Image', action: () => insertAt('![alt](', ')') },
    { icon: <Table size={13} />, title: 'Table', action: () => insertAt('\n| Header | Header |\n|------|------|\n| Cell  | Cell  |\n') },
  ];

  return (
    <div className="pfm-content-editor">
      <div className="pfm-editor-toolbar">
        {tools.map((t, i) => (
          <button
            key={i}
            type="button"
            className="pfm-editor-tool"
            title={t.title}
            onClick={t.action}
          >
            {t.icon}
          </button>
        ))}
      </div>
      <textarea
        ref={textareaRef}
        className="pfm-textarea pfm-textarea--tall"
        placeholder="Nội dung bài viết... viết bằng Markdown"
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={10}
      />
    </div>
  );
}

// ─── Main Modal ────────────────────────────────────────────────────────────────
export default function PostFormModal({
  isOpen,
  mode,
  form,
  slugManual,
  formErrors,
  saving,
  onClose,
  onChange,
  onSlugManualChange,
  onSubmit,
}: PostFormModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setDragActive(false);
      setUploadingImage(false);
    }
  }, [isOpen]);

  const doUpload = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setUploadingImage(true);
    const url = await uploadImage(file);
    setUploadingImage(false);
    if (url) {
      onChange('thumbnailUrl', url);
    }
  }, [onChange]);

  const handleDragEnter = useCallback(() => setDragActive(true), []);
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragActive(false);
  }, []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files.length > 0) {
      doUpload(e.dataTransfer.files[0]);
    }
  }, [doUpload]);

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    doUpload(files[0]);
  };

  if (!isOpen) return null;

  const handleFormSubmit = (e: React.FormEvent) => {
    onSubmit(e);
  };

  const seoTitleLen = form.seoTitle.length;
  const seoDescLen = form.seoDescription.length;

  return (
    <>
      {/* Backdrop */}
      <div className="pfm-backdrop" onClick={onClose} aria-hidden="true" />

      {/* Modal */}
      <div className="pfm-modal" role="dialog" aria-modal="true" aria-labelledby="pfm-modal-title">

        {/* Header */}
        <div className="pfm-header">
          <div className="pfm-header__left">
            <div className="pfm-header__icon">
              <FileText size={20} />
            </div>
            <div>
              <h2 id="pfm-modal-title" className="pfm-header__title">
                {mode === 'create' ? 'Thêm bài viết mới' : 'Chỉnh sửa bài viết'}
              </h2>
              <p className="pfm-header__subtitle">
                Tạo nội dung mới để hiển thị trên website
              </p>
            </div>
          </div>
          <button type="button" className="pfm-header__close" onClick={onClose} aria-label="Đóng">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="pfm-body">
          <form id="post-form" onSubmit={handleFormSubmit} noValidate>

            {/* SECTION 1: Thông tin cơ bản */}
            <section className="pfm-section">
              <SectionHeader
                number="01"
                title="Thông tin cơ bản"
                subtitle="Tiêu đề, slug và mô tả ngắn"
              />
              <div className="pfm-grid pfm-grid--2col">

                {/* Title */}
                <div className="pfm-field pfm-field--full">
                  <label className="pfm-label">
                    Tiêu đề <span className="pfm-label__required">*</span>
                  </label>
                  <input
                    type="text"
                    className={`pfm-input ${formErrors.title ? 'pfm-input--error' : ''}`}
                    placeholder="VD: 5 loại hải sản tốt cho sức khỏe"
                    value={form.title}
                    onChange={e => onChange('title', e.target.value)}
                  />
                  {formErrors.title && (
                    <div className="pfm-field__error">
                      <AlertCircle size={13} />
                      <span>{formErrors.title}</span>
                    </div>
                  )}
                </div>

                {/* Slug */}
                <div className="pfm-field">
                  <label className="pfm-label">
                    Slug <span className="pfm-label__required">*</span>
                  </label>
                  <div className="pfm-input-prefix-wrap">
                    <span className="pfm-input-prefix">/</span>
                    <input
                      type="text"
                      className={`pfm-input pfm-input--prefixed ${formErrors.slug ? 'pfm-input--error' : ''}`}
                      placeholder="slug-bai-viet"
                      value={form.slug}
                      onChange={e => { onSlugManualChange(true); onChange('slug', e.target.value); }}
                    />
                  </div>
                  {formErrors.slug ? (
                    <div className="pfm-field__error">
                      <AlertCircle size={13} />
                      <span>{formErrors.slug}</span>
                    </div>
                  ) : (
                    <div className="pfm-field__hint">
                      {!slugManual
                        ? 'Tự động tạo từ tiêu đề'
                        : 'Tự sửa nếu cần URL riêng'}
                    </div>
                  )}
                </div>

                {/* Status */}
                <div className="pfm-field">
                  <label className="pfm-label">Trạng thái</label>
                  <div className="pfm-select-wrap">
                    <select
                      className="pfm-select"
                      value={form.status}
                      onChange={e => onChange('status', e.target.value)}
                    >
                      <option value="DRAFT">Bản nháp</option>
                      <option value="PUBLISHED">Đã đăng</option>
                      <option value="HIDDEN">Đã ẩn</option>
                    </select>
                    <ChevronDown size={15} className="pfm-select-wrap__icon" />
                  </div>
                </div>

                {/* Excerpt */}
                <div className="pfm-field pfm-field--full">
                  <label className="pfm-label">
                    Mô tả ngắn
                    <span className="pfm-label__hint">
                      <AlertCircle size={11} />
                      <span>Hiển thị dưới tiêu đề trong danh sách bài viết</span>
                    </span>
                  </label>
                  <textarea
                    className="pfm-textarea"
                    placeholder="Mô tả ngắn gọn, hấp dẫn về bài viết..."
                    rows={2}
                    value={form.excerpt}
                    onChange={e => onChange('excerpt', e.target.value)}
                  />
                </div>
              </div>
            </section>

            {/* SECTION 2: Nội dung bài viết */}
            <section className="pfm-section">
              <SectionHeader
                number="02"
                title="Nội dung bài viết"
                subtitle="Viết nội dung bằng định dạng Markdown"
              />
              <ContentEditor
                value={form.content}
                onChange={(v) => onChange('content', v)}
              />
            </section>

            {/* SECTION 3: Hình ảnh */}
            <section className="pfm-section">
              <SectionHeader
                number="03"
                title="Hình ảnh bài viết"
                subtitle="Ảnh đại diện hiển thị khi chia sẻ bài viết"
              />
              <ImageUploadSection
                thumbnailUrl={form.thumbnailUrl}
                onThumbnailUrlChange={(v) => onChange('thumbnailUrl', v)}
                onFileUpload={handleFileUpload}
                dragActive={dragActive}
                uploading={uploadingImage}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                fileInputRef={fileInputRef}
                onBrowseClick={handleBrowseClick}
              />
            </section>

            {/* SECTION 4: SEO */}
            <section className="pfm-section">
              <SectionHeader
                number="04"
                title="Tối ưu SEO"
                subtitle="Tối ưu tiêu đề và mô tả cho công cụ tìm kiếm"
              />
              <div className="pfm-grid pfm-grid--2col">
                <div className="pfm-field">
                  <label className="pfm-label">
                    SEO Title
                    <span className="pfm-label__counter">
                      {seoTitleLen}/60
                    </span>
                  </label>
                  <input
                    type="text"
                    className="pfm-input"
                    placeholder="Tiêu đề SEO (mặc định dùng tiêu đề bài viết)"
                    value={form.seoTitle}
                    onChange={e => onChange('seoTitle', e.target.value)}
                  />
                </div>
                <div className="pfm-field">
                  <label className="pfm-label">
                    SEO Description
                    <span className="pfm-label__counter">
                      {seoDescLen}/160
                    </span>
                  </label>
                  <textarea
                    className="pfm-textarea"
                    placeholder="Mô tả ngắn cho Google hiển thị (120–160 ký tự)"
                    rows={2}
                    value={form.seoDescription}
                    onChange={e => onChange('seoDescription', e.target.value)}
                  />
                </div>
              </div>
            </section>
          </form>
        </div>

        {/* Footer (sticky) */}
        <div className="pfm-footer">
          <button
            type="button"
            className="pfm-btn pfm-btn--ghost"
            onClick={onClose}
            disabled={saving}
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            form="post-form"
            className="pfm-btn pfm-btn--primary"
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 size={15} className="pfm-spin" />
                Đang lưu...
              </>
            ) : mode === 'create' ? (
              <>
                <Plus size={15} />
                Thêm bài viết
              </>
            ) : (
              <>
                <Check size={15} />
                Lưu thay đổi
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
