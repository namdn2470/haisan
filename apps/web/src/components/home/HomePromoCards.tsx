'use client';

import Link from 'next/link';
import {
  Users, BadgePercent, ChefHat,
  LucideIcon,
} from 'lucide-react';
import type { HomeBanner } from './HomeClient';

interface PromoCardData {
  title: string;
  subtitle: string;
  cta: string;
  href: string;
  tone: 'coral' | 'green' | 'yellow';
  Icon: LucideIcon;
}

const PROMO_CARDS: PromoCardData[] = [
  {
    tone: 'coral',
    title: 'Combo gia đình',
    subtitle: 'Tiết kiệm đến 20%',
    cta: 'Ăn ngon - Tiết kiệm',
    href: '/products?category=combo',
    Icon: Users,
  },
  {
    tone: 'green',
    title: 'Hải sản sơ chế',
    subtitle: 'Làm sạch - Tiện lợi',
    cta: 'Sạch sẽ - Nấu ngay',
    href: '/products?category=hai-san-so-che',
    Icon: ChefHat,
  },
  {
    tone: 'yellow',
    title: 'Ưu đãi hôm nay',
    subtitle: 'Giảm giá sốc mỗi ngày',
    cta: 'Xem ưu đãi ngay',
    href: '/products',
    Icon: BadgePercent,
  },
];

function getBannerProps(banner: HomeBanner, index: number): Pick<PromoCardData, 'title' | 'subtitle' | 'href'> {
  const defaults = PROMO_CARDS[index] || PROMO_CARDS[0];
  return {
    title: banner.title || defaults.title,
    subtitle: banner.subtitle || defaults.subtitle,
    href: banner.linkUrl || banner.link || defaults.href,
  };
}

interface HomePromoCardsProps {
  banners: HomeBanner[];
}

export default function HomePromoCards({ banners }: HomePromoCardsProps) {
  const displayBanners = banners.slice(0, 3);

  const cards = displayBanners.length > 0
    ? displayBanners.map((banner, index) => ({
        ...PROMO_CARDS[index % 3],
        ...getBannerProps(banner, index),
        key: banner.id || index,
      }))
    : PROMO_CARDS.map((card) => ({ ...card, key: card.tone }));

  return (
    <section className="hpc-section">
      <div className="hpc-container">
        <div className="hpc-grid">
          {cards.map((card) => {
            const Icon = card.Icon;
            return (
              <Link
                key={card.key}
                href={card.href}
                className={`hpc-card hpc-card--${card.tone}`}
              >
                {/* Decorative blob */}
                <div className="hpc-decor" aria-hidden="true">
                  <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="80" cy="40" r="55" fill="currentColor" opacity="0.12" />
                    <circle cx="95" cy="70" r="35" fill="currentColor" opacity="0.08" />
                  </svg>
                </div>

                <div className="hpc-inner">
                  <div className="hpc-icon-box">
                    <Icon size={22} strokeWidth={2} />
                  </div>
                  <div className="hpc-text">
                    <div className="hpc-title">{card.title}</div>
                    <div className="hpc-subtitle">{card.subtitle}</div>
                    <div className="hpc-cta">{card.cta}</div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
