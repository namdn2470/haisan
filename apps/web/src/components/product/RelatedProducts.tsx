import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import ProductCard from '@/components/shared/ProductCard';

type RelatedProduct = {
  id: string; name: string; slug: string; basePrice: number; unit: string;
  oldPrice?: number; badge?: string; ratingAvg?: number; soldCount?: number; shortDescription?: string;
  images?: { imageUrl: string }[];
};

export default function RelatedProducts({
  products,
  currentSlug,
}: {
  products: RelatedProduct[];
  currentSlug: string;
}) {
  const filtered = products.filter(r => r.slug !== currentSlug).slice(0, 4);
  if (filtered.length === 0) return null;

  return (
    <section style={{ marginTop: 36 }}>
      <div className="section-title">
        <div>
          <h2>SẢN PHẨM THƯỜNG MUA CÙNG</h2>
          <div className="section-title-line" />
        </div>
        <Link href="/products" className="section-link">Xem tất cả <ChevronRight size={16} /></Link>
      </div>
      <div className="hs-products-grid">
        {filtered.map(rp => (
          <ProductCard key={rp.id} product={rp} />
        ))}
      </div>
    </section>
  );
}
