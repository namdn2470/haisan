'use client';

import { img } from '@/lib/api';
import type { Product } from '@/services/productService';

type AdminProduct = Product & {
  categoryId?: string;
  status?: string;
  imageUrl?: string;
  stockQuantity?: number;
};

interface Props {
  products: AdminProduct[];
}

export default function TopProducts({ products }: Props) {
  if (!products || products.length === 0) {
    return <div className="hs-admin-empty"><p>Chưa có dữ liệu sản phẩm</p></div>;
  }

  return (
    <div className="hs-top-products-grid">
      {products.slice(0, 4).map((product, i) => (
        <div className="hs-top-product-card" key={product.id}>
          <div className="hs-top-product-img-wrap">
            <img
              src={product.imageUrl || product.images?.[0]?.imageUrl || img('prod-tom.jpg')}
              alt={product.name}
              className="hs-top-product-img"
              onError={(e) => {
                const t = e.currentTarget as HTMLImageElement;
                if (!t.dataset.fb) {
                  t.dataset.fb = '1';
                  t.src = 'https://images.pexels.com/photos/14480456/pexels-photo-14480456.jpeg?auto=compress&cs=tinysrgb&w=400';
                }
              }}
            />
            <span className="hs-top-product-rank">{i + 1}</span>
          </div>
          <div className="hs-top-product-info">
            <span className="hs-top-product-name">{product.name}</span>
            <span className="hs-top-product-sold">
              Đã bán: <strong>{product.soldCount || 0} kg</strong>
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
