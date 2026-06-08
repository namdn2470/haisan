import { Leaf, Truck, Scale, RotateCcw } from 'lucide-react';

const COMMITMENTS = [
  { icon: Leaf, label: 'Tươi sống mỗi ngày' },
  { icon: Truck, label: 'Giao nhanh 2h' },
  { icon: Scale, label: 'Cân đúng' },
  { icon: RotateCcw, label: 'Đổi trả' },
];

export default function ProductCommitments() {
  return (
    <div className="detail-services">
      {COMMITMENTS.map((c, i) => (
        <div key={i} className="mini-point">
          <span><c.icon size={18} /></span>
          <b>{c.label}</b>
        </div>
      ))}
    </div>
  );
}
