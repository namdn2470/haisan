'use client';

import React from 'react';
import { CartProvider, ToastContainer } from '@/lib/cart-store';
import { AuthProvider } from '@/contexts/AuthContext';
import { StoreSettingsProvider } from '@/contexts/StoreSettingsContext';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <StoreSettingsProvider>
        <CartProvider>
          {children}
          <ToastContainer />
        </CartProvider>
      </StoreSettingsProvider>
    </AuthProvider>
  );
}
