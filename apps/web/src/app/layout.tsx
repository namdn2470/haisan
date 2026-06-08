import type { Metadata } from 'next';
import ClientLayout from '@/components/ClientLayout';
import '../style.css';

export const metadata: Metadata = {
  title: 'Hải Sản Biển Xanh — Tươi sống mỗi ngày',
  description: 'Giao hải sản tươi sống trong ngày tại TP.HCM',
};

export default function RootLayout({
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
