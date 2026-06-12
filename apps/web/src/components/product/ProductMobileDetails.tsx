'use client';

import {
  CheckCircle2,
  Headphones,
  MapPin,
  PackageCheck,
  RotateCcw,
  ShieldCheck,
  Thermometer,
  Truck,
} from 'lucide-react';

type Variant = {
  id: string;
  name: string;
  sizeLabel?: string;
  price: number;
  oldPrice?: number;
  stockQuantity: number;
  sku: string;
  isActive?: boolean;
  minWeight?: string;
  maxWeight?: string;
};

const SERVICE_ITEMS = [
  {
    icon: Truck,
    title: 'Giao nhanh',
    desc: 'Nội thành trong 2h',
  },
  {
    icon: RotateCcw,
    title: 'Đổi trả',
    desc: 'Hỗ trợ nếu không tươi',
  },
  {
    icon: PackageCheck,
    title: 'Đóng gói kỹ',
    desc: 'Giữ lạnh khi vận chuyển',
  },
  {
    icon: Headphones,
    title: 'Hỗ trợ',
    desc: 'Tư vấn chọn món 24/7',
  },
];

function variantSpec(unit: string, selectedVariant: Variant | null) {
  if (!selectedVariant) return `Bán theo ${unit || 'kg'}`;
  if (selectedVariant.minWeight && selectedVariant.maxWeight) {
    return `${selectedVariant.name} · ${selectedVariant.minWeight}-${selectedVariant.maxWeight}kg`;
  }
  return selectedVariant.sizeLabel || selectedVariant.name;
}

export default function ProductMobileDetails({
  description,
  shortDescription,
  origin,
  storageInstruction,
  status,
  availableQuantity,
  unit,
  categoryName,
  selectedVariant,
}: {
  description?: string | null;
  shortDescription?: string | null;
  origin?: string | null;
  storageInstruction?: string | null;
  status: string;
  availableQuantity: number;
  unit: string;
  categoryName?: string;
  selectedVariant: Variant | null;
}) {
  const isAvailable = status === 'ACTIVE' && availableQuantity > 0;
  const descText = description || shortDescription || 'Đang cập nhật mô tả sản phẩm.';

  const details = [
    { icon: MapPin, label: 'Xuất xứ', value: origin || 'Đang cập nhật' },
    categoryName ? { icon: ShieldCheck, label: 'Danh mục', value: categoryName } : null,
    { icon: PackageCheck, label: 'Quy cách', value: variantSpec(unit, selectedVariant) },
    {
      icon: CheckCircle2,
      label: 'Tình trạng',
      value: isAvailable ? `Còn ${availableQuantity}` : 'Hết hàng',
      tone: isAvailable ? 'green' : 'red',
    },
    { icon: Thermometer, label: 'Bảo quản', value: storageInstruction || 'Bảo quản mát 0 - 5°C' },
    { icon: Truck, label: 'Giao hàng', value: 'Giao nhanh trong 2h tại HCM' },
  ].filter(Boolean) as {
    icon: typeof MapPin;
    label: string;
    value: string;
    tone?: 'green' | 'red';
  }[];

  return (
    <>
      <section className="pd-mobile-card pd-mobile-desc-card">
        <h2>Mô tả sản phẩm</h2>
        <p>{descText}</p>
      </section>

      <section className="pd-mobile-card">
        <h2>Thông tin chi tiết</h2>
        <div className="pd-mobile-spec-list">
          {details.map(item => (
            <div key={item.label} className="pd-mobile-spec-row">
              <span>
                <item.icon size={15} />
                {item.label}
              </span>
              <b className={item.tone ? `tone-${item.tone}` : ''}>{item.value}</b>
            </div>
          ))}
        </div>
      </section>

      <section className="pd-mobile-card">
        <h2>Cam kết dịch vụ</h2>
        <div className="pd-mobile-service-list">
          {SERVICE_ITEMS.map(item => (
            <div key={item.title} className="pd-mobile-service-row">
              <span><item.icon size={18} /></span>
              <div>
                <b>{item.title}</b>
                <small>{item.desc}</small>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
