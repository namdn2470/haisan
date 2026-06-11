import DesktopHome from '@/components/home/DesktopHome';
import MobileHome from '@/components/mobile/MobileHome';
import { getBanners, getCategories, getProducts, getPublicShippingZones, type ShippingZone } from '@/services/productService';
import { getPublicConfig, parseConfigBool } from '@/services/configService';
import { getHomepageSectionsPublic, type HomeSectionPublic } from '@/services/homepageSectionService';
import type { HomeBanner, HomeCategory, HomeProduct } from '@/components/home/HomeClient';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [categories, products, banners, heroBanners, featuredProducts, bestSellerProducts, config, homeSections, shippingZones, comboProducts] = await Promise.all([
    getCategories().catch(() => []),
    getProducts({ sort: 'best-selling', limit: 6 }).catch(() => []),
    getBanners('HOME_PROMO').catch(() => []),
    getBanners('HOME_HERO').catch(() => []),
    getProducts({ featured: true, limit: 8 }).catch(() => []),
    getProducts({ bestSeller: true, limit: 12 }).catch(() => []),
    getPublicConfig().catch(() => ({})),
    getHomepageSectionsPublic().catch(() => []),
    getPublicShippingZones().catch(() => []),
    getProducts({ category: 'combo', limit: 4 }).catch(() => []),
  ]);

  const visible = {
    categories: parseConfigBool(config, 'home_categories_visible'),
    promo: parseConfigBool(config, 'home_promo_visible'),
    newArrival: parseConfigBool(config, 'home_newarrival_visible'),
    featured: parseConfigBool(config, 'home_featured_visible'),
    bestSeller: parseConfigBool(config, 'home_bestseller_visible'),
  };

  const heroBannersData = heroBanners as HomeBanner[];
  const categoriesData = categories as HomeCategory[];
  const bestSellerData = bestSellerProducts as HomeProduct[];
  const featuredData = featuredProducts as HomeProduct[];
  const productsData = products as HomeProduct[];
  const bannersData = banners as HomeBanner[];
  const sectionsData = homeSections as HomeSectionPublic[];
  const zonesData = shippingZones as ShippingZone[];
  const comboData = comboProducts as HomeProduct[];

  return (
    <>
      {/* MOBILE: Only MobileHome. Hidden on desktop (>= 768px) via .mobile-home-wrapper CSS. */}
      <div className="mobile-home-wrapper" data-section="mobile-home">
        <MobileHome
          categories={categoriesData}
          products={productsData}
          banners={bannersData}
          heroBanners={heroBannersData}
          bestSellerProducts={bestSellerData}
        />
      </div>

      {/* DESKTOP: Only DesktopHome. Hidden on mobile (< 768px) via .desktop-home-wrapper CSS. */}
      <div className="desktop-home-wrapper" data-section="desktop-home">
        <DesktopHome
          categories={categoriesData}
          products={productsData}
          banners={bannersData}
          heroBanners={heroBannersData}
          featuredProducts={featuredData}
          bestSellerProducts={bestSellerData}
          visible={visible}
          homeSections={sectionsData}
          shippingZones={zonesData}
          comboProducts={comboData}
        />
      </div>
    </>
  );
}
