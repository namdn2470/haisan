import HomeClient, {
  type HomeBanner,
  type HomeCategory,
  type HomeProduct,
} from '@/components/home/HomeClient';
import { getBanners, getCategories, getProducts } from '@/services/productService';
import { getPublicConfig, parseConfigBool } from '@/services/configService';
import { getHomepageSectionsPublic, type HomeSectionPublic } from '@/services/homepageSectionService';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [categories, products, banners, heroBanners, featuredProducts, bestSellerProducts, config, homeSections] = await Promise.all([
    getCategories(),
    getProducts({ sort: 'best-selling', limit: 3 }),
    getBanners('HOME_PROMO'),
    getBanners('HOME_HERO'),
    getProducts({ featured: true, limit: 8 }),
    getProducts({ bestSeller: true, limit: 12 }),
    getPublicConfig(),
    getHomepageSectionsPublic(),
  ]);

  const visible = {
    categories: parseConfigBool(config, 'home_categories_visible'),
    promo: parseConfigBool(config, 'home_promo_visible'),
    newArrival: parseConfigBool(config, 'home_newarrival_visible'),
    featured: parseConfigBool(config, 'home_featured_visible'),
    bestSeller: parseConfigBool(config, 'home_bestseller_visible'),
  };

  return (
    <HomeClient
      categories={categories as HomeCategory[]}
      products={products as HomeProduct[]}
      banners={banners as HomeBanner[]}
      heroBanners={heroBanners as HomeBanner[]}
      featuredProducts={featuredProducts as HomeProduct[]}
      bestSellerProducts={bestSellerProducts as HomeProduct[]}
      visible={visible}
      homeSections={homeSections as HomeSectionPublic[]}
    />
  );
}
