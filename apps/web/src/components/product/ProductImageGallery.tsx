'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Heart } from 'lucide-react';
import { img } from '@/lib/api';

type GalleryImage = { id: string; imageUrl: string; altText?: string; isThumbnail: boolean; sortOrder: number };

export default function ProductImageGallery({
  images,
  productName,
  badgeLabel,
  onToggleFavorite,
  isFavorite,
}: {
  images: GalleryImage[];
  productName: string;
  badgeLabel?: string;
  onToggleFavorite?: () => void;
  isFavorite?: boolean;
}) {
  const [activeImage, setActiveImage] = useState(0);
  const fallbackUrl = img('prod-ghe.jpg');

  const allImages = images.length > 0
    ? [...images].sort((a, b) => a.sortOrder - b.sortOrder)
    : [{ id: 'fallback', imageUrl: fallbackUrl, altText: productName, isThumbnail: true, sortOrder: 0 }];

  return (
    <div>
      <div className="detail-photo">
        {badgeLabel && <span className="badge">{badgeLabel}</span>}
        {onToggleFavorite && (
          <button
            onClick={onToggleFavorite}
            className="pd-fav-btn"
            aria-label="Yêu thích"
          >
            <Heart size={20} fill={isFavorite ? '#ef4444' : 'none'} stroke={isFavorite ? '#ef4444' : '#fff'} />
          </button>
        )}
        <img
          src={allImages[activeImage]?.imageUrl || fallbackUrl}
          alt={allImages[activeImage]?.altText || productName}
          onError={(e) => {
            const t = e.currentTarget;
            if (!t.dataset.fallback) { t.dataset.fallback = 'true'; t.src = fallbackUrl; }
          }}
        />
        {allImages.length > 1 && (
          <>
            <button className="pd-nav-btn pd-nav-prev" onClick={() => setActiveImage(i => i > 0 ? i - 1 : allImages.length - 1)}>
              <ChevronLeft size={22} />
            </button>
            <button className="pd-nav-btn pd-nav-next" onClick={() => setActiveImage(i => i < allImages.length - 1 ? i + 1 : 0)}>
              <ChevronRight size={22} />
            </button>
          </>
        )}
      </div>
      {allImages.length > 1 && (
        <div className="thumbs">
          {allImages.map((image, i) => (
            <button key={image.id} onClick={() => setActiveImage(i)}>
              <img
                src={image.imageUrl}
                alt={image.altText || productName}
                onError={(e) => {
                  const t = e.currentTarget;
                  if (!t.dataset.fallback) { t.dataset.fallback = 'true'; t.src = fallbackUrl; }
                }}
                style={{
                  border: i === activeImage ? '2px solid var(--blue)' : '2px solid transparent',
                  opacity: i === activeImage ? 1 : 0.6,
                }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
