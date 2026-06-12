import { Leaf, Truck, Scale, RotateCcw } from 'lucide-react';

const COMMITMENTS = [
  { icon: Leaf, label: 'Tươi sống mỗi ngày', desc: 'Chọn lọc trước khi giao' },
  { icon: Truck, label: 'Giao nhanh 2h', desc: 'Nội thành TP.HCM' },
  { icon: Scale, label: 'Cân đúng', desc: 'Rõ quy cách, rõ giá' },
  { icon: RotateCcw, label: 'Đổi trả', desc: 'Nếu hàng không tươi' },
];

export default function ProductCommitments() {
  return (
    <div className="detail-services">
      {COMMITMENTS.map((c, i) => (
        <div key={i} className="mini-point">
          <span><c.icon size={18} /></span>
          <div>
            <b>{c.label}</b>
            <small>{c.desc}</small>
          </div>
        </div>
      ))}
    </div>
  );
}
