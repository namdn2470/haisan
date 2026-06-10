'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search, Filter, AlertTriangle, Package,
  X, TrendingUp, TrendingDown, History,
  Plus, Minus, Settings2, RefreshCw, ArrowUpDown,
} from 'lucide-react';
import { useToast } from '../layout-client';
import { fetchInventory, fetchInventoryLogs, importStock, exportStock, adjustStock } from '@/lib/admin/api';

interface InventoryItem {
  id: string;
  productId: string;
  productName: string;
  productImage?: string;
  sku: string;
  variant?: string;
  unit?: string;
  stockQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  lowStockThreshold: number;
  status: string;
  updatedAt: string;
}

interface InventoryLogItem {
  id: string;
  productId: string;
  productName: string;
  variantName?: string;
  variantSku?: string;
  type: 'IMPORT' | 'EXPORT' | 'ADJUSTMENT';
  quantity: number;
  oldQuantity: number;
  newQuantity: number;
  note?: string;
  createdAt: string;
}

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  IN_STOCK: { label: 'Còn hàng', color: '#15803d', bg: '#f0fdf4' },
  LOW_STOCK: { label: 'Sắp hết', color: '#a16207', bg: '#fefce8' },
  OUT_OF_STOCK: { label: 'Hết hàng', color: '#dc2626', bg: '#fef2f2' },
};

const LOG_TYPE_STYLE: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  IMPORT: { label: 'Nhập kho', color: '#15803d', bg: '#f0fdf4', icon: '↑' },
  EXPORT: { label: 'Xuất kho', color: '#dc2626', bg: '#fef2f2', icon: '↓' },
  ADJUSTMENT: { label: 'Điều chỉnh', color: '#0891b2', bg: '#ecfeff', icon: '↔' },
};



