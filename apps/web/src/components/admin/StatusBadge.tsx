export default function StatusBadge({
  status,
  label,
  color,
  small,
}: {
  status: string;
  label?: string;
  color?: string;
  small?: boolean;
}) {
  const colors: Record<string, { bg: string; text: string; label: string }> = {
    NEW: { bg: '#fef3c7', text: '#d97706', label: label || 'Mới' },
    CONFIRMED: { bg: '#dbeafe', text: '#2563eb', label: label || 'Đã xác nhận' },
    PREPARING: { bg: '#ede9fe', text: '#7c3aed', label: label || 'Chuẩn bị' },
    DELIVERING: { bg: '#cffafe', text: '#0891b2', label: label || 'Đang giao' },
    COMPLETED: { bg: '#d1fae5', text: '#059669', label: label || 'Hoàn tất' },
    CANCELLED: { bg: '#fee2e2', text: '#dc2626', label: label || 'Đã hủy' },
    RETURNED: { bg: '#ffedd5', text: '#ea580c', label: label || 'Trả hàng' },
    PENDING: { bg: '#fef3c7', text: '#d97706', label: label || 'Chờ duyệt' },
    APPROVED: { bg: '#d1fae5', text: '#059669', label: label || 'Đã duyệt' },
    REJECTED: { bg: '#fee2e2', text: '#dc2626', label: label || 'Từ chối' },
    ACTIVE: { bg: '#d1fae5', text: '#059669', label: label || 'Hoạt động' },
    INACTIVE: { bg: '#f1f5f9', text: '#64748b', label: label || 'Ẩn' },
    OUT_OF_STOCK: { bg: '#fee2e2', text: '#dc2626', label: label || 'Hết hàng' },
    FREE_SHIPPING: { bg: '#d1fae5', text: '#059669', label: label || 'Miễn phí ship' },
    PERCENT: { bg: '#dbeafe', text: '#2563eb', label: label || 'Giảm %' },
    FIXED_AMOUNT: { bg: '#ede9fe', text: '#7c3aed', label: label || 'Giảm tiền' },
  };

  const c = colors[status] || { bg: '#f1f5f9', text: '#64748b', label: label || status };

  return (
    <span
      style={{
        background: c.bg,
        color: color || c.text,
        padding: small ? '2px 8px' : '4px 12px',
        borderRadius: 20,
        fontSize: small ? 11 : 12,
        fontWeight: 700,
        display: 'inline-block',
        whiteSpace: 'nowrap',
      }}
    >
      {c.label}
    </span>
  );
}
