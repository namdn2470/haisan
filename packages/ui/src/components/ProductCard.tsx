import { Star, Plus } from 'lucide-react';
import { PRODUCT_BADGE_LABEL } from '@hsbx/shared';

interface ProductCardProps {
  name: string;
  slug: string;
  image: string;
  badge?: string;
  price: number;
  oldPrice?: number;
  unit: string;
  rating: number;
  sold: number;
  spec?: string;
  onAddToCart?: () => void;
}

export function ProductCard({
  name,
  image,
  badge,
  price,
  oldPrice,
  unit,
  rating,
  sold,
  spec,
  onAddToCart,
}: ProductCardProps) {
  return (
    <article className="product-card">
      <a href={`/products/${name.toLowerCase().replace(/\s+/g, '-')}`} className="product-image">
        <img src={image} alt={name} />
        {badge && <span>{PRODUCT_BADGE_LABEL[badge] || badge}</span>}
      </a>
      <div className="product-body">
        <h3>{name}</h3>
        {spec && <p>{spec}</p>}
        <div className="rating">
          <Star size={15} fill="currentColor" /> {rating} <small>({sold})</small>
        </div>
        <div className="price-row">
          <b>{new Intl.NumberFormat('vi-VN').format(price)}đ</b>
          <em>/{unit}</em>
          {oldPrice ? <del>{new Intl.NumberFormat('vi-VN').format(oldPrice)}đ</del> : null}
        </div>
        <button className="add-cart" onClick={onAddToCart}>
          <Plus size={20} />
        </button>
      </div>
    </article>
  );
}
