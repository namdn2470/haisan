import HomeClient, {
  type HomeBanner,
  type HomeCategory,
  type HomeProduct,
} from '@/components/home/HomeClient';
import { getBanners, getCategories, getProducts } from '@/services/productService';

export const revalidate = 60;

export default async function HomePage() {
  const [categories, products, banners] = await Promise.all([
    getCategories(),
    getProducts({ sort: 'best-selling', limit: 12 }),
    getBanners('HOME_PROMO'),
  ]);

  return (
    <HomeClient
      categories={categories as HomeCategory[]}
      products={products as HomeProduct[]}
      banners={banners as HomeBanner[]}
    />
  );
}
