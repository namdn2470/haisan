import type { Metadata } from 'next';
import ClientLayout from '@/components/ClientLayout';
import { getStoreSettings } from '@/lib/store-settings';
import '../style.css';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getStoreSettings();

  const title = settings?.seoTitle || 'Hải Sản Biển Xanh — Tươi sống mỗi ngày';
  const description = settings?.seoDescription || 'Giao hải sản tươi sống trong ngày tại TP.HCM. Hải sản tươi, đông lạnh, sơ chế chất lượng cao.';
  const keywords = settings?.seoKeywords || 'hải sản, hải sản tươi, cá tươi, tôm, cua, ghẹ, TP.HCM';
  const ogImage = settings?.ogImage || undefined;

  return {
    title,
    description,
    keywords,
    openGraph: {
      title,
      description,
      ...(ogImage && { images: [{ url: ogImage, width: 1200, height: 630 }] }),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(ogImage && { images: [ogImage] }),
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
