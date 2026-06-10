import HomeClient, {
  type HomeBanner,
  type HomeCategory,
  type HomeProduct,
} from '@/components/home/HomeClient';
import { getBanners, getCategories, getProducts } from '@/services/productService';

export const revalidate = 60;

export default async function HomePage() {
  const [categories, products, banners, featuredProducts, bestSellerProducts] = await Promise.all([
    getCategories(),
    getProducts({ sort: 'best-selling', limit: 3 }),
    getBanners('HOME_PROMO'),
    getProducts({ featured: true, limit: 8 }),
    getProducts({ bestSeller: true, limit: 12 }),
  ]);

  return (
    <HomeClient
      categories={categories as HomeCategory[]}
      products={products as HomeProduct[]}
      banners={banners as HomeBanner[]}
      featuredProducts={featuredProducts as HomeProduct[]}
      bestSellerProducts={bestSellerProducts as HomeProduct[]}
    />
  );
}
