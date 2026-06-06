import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../style.css';

const inter = Inter({ subsets: ['vietnamese', 'latin'] });

export const metadata: Metadata = {
  title: 'Hải Sản Biển Xanh — Tươi sống mỗi ngày',
  description: 'Giao hải sản tươi sống trong ngày tại TP.HCM',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
