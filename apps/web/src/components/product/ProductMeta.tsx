import { CheckCircle2, MapPin, Thermometer, Truck } from 'lucide-react';

type ProductMetaProps = {
  origin?: string | null;
  storageInstruction?: string | null;
  status: string;
  availableQuantity: number;
  deliveryInfo?: string | null;
};

export default function ProductMeta({ origin, storageInstruction, status, availableQuantity, deliveryInfo }: ProductMetaProps) {
  const isActive = status === 'ACTIVE';
  const stockText = isActive && availableQuantity > 0 ? `Còn ${availableQuantity}` : 'Hết hàng';
  const stockColor = isActive && availableQuantity > 0 ? 'var(--green)' : 'var(--red)';

  return (
    <table className="spec-table">
      <tbody>
        <tr>
          <td><MapPin size={14} style={{ marginRight: 4, verticalAlign: -2 }} /> Xuất xứ</td>
          <td>{origin || 'Đang cập nhật'}</td>
        </tr>
        <tr>
          <td><CheckCircle2 size={14} style={{ marginRight: 4, verticalAlign: -2 }} /> Tình trạng</td>
          <td>
            <span className="stock" style={{ color: stockColor }}>
              <CheckCircle2 size={14} /> {stockText}
            </span>
          </td>
        </tr>
        <tr>
          <td><Thermometer size={14} style={{ marginRight: 4, verticalAlign: -2 }} /> Bảo quản</td>
          <td>{storageInstruction || 'Bảo quản mát 0 - 5°C'}</td>
        </tr>
        <tr>
          <td><Truck size={14} style={{ marginRight: 4, verticalAlign: -2 }} /> Giao hàng</td>
          <td>{deliveryInfo || 'Giao nhanh trong 2h tại HCM'}</td>
        </tr>
      </tbody>
    </table>
  );
}
