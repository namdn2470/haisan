'use client';

import React from 'react';
import SiteShell from '@/components/shared/SiteShell';

interface SiteLayoutProps {
  children: React.ReactNode;
}

/**
 * SiteLayout — Wraps all customer-facing (public) pages.
 *
 * Contains:
 * - TopBar (promo bar)
 * - SiteHeader (logo, search, cart, account)
 * - SiteNavBar (category navigation)
 * - Main content area
 * - SiteFooter
 * - MobileBottomNav (mobile only)
 *
 * This layout should NOT be used by admin pages.
 * It is used by all routes under the public (site) group.
 */
export default function SiteLayout({ children }: SiteLayoutProps) {
  return (
    <SiteShell>
      {children}
    </SiteShell>
  );
}
