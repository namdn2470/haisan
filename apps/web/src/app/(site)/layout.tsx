'use client';

import React from 'react';
import SiteShell from '@/components/shared/SiteShell';

interface SiteLayoutProps {
  children: React.ReactNode;
}

/**
 * SiteLayout — Wraps all customer-facing (public) pages.
 *
 * CRITICAL: Desktop shell (TopBar/Header/Nav/Footer) is provided by SiteShell,
 * but ONLY on desktop. Mobile pages use their own app-style chrome (header + bottom nav).
 *
 * Architecture:
 * - Desktop (>= md): SiteShell wraps children, providing header/footer chrome.
 * - Mobile (< md): Children render directly (SiteShell chrome is hidden via CSS).
 *
 * NOTE: page.tsx already uses conditional rendering (block md:hidden / hidden md:block)
 * to select MobileHome vs DesktopHome. This layout just provides the desktop chrome shell.
 */
export default function SiteLayout({ children }: SiteLayoutProps) {
  return (
    <SiteShell>
      {children}
    </SiteShell>
  );
}
