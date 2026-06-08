'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShoppingCart, Star } from 'lucide-react';
import { img } from '@/lib/api';
import { money } from '@/lib/money';
import { useCart } from '@/lib/cart-store';

export type SharedProductCardProduct = {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  oldPrice?: number;
  unit: string;
  badge?: string;
  ratingAvg?: number;
  soldCount?: number;
  shortDescription?: string;
  images?: { imageUrl: string }[];
};

const BADGE_MAP: Record<string, string> = {
  BAN_CHAY: 'Bán chạy',
  UU_DAI: 'Ưu đãi',
  TUOI_NGON: 'Tươi ngon',
  MOI: 'Mới',
};

export default function ProductCard({ product }: { product: SharedProductCardProduct }) {
  const { addToCart } = useCart();
  const [adding, setAdding] = useState(false);

  const handleAddToCart = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (adding) return;
    setAdding(true);
    await addToCart({
      productId: product.id,
      variantId: undefined,
      quantity: 1,
      selectedUnit: product.unit,
      priceAtTime: Number(product.basePrice),
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        basePrice: Number(product.basePrice),
        unit: product.unit,
        images: product.images || [],
      },
    });
    setAdding(false);
  };

  return (
    <article className="hs-pcard">
      <Link href={`/products/${product.slug}`} className="hs-pcard-img">
        <img src={product.images?.[0]?.imageUrl || img('prod-tom.jpg')} alt={product.name}
          onError={(e) => { const t = e.currentTarget; if (!t.dataset.fallback) { t.dataset.fallback = 'true'; t.src = 'https://images.pexels.com/photos/14480456/pexels-photo-14480456.jpeg?auto=compress&cs=tinysrgb&w=400'; } }} />
        {product.badge && <span className="hs-pcard-badge">{BADGE_MAP[product.badge] || product.badge}</span>}
      </Link>
      <div className="hs-pcard-body">
        <Link href={`/products/${product.slug}`} className="hs-pcard-name">{product.name}</Link>
        <small className="hs-pcard-spec">{product.shortDescription || `/${product.unit}`}</small>
        <div className="hs-pcard-rating">
          <Star size={13} fill="#f59e0b" stroke="#f59e0b" />
          <span>{Number(product.ratingAvg ?? 4.8).toFixed(1)}</span>
          <small>({product.soldCount ?? 0})</small>
        </div>
        <div className="hs-pcard-price">
          <b>{money(Number(product.basePrice))}<small>/{product.unit}</small></b>
          {product.oldPrice && <del>{money(Number(product.oldPrice))}</del>}
        </div>
      </div>
      <button className="hs-pcard-cart" onClick={handleAddToCart} disabled={adding} aria-label="Thêm vào giỏ">
        <ShoppingCart size={16} />
      </button>
    </article>
  );
}

export function ProductCardSkeleton({
  name,
  price,
  unit,
  badge,
  rating,
  reviews,
  oldPrice,
  img: imgKey,
}: {
  name: string;
  price: string;
  unit: string;
  badge?: string;
  rating: number;
  reviews: number;
  oldPrice?: string;
  img?: string;
}) {
  return (
    <article className="hs-pcard">
      <div className="hs-pcard-img">
        <img src={img(imgKey || 'prod-tom.jpg')} alt={name}
          onError={(e) => { const t = e.currentTarget; if (!t.dataset.fallback) { t.dataset.fallback = 'true'; t.src = 'https://images.pexels.com/photos/14480456/pexels-photo-14480456.jpeg?auto=compress&cs=tinysrgb&w=400'; } }} />
        {badge && <span className="hs-pcard-badge">{badge}</span>}
      </div>
      <div className="hs-pcard-body">
        <span className="hs-pcard-name">{name}</span>
        <small className="hs-pcard-spec">/{unit}</small>
        <div className="hs-pcard-rating">
          <Star size={13} fill="#f59e0b" stroke="#f59e0b" />
          <span>{rating}</span>
          <small>({reviews})</small>
        </div>
        <div className="hs-pcard-price">
          <b>{price}đ<small>/{unit}</small></b>
          {oldPrice && <del>{oldPrice}đ</del>}
        </div>
      </div>
      <button className="hs-pcard-cart" aria-label="Thêm vào giỏ"><ShoppingCart size={16} /></button>
    </article>
  );
}
