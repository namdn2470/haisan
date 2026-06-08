'use client';

import React from 'react';
import { CartProvider, ToastContainer } from '@/lib/cart-store';
import { AuthProvider } from '@/contexts/AuthContext';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <CartProvider>
        {children}
        <ToastContainer />
      </CartProvider>
    </AuthProvider>
  );
}
