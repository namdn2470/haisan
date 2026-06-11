'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { useCart } from '@/lib/cart-store';
import { getProductBySlug, getProducts } from '@/services';

import ProductImageGallery from '@/components/product/ProductImageGallery';
import ProductInfo from '@/components/product/ProductInfo';
import ProductPurchaseCard from '@/components/product/ProductPurchaseCard';
import ProductTabs from '@/components/product/ProductTabs';
import RelatedProducts from '@/components/product/RelatedProducts';

type Variant = {
  id: string; name: string; sizeLabel?: string; price: number;
  oldPrice?: number; stockQuantity: number; sku: string; isActive?: boolean;
  minWeight?: string; maxWeight?: string;
};
type Review = { id: string; rating: number; comment?: string; createdAt: string; user: { fullName?: string } };
type ProductImage = { id: string; imageUrl: string; altText?: string; isThumbnail: boolean; sortOrder: number };
type ProcessingOption = { processingService: { id: string; name: string; price: number; description?: string } };
type ProductDetail = {
  id: string; name: string; slug: string; shortDescription?: string;
  description?: string; origin?: string; storageInstruction?: string;
  basePrice: number; oldPrice?: number; unit: string; badge?: string;
  status?: string;
  ratingAvg: number; ratingCount: number; soldCount: number;
  isFeatured: boolean; isBestSeller: boolean; isFreshLive: boolean;
  variants?: Variant[]; images?: ProductImage[];
  inventory?: { quantity: string | number; reservedQuantity?: string | number }[];
  processingOptions?: ProcessingOption[];
  category?: { name: string; slug: string };
  reviews?: Review[];
};
type RelatedProduct = {
  id: string; name: string; slug: string; basePrice: number; unit: string;
  oldPrice?: number; badge?: string; ratingAvg?: number; soldCount?: number; shortDescription?: string;
  images?: { imageUrl: string }[];
};

const BADGE_MAP: Record<string, string> = {
  BAN_CHAY: 'BÁN CHẠY', UU_DAI: 'ƯU ĐÃI', MOI: 'MỚI',
  TUOI_NGON: 'TƯƠI NGON', SALE: 'SALE',
};

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [related, setRelated] = useState<RelatedProduct[]>([]);
  const [qty, setQty] = useState(1);
  const [selectedUnit, setSelectedUnit] = useState('kg');
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [selectedProcessing, setSelectedProcessing] = useState<string>('');
  const [adding, setAdding] = useState(false);
  const [deliverySlot, setDeliverySlot] = useState('today-16-18');

  useEffect(() => {
    setLoading(true);
    getProductBySlug(slug).then(data => {
      setProduct(data as ProductDetail | null);
      if (data?.variants?.length) {
        const def = data.variants.find(v => v.isActive !== false) || data.variants[0];
        setSelectedVariant(def);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
    getProducts({ sort: 'sold', limit: 4 }).then(data => setRelated(data as RelatedProduct[])).catch(() => {});
  }, [slug]);

  const currentPrice = useMemo(() => {
    if (selectedVariant) return Number(selectedVariant.price);
    return Number(product?.basePrice || 0);
  }, [selectedVariant, product]);

  const availableQuantity = useMemo(() => {
    if (!product) return 0;
    if (selectedVariant) return Number(selectedVariant.stockQuantity || 0);
    return (product.inventory || []).reduce((sum, item) => {
      return sum + Number(item.quantity || 0) - Number(item.reservedQuantity || 0);
    }, 0);
  }, [product, selectedVariant]);

  const canPurchase = !!product && product.status === 'ACTIVE' && availableQuantity > 0;

  const handleAddToCart = async () => {
    if (!product || !canPurchase) return;
    setAdding(true);
    await addToCart({
      productId: product.id,
      variantId: selectedVariant?.id || undefined,
      quantity: qty,
      selectedUnit,
      processingServiceId: selectedProcessing || undefined,
      priceAtTime: currentPrice,
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        basePrice: Number(product.basePrice),
        unit: product.unit,
        images: product.images?.map(i => i.imageUrl) || [],
      },
    });
    setAdding(false);
  };

  const handleBuyNow = async () => {
    if (!product || !canPurchase) return;
    setAdding(true);
    await addToCart({
      productId: product.id,
      variantId: selectedVariant?.id || undefined,
      quantity: qty,
      selectedUnit,
      processingServiceId: selectedProcessing || undefined,
      priceAtTime: currentPrice,
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        basePrice: Number(product.basePrice),
        unit: product.unit,
        images: product.images?.map(i => i.imageUrl) || [],
      },
    });
    setAdding(false);
    window.location.href = '/checkout';
  };

  if (loading) {
    return (
      
        <div className="hs-container detail-page" style={{ padding: '40px 24px' }}>
          <div className="skeleton-card" style={{ height: 400 }} />
        </div>
      
    );
  }

  if (!product) {
    notFound();
    return null;
  }

  const badgeLabel = product.badge ? (BADGE_MAP[product.badge] || product.badge) : '';

  return (
    
      <main className="hs-container detail-page">
        <div className="hs-breadcrumb">
          <Link href="/">Trang chủ</Link> <ChevronRight size={14} />
          {product.category && (
            <>
              <Link href={`/products?category=${product.category.slug}`}>{product.category.name}</Link> <ChevronRight size={14} />
            </>
          )}
          <span>{product.name}</span>
        </div>

        <div className="detail-grid">
          <ProductImageGallery
            images={product.images || []}
            productName={product.name}
            badgeLabel={badgeLabel}
          />

          <ProductInfo
            name={product.name}
            ratingAvg={product.ratingAvg}
            ratingCount={product.ratingCount}
            soldCount={product.soldCount}
            shortDescription={product.shortDescription}
            origin={product.origin}
            storageInstruction={product.storageInstruction}
            status={product.status || 'ACTIVE'}
            variants={product.variants}
            selectedVariant={selectedVariant}
            onSelectVariant={setSelectedVariant}
            availableQuantity={availableQuantity}
          />

          <ProductPurchaseCard
            basePrice={Number(product.basePrice)}
            oldPrice={product.oldPrice}
            processingOptions={product.processingOptions}
            status={product.status || 'ACTIVE'}
            selectedVariant={selectedVariant}
            qty={qty}
            onQtyChange={setQty}
            selectedUnit={selectedUnit}
            onUnitChange={setSelectedUnit}
            selectedProcessing={selectedProcessing}
            onProcessingChange={setSelectedProcessing}
            deliverySlot={deliverySlot}
            onDeliverySlotChange={setDeliverySlot}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
            adding={adding}
          />
        </div>

        <ProductTabs
          name={product.name}
          description={product.description}
          shortDescription={product.shortDescription}
          reviews={product.reviews || []}
          imageUrl={product.images?.[0]?.imageUrl}
        />

        <RelatedProducts
          products={related}
          currentSlug={slug}
        />
      </main>
    
  );
}
