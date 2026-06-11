'use client';

import HomeClient, {
  type HomeBanner,
  type HomeCategory,
  type HomeProduct,
} from '@/components/home/HomeClient';
import type { HomeVisibility, HomeSectionPublic } from '@/components/home/HomeClient';
import type { ShippingZone } from '@/services/productService';

interface DesktopHomeProps {
  categories: HomeCategory[];
  products: HomeProduct[];
  banners: HomeBanner[];
  heroBanners?: HomeBanner[];
  featuredProducts: HomeProduct[];
  bestSellerProducts: HomeProduct[];
  visible: HomeVisibility;
  homeSections?: HomeSectionPublic[];
  shippingZones?: ShippingZone[];
  comboProducts?: HomeProduct[];
}

export default function DesktopHome({
  categories,
  products,
  banners,
  heroBanners = [],
  featuredProducts,
  bestSellerProducts,
  visible,
  homeSections,
  shippingZones = [],
  comboProducts = [],
}: DesktopHomeProps) {
  return (
    <section data-section="desktop-home">
      <HomeClient
        categories={categories}
        products={products}
        banners={banners}
        heroBanners={heroBanners}
        featuredProducts={featuredProducts}
        bestSellerProducts={bestSellerProducts}
        visible={visible}
        homeSections={homeSections}
        shippingZones={shippingZones}
        comboProducts={comboProducts}
      />
    </section>
  );
}