export default function InventoryPage() {
  const { success, error: showError } = useToast();

  const [activeTab, setActiveTab] = useState<'inventory' | 'history'>('inventory');
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [logs, setLogs] = useState<InventoryLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [logLoading, setLogLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search & filters
  const [search, setSearch] = useState('');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [logTypeFilter, setLogTypeFilter] = useState('');
  const [logPage, setLogPage] = useState(1);
  const [logTotal, setLogTotal] = useState(0);

  // Modal states
  const [showStockModal, setShowStockModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showThresholdModal, setShowThresholdModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [stockType, setStockType] = useState<'import' | 'export' | 'adjust'>('import');
  const [stockValue, setStockValue] = useState('');
  const [stockNote, setStockNote] = useState('');
  const [thresholdValue, setThresholdValue] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const loadInventory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchInventory({ search: search || undefined });
      setItems(result.data || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  const loadLogs = useCallback(async (page = 1) => {
    setLogLoading(true);
    try {
      const result = await fetchInventoryLogs({
        type: logTypeFilter || undefined,
        page,
        limit: 20,
      });
      setLogs(result.data || []);
      setLogTotal(result.total || 0);
      setLogPage(page);
    } catch {
      setLogs([]);
      setLogTotal(0);
    } finally {
      setLogLoading(false);
    }
  }, [logTypeFilter]);

  useEffect(() => {
    if (activeTab === 'inventory') {
      loadInventory();
    } else {
      loadLogs(1);
    }
  }, [activeTab, loadInventory, loadLogs]);

  const filtered = items.filter(item => {
    if (search) {
      const q = search.toLowerCase();
      if (
        !item.productName.toLowerCase().includes(q) &&
        !item.sku.toLowerCase().includes(q) &&
        !(item.variant?.toLowerCase().includes(q))
      ) {
        return false;
      }
    }
    if (showLowStockOnly) {
      return item.status !== 'IN_STOCK';
    }
    return true;
  });

  const lowStockCount = items.filter(i => i.status === 'LOW_STOCK').length;
  const outOfStockCount = items.filter(i => i.status === 'OUT_OF_STOCK').length;

  const openStockModal = (item: InventoryItem, type: 'import' | 'export' | 'adjust') => {
    setEditingItem(item);
    setStockType(type);
    setStockValue('');
    setStockNote('');
    setShowStockModal(true);
  };

  const openHistoryModal = (item: InventoryItem) => {
    setEditingItem(item);
    setShowHistoryModal(true);
  };

  const openThresholdModal = (item: InventoryItem) => {
    setEditingItem(item);
    setThresholdValue(String(item.lowStockThreshold));
    setShowThresholdModal(true);
  };

  const handleStockAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const qty = parseInt(stockValue, 10);
    if (isNaN(qty) || qty < 0) {
      showError('Số lượng không hợp lệ');
      return;
    }

    setFormLoading(true);
    try {
      if (stockType === 'import') {
        await importStock({ productId: editingItem.productId, quantity: qty, note: stockNote });
        success(`Đã nhập ${qty} vào kho "${editingItem.productName}"`);
      } else if (stockType === 'export') {
        await exportStock({ productId: editingItem.productId, quantity: qty, note: stockNote });
        success(`Đã xuất ${qty} khỏi kho "${editingItem.productName}"`);
      } else {
        await adjustStock({ productId: editingItem.productId, newQuantity: qty, note: stockNote });
        success(`Đã điều chỉnh tồn kho "${editingItem.productName}" thành ${qty}`);
      }

      await loadInventory();
      setShowStockModal(false);
    } catch (err: any) {
      showError(err?.message || 'Không thể thực hiện thao tác kho');
    } finally {
      setFormLoading(false);
    }
  };

  const handleThresholdUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    const val = parseInt(thresholdValue, 10);
    if (isNaN(val) || val < 0) {
      showError('Ngưỡng không hợp lệ');
      return;
    }
    setFormLoading(true);
    try {
      setItems(prev => prev.map(i =>
        i.id === editingItem.id ? { ...i, lowStockThreshold: val } : i
      ));
      success('Đã cập nhật ngưỡng cảnh báo');
      setShowThresholdModal(false);
    } catch (err: any) {
      showError(err?.message || 'Không thể cập nhật ngưỡng');
    } finally {
      setFormLoading(false);
    }
  };

  const handleRefresh = () => {
    if (activeTab === 'inventory') loadInventory();
    else loadLogs(logPage);
  };

  const stockTypeLabel = stockType === 'import' ? 'Nhập kho' : stockType === 'export' ? 'Xuất kho' : 'Điều chỉnh';
  const stockTypeColor = stockType === 'import' ? '#15803d' : stockType === 'export' ? '#dc2626' : '#0891b2';

  return (
    <div className="adm-page">
      {/* Page Header */}
      <div className="adm-page-header">
        <div>
          <h2>Quản lý kho hàng</h2>
          <p>
            {activeTab === 'inventory'
              ? items.length > 0 ? `${items.length} sản phẩm trong kho` : 'Không có sản phẩm nào'
              : 'Lịch sử nhập xuất kho'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="adm-btn-ghost" onClick={handleRefresh}>
            <RefreshCw size={15} />
            Làm mới
          </button>
        </div>
      </div>

      {/* Tab Switcher */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '2px solid #f1f5f9' }}>
        {[
          { key: 'inventory', label: 'Tồn kho', icon: <Package size={15} /> },
          { key: 'history', label: 'Lịch sử', icon: <History size={15} /> },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '10px 18px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab.key ? '2px solid #0891b2' : '2px solid transparent',
              color: activeTab === tab.key ? '#0891b2' : '#64748b',
              fontWeight: activeTab === tab.key ? 600 : 500,
              fontSize: 14,
              cursor: 'pointer',
              transition: 'all 0.15s',
              marginBottom: -2,
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'inventory' ? (
        <>
          {/* KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
            <div className="adm-kpi-card-v2">
              <div className="adm-kpi-icon-wrap" style={{ background: '#eff6ff' }}>
                <TrendingUp size={22} color="#1d4ed8" />
              </div>
              <div className="adm-kpi-body-v2">
                <span className="adm-kpi-label-v2">Tổng sản phẩm</span>
                <span className="adm-kpi-value-v2">{items.length}</span>
                <span className="adm-kpi-subtext" style={{ color: '#64748b' }}>trong kho</span>
              </div>
            </div>
            <div className="adm-kpi-card-v2">
              <div className="adm-kpi-icon-wrap" style={{ background: '#fefce8' }}>
                <AlertTriangle size={22} color="#a16207" />
              </div>
              <div className="adm-kpi-body-v2">
                <span className="adm-kpi-label-v2">Sắp hết hàng</span>
                <span className="adm-kpi-value-v2" style={{ color: '#a16207' }}>{lowStockCount}</span>
                <span className="adm-kpi-subtext" style={{ color: '#a16207' }}>cần nhập thêm</span>
              </div>
            </div>
            <div className="adm-kpi-card-v2">
              <div className="adm-kpi-icon-wrap" style={{ background: '#fef2f2' }}>
                <AlertTriangle size={22} color="#dc2626" />
              </div>
              <div className="adm-kpi-body-v2">
                <span className="adm-kpi-label-v2">Hết hàng</span>
                <span className="adm-kpi-value-v2" style={{ color: '#dc2626' }}>{outOfStockCount}</span>
                <span className="adm-kpi-subtext" style={{ color: '#dc2626' }}>cần nhập gấp</span>
              </div>
            </div>
          </div>

          {/* Toolbar */}
          <div className="adm-toolbar" style={{ marginBottom: showFilters ? 12 : 0 }}>
            <div className="adm-search-wrap">
              <Search size={16} className="adm-search-icon" />
              <input
                type="text"
                placeholder="Tìm theo tên, SKU..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="adm-search-input"
              />
              {search && (
                <button className="adm-search-clear" onClick={() => setSearch('')} tabIndex={-1}>×</button>
              )}
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
            <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
              <label style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 14px',
                background: showLowStockOnly ? '#fefce8' : '#fff',
                border: `1px solid ${showLowStockOnly ? '#fde68a' : '#e2e8f0'}`,
                borderRadius: 8, cursor: 'pointer', fontSize: 13,
                color: showLowStockOnly ? '#a16207' : '#475569', fontWeight: 500,
                transition: 'all 0.15s',
              }}>
                <input
                  type="checkbox"
                  checked={showLowStockOnly}
                  onChange={e => setShowLowStockOnly(e.target.checked)}
                  style={{ accentColor: '#a16207', width: 16, height: 16 }}
                />
                <AlertTriangle size={14} />
                Chỉ sắp hết / hết hàng
                {lowStockCount > 0 && (
                  <span style={{
                    background: '#a16207', color: '#fff', borderRadius: 999,
                    padding: '0 6px', fontSize: 11, fontWeight: 700,
                  }}>{lowStockCount}</span>
                )}
              </label>
              {(search || showLowStockOnly) && (
                <button className="adm-btn-ghost" onClick={() => { setSearch(''); setShowLowStockOnly(false); }}>
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
                <button className="adm-error-retry" onClick={loadInventory}>Thử lại</button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="adm-empty">
                <div className="adm-empty-icon"><Package size={32} /></div>
                <p className="adm-empty-title">Không có sản phẩm nào</p>
                <p className="adm-empty-desc">
                  {search || showLowStockOnly ? 'Không tìm thấy sản phẩm phù hợp' : 'Chưa có dữ liệu tồn kho'}
                </p>
              </div>
            ) : (
              <>
                <div style={{ overflowX: 'auto' }}>
                  <table className="adm-table">
                    <thead>
                      <tr>
                        <th>Sản phẩm</th>
                        <th>SKU</th>
                        <th style={{ textAlign: 'center' }}>Tồn kho</th>
                        <th style={{ textAlign: 'center' }}>Đặt trước</th>
                        <th style={{ textAlign: 'center' }}>Thực tế</th>
                        <th>Ngưỡng</th>
                        <th>Trạng thái</th>
                        <th style={{ textAlign: 'center' }}>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(item => {
                        const st = STATUS_STYLE[item.status] || {
                          label: item.status, color: '#64748b', bg: '#f1f5f9',
                        };
                        const stockColor = item.status === 'OUT_OF_STOCK' ? '#dc2626'
                          : item.status === 'LOW_STOCK' ? '#a16207' : '#0f172a';
                        const actualColor = item.availableQuantity === 0 ? '#dc2626'
                          : item.availableQuantity <= item.lowStockThreshold ? '#a16207' : '#0f172a';

                        return (
                          <tr key={item.id}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{
                                  width: 40, height: 40, borderRadius: 8,
                                  background: '#f1f5f9', overflow: 'hidden',
                                  flexShrink: 0, display: 'flex',
                                  alignItems: 'center', justifyContent: 'center',
                                }}>
                                  {item.productImage ? (
                                    <img src={item.productImage} alt={item.productName}
                                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  ) : (
                                    <Package size={20} color="#cbd5e1" />
                                  )}
                                </div>
                                <div>
                                  <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 13 }}>
                                    {item.productName}
                                  </div>
                                  {item.variant && (
                                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{item.variant}</div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td>
                              <span style={{
                                fontFamily: 'monospace', fontSize: 12,
                                color: '#0891b2', background: '#ecfeff',
                                padding: '2px 6px', borderRadius: 4,
                              }}>
                                {item.sku}
                              </span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <span style={{ fontWeight: 800, fontSize: 15, color: stockColor }}>
                                {item.stockQuantity}
                              </span>
                              {item.unit && (
                                <span style={{ fontSize: 10, color: '#94a3b8', marginLeft: 2 }}>{item.unit}</span>
                              )}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <span style={{ fontWeight: 600, fontSize: 13, color: '#64748b' }}>
                                {item.reservedQuantity}
                              </span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <span style={{ fontWeight: 700, fontSize: 15, color: actualColor }}>
                                {item.availableQuantity}
                              </span>
                            </td>
                            <td>
                              <span style={{ fontSize: 12, color: '#94a3b8', fontFamily: 'monospace' }}>
                                {item.lowStockThreshold}
                              </span>
                            </td>
                            <td>
                              <span className="adm-status-badge" style={{ color: st.color, background: st.bg }}>
                                {st.label}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'wrap' }}>
                                <button
                                  className="adm-action-trigger"
                                  title="Nhập kho"
                                  onClick={() => openStockModal(item, 'import')}
                                  style={{ color: '#15803d' }}
                                >
                                  <Plus size={14} />
                                </button>
                                <button
                                  className="adm-action-trigger"
                                  title="Xuất kho"
                                  onClick={() => openStockModal(item, 'export')}
                                  style={{ color: '#dc2626' }}
                                >
                                  <Minus size={14} />
                                </button>
                                <button
                                  className="adm-action-trigger"
                                  title="Điều chỉnh"
                                  onClick={() => openStockModal(item, 'adjust')}
                                  style={{ color: '#0891b2' }}
                                >
                                  <ArrowUpDown size={14} />
                                </button>
                                <button
                                  className="adm-action-trigger"
                                  title="Lịch sử"
                                  onClick={() => openHistoryModal(item)}
                                  style={{ color: '#7c3aed' }}
                                >
                                  <History size={14} />
                                </button>
                                <button
                                  className="adm-action-trigger"
                                  title="Cài ngưỡng"
                                  onClick={() => openThresholdModal(item)}
                                  style={{ color: '#64748b' }}
                                >
                                  <Settings2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 16px', background: '#f8fafc',
                  borderTop: '1px solid #f1f5f9', fontSize: 12, color: '#64748b',
                }}>
                  <span>Hiển thị {filtered.length} trong {items.length} sản phẩm</span>
                  {lowStockCount > 0 && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <AlertTriangle size={14} color="#a16207" />
                      {lowStockCount + outOfStockCount} sản phẩm sắp hết / hết hàng
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        </>
      ) : (
        /* === HISTORY TAB === */
        <>
          {/* History Filters */}
          <div className="adm-toolbar" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              {['', 'IMPORT', 'EXPORT', 'ADJUSTMENT'].map(type => (
                <button
                  key={type}
                  onClick={() => { setLogTypeFilter(type); setLogPage(1); }}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 8,
                    border: `1px solid ${logTypeFilter === type ? (type === 'IMPORT' ? '#15803d' : type === 'EXPORT' ? '#dc2626' : type === 'ADJUSTMENT' ? '#0891b2' : '#0891b2') : '#e2e8f0'}`,
                    background: logTypeFilter === type ? (type === 'IMPORT' ? '#f0fdf4' : type === 'EXPORT' ? '#fef2f2' : type === 'ADJUSTMENT' ? '#ecfeff' : '#ecfeff') : '#fff',
                    color: logTypeFilter === type ? (type === 'IMPORT' ? '#15803d' : type === 'EXPORT' ? '#dc2626' : type === 'ADJUSTMENT' ? '#0891b2' : '#475569') : '#64748b',
                    fontWeight: logTypeFilter === type ? 600 : 400,
                    fontSize: 13,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {type === '' ? 'Tất cả' : LOG_TYPE_STYLE[type]?.label || type}
                </button>
              ))}
            </div>
            <button className="adm-btn-ghost" onClick={handleRefresh}>
              <RefreshCw size={15} />
              Làm mới
            </button>
          </div>

          <div className="adm-card" style={{ padding: 0, overflow: 'hidden' }}>
            {logLoading ? (
              <div className="adm-loading-spinner" style={{ padding: 60 }} />
            ) : logs.length === 0 ? (
              <div className="adm-empty">
                <div className="adm-empty-icon"><History size={32} /></div>
                <p className="adm-empty-title">Không có lịch sử nào</p>
                <p className="adm-empty-desc">Chưa có thao tác nhập/xuất kho nào</p>
              </div>
            ) : (
              <>
                <div style={{ overflowX: 'auto' }}>
                  <table className="adm-table">
                    <thead>
                      <tr>
                        <th>Thời gian</th>
                        <th>Sản phẩm</th>
                        <th>Loại</th>
                        <th style={{ textAlign: 'center' }}>SL thay đổi</th>
                        <th style={{ textAlign: 'center' }}>SL cũ → Mới</th>
                        <th>Ghi chú</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map(log => {
                        const lt = LOG_TYPE_STYLE[log.type] || { label: log.type, color: '#64748b', bg: '#f1f5f9', icon: '?' };
                        const diff = log.newQuantity - log.oldQuantity;
                        const diffColor = diff > 0 ? '#15803d' : diff < 0 ? '#dc2626' : '#64748b';
                        const diffSign = diff > 0 ? '+' : '';

                        return (
                          <tr key={log.id}>
                            <td>
                              <span style={{ fontSize: 12, color: '#64748b', fontFamily: 'monospace' }}>
                                {new Date(log.createdAt).toLocaleString('vi-VN', {
                                  day: '2-digit', month: '2-digit', year: '2-digit',
                                  hour: '2-digit', minute: '2-digit',
                                })}
                              </span>
                            </td>
                            <td>
                              <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 13 }}>
                                {log.productName}
                              </div>
                              {log.variantName && (
                                <div style={{ fontSize: 11, color: '#94a3b8' }}>{log.variantName}</div>
                              )}
                            </td>
                            <td>
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                padding: '3px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                                color: lt.color, background: lt.bg,
                              }}>
                                <span>{lt.icon}</span>
                                {lt.label}
                              </span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <span style={{ fontWeight: 800, fontSize: 15, color: diffColor }}>
                                {diffSign}{diff}
                              </span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <span style={{ fontFamily: 'monospace', fontSize: 13, color: '#64748b' }}>
                                <span style={{ color: '#dc2626' }}>{log.oldQuantity}</span>
                                {' → '}
                                <span style={{ color: '#15803d' }}>{log.newQuantity}</span>
                              </span>
                            </td>
                            <td>
                              <span style={{ fontSize: 12, color: '#64748b', maxWidth: 200, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {log.note || '—'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 16px', background: '#f8fafc',
                  borderTop: '1px solid #f1f5f9', fontSize: 12, color: '#64748b',
                }}>
                  <span>Hiển thị {logs.length} / {logTotal} bản ghi</span>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button
                      className="adm-btn-ghost"
                      disabled={logPage <= 1}
                      onClick={() => loadLogs(logPage - 1)}
                      style={{ opacity: logPage <= 1 ? 0.4 : 1 }}
                    >
                      ← Trước
                    </button>
                    <span>Trang {logPage}</span>
                    <button
                      className="adm-btn-ghost"
                      onClick={() => loadLogs(logPage + 1)}
                    >
                      Sau →
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* === STOCK ACTION MODAL === */}
      {showStockModal && editingItem && (
        <div className="adm-modal-overlay" onClick={() => setShowStockModal(false)}>
          <div className="adm-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="adm-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {stockType === 'import' ? (
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <TrendingUp size={18} color="#15803d" />
                  </div>
                ) : stockType === 'export' ? (
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <TrendingDown size={18} color="#dc2626" />
                  </div>
                ) : (
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: '#ecfeff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ArrowUpDown size={18} color="#0891b2" />
                  </div>
                )}
                <h3 style={{ margin: 0, color: stockTypeColor }}>{stockTypeLabel}</h3>
              </div>
              <button className="adm-modal-close" onClick={() => setShowStockModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleStockAction}>
              <div className="adm-modal-body">
                {/* Product Info */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px', background: '#f8fafc',
                  borderRadius: 10, marginBottom: 16,
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 8, background: '#fff',
                    border: '1px solid #e2e8f0', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    {editingItem.productImage ? (
                      <img src={editingItem.productImage} alt={editingItem.productName}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
                    ) : (
                      <Package size={22} color="#94a3b8" />
                    )}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 14 }}>
                      {editingItem.productName}
                    </div>
                    {editingItem.variant && (
                      <div style={{ fontSize: 12, color: '#94a3b8' }}>{editingItem.variant}</div>
                    )}
                    <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#0891b2', marginTop: 2 }}>
                      {editingItem.sku}
                    </div>
                  </div>
                </div>

                {/* Stock info */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
                  {[
                    { label: 'Tồn kho hiện tại', value: editingItem.stockQuantity, color: '#0f172a' },
                    { label: 'Đặt trước', value: editingItem.reservedQuantity, color: '#64748b' },
                    { label: 'Thực tế', value: editingItem.availableQuantity, color: '#0f172a' },
                  ].map(stat => (
                    <div key={stat.label} style={{
                      padding: '10px 12px', background: '#f8fafc',
                      borderRadius: 8, textAlign: 'center',
                    }}>
                      <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>
                        {stat.label}
                      </div>
                      <div style={{ fontWeight: 800, fontSize: 18, color: stat.color }}>
                        {stat.value}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Stock type tabs */}
                <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
                  {[
                    { key: 'import', label: 'Nhập kho', color: '#15803d' },
                    { key: 'export', label: 'Xuất kho', color: '#dc2626' },
                    { key: 'adjust', label: 'Điều chỉnh', color: '#0891b2' },
                  ].map(btn => (
                    <button
                      key={btn.key}
                      type="button"
                      onClick={() => setStockType(btn.key as typeof stockType)}
                      style={{
                        flex: 1, padding: '8px 4px', borderRadius: 8, border: 'none',
                        background: stockType === btn.key ? btn.color : '#f1f5f9',
                        color: stockType === btn.key ? '#fff' : '#64748b',
                        fontWeight: stockType === btn.key ? 600 : 400,
                        fontSize: 13, cursor: 'pointer', transition: 'all 0.15s',
                      }}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>

                {/* Quantity input */}
                <div className="adm-form-group">
                  <label className="adm-form-label">
                    Số lượng {stockType === 'adjust' ? 'mới' : stockType === 'import' ? 'nhập vào' : 'xuất ra'}
                    <span style={{ color: '#ef4444' }}> *</span>
                  </label>
                  <input
                    type="number"
                    className="adm-form-input"
                    placeholder={stockType === 'adjust' ? 'Nhập số lượng mới...' : 'Nhập số lượng...'}
                    value={stockValue}
                    onChange={e => setStockValue(e.target.value)}
                    min={0}
                    required
                    autoFocus
                  />
                  {stockType === 'adjust' && (
                    <span className="adm-form-hint">
                      Nhập số lượng mới tuyệt đối. VD: nhập 50 thì tồn kho sẽ = 50.
                    </span>
                  )}
                  {stockType === 'import' && (
                    <span className="adm-form-hint">
                      Số lượng sẽ được cộng thêm vào tồn kho hiện tại.
                    </span>
                  )}
                  {stockType === 'export' && (
                    <span className="adm-form-hint">
                      Số lượng sẽ được trừ khỏi tồn kho hiện tại.
                    </span>
                  )}
                </div>

                {/* Preview */}
                {stockValue !== '' && !isNaN(parseInt(stockValue)) && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '10px 14px',
                    background: stockType === 'import' ? '#f0fdf4'
                      : stockType === 'export' ? '#fef2f2'
                      : '#ecfeff',
                    borderRadius: 8, fontSize: 13,
                    color: stockTypeColor, marginBottom: 12,
                  }}>
                    {stockType === 'adjust' ? (
                      <ArrowUpDown size={14} />
                    ) : stockType === 'import' ? (
                      <TrendingUp size={14} />
                    ) : (
                      <TrendingDown size={14} />
                    )}
                    <span>
                      Sau khi {stockType === 'import' ? 'nhập' : stockType === 'export' ? 'xuất' : 'điều chỉnh'}:&nbsp;
                      <strong>
                        {stockType === 'import'
                          ? editingItem.stockQuantity + parseInt(stockValue)
                          : stockType === 'export'
                          ? Math.max(0, editingItem.stockQuantity - parseInt(stockValue))
                          : parseInt(stockValue)}
                      </strong>
                      &nbsp;(thực tế:{' '}
                      <strong>
                        {stockType === 'import'
                          ? editingItem.stockQuantity + parseInt(stockValue) - editingItem.reservedQuantity
                          : stockType === 'export'
                          ? Math.max(0, editingItem.stockQuantity - parseInt(stockValue) - editingItem.reservedQuantity)
                          : parseInt(stockValue) - editingItem.reservedQuantity}
                      </strong>)
                    </span>
                  </div>
                )}

                {/* Note */}
                <div className="adm-form-group">
                  <label className="adm-form-label">Ghi chú</label>
                  <input
                    type="text"
                    className="adm-form-input"
                    placeholder="VD: Nhập hàng từ nhà cung cấp..."
                    value={stockNote}
                    onChange={e => setStockNote(e.target.value)}
                    maxLength={255}
                  />
                </div>
              </div>
              <div className="adm-modal-footer">
                <button type="button" className="adm-btn-ghost" onClick={() => setShowStockModal(false)}>
                  Hủy
                </button>
                <button
                  type="submit"
                  className="adm-btn-primary"
                  disabled={formLoading}
                  style={{
                    background: stockType === 'import' ? '#15803d'
                      : stockType === 'export' ? '#dc2626'
                      : '#0891b2',
                    borderColor: stockType === 'import' ? '#15803d'
                      : stockType === 'export' ? '#dc2626'
                      : '#0891b2',
                  }}
                >
                  {formLoading ? 'Đang xử lý...' : `Xác nhận ${stockTypeLabel}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* === THRESHOLD MODAL === */}
      {showThresholdModal && editingItem && (
        <div className="adm-modal-overlay" onClick={() => setShowThresholdModal(false)}>
          <div className="adm-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="adm-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Settings2 size={18} color="#64748b" />
                </div>
                <h3 style={{ margin: 0 }}>Cài ngưỡng cảnh báo</h3>
              </div>
              <button className="adm-modal-close" onClick={() => setShowThresholdModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleThresholdUpdate}>
              <div className="adm-modal-body">
                <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
                  Khi số lượng thực tế ≤ ngưỡng, sản phẩm sẽ chuyển sang trạng thái &quot;Sắp hết&quot;.
                </p>
                <div className="adm-form-group">
                  <label className="adm-form-label">
                    Ngưỡng cảnh báo <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    className="adm-form-input"
                    placeholder="VD: 10"
                    value={thresholdValue}
                    onChange={e => setThresholdValue(e.target.value)}
                    min={0}
                    required
                    autoFocus
                  />
                  <span className="adm-form-hint">
                    Hiện tại: <strong>{editingItem.lowStockThreshold}</strong> — Tồn kho thực tế: <strong>{editingItem.availableQuantity}</strong>
                  </span>
                </div>
              </div>
              <div className="adm-modal-footer">
                <button type="button" className="adm-btn-ghost" onClick={() => setShowThresholdModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="adm-btn-primary" disabled={formLoading}>
                  {formLoading ? 'Đang xử lý...' : 'Cập nhật'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* === HISTORY MODAL === */}
      {showHistoryModal && editingItem && (
        <div className="adm-modal-overlay" onClick={() => setShowHistoryModal(false)}>
          <div className="adm-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <div className="adm-modal-header">
              <div>
                <h3 style={{ margin: 0 }}>Lịch sử kho</h3>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
                  {editingItem.productName}
                  {editingItem.variant && ` — ${editingItem.variant}`}
                </p>
              </div>
              <button className="adm-modal-close" onClick={() => setShowHistoryModal(false)}><X size={18} /></button>
            </div>
            <div className="adm-modal-body" style={{ maxHeight: 480, overflowY: 'auto' }}>
              <p style={{ fontSize: 13, color: '#64748b', textAlign: 'center', padding: 20 }}>
                Lịch sử chi tiết theo sản phẩm sẽ hiển thị ở đây sau khi có dữ liệu thực tế từ API.
              </p>
            </div>
            <div className="adm-modal-footer">
              <button className="adm-btn-ghost" onClick={() => setShowHistoryModal(false)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
