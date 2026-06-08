'use client';

import React from 'react';

/**
 * AdminLayout — Wraps all admin dashboard pages.
 *
 * Contains:
 * - AdminSidebar (navigation menu)
 * - AdminHeader (page title, notifications, user menu)
 * - Main content area
 *
 * This layout should NOT be used by customer-facing pages.
 * It is used by admin-only components under /quanly.
 *
 * Auth guard is handled before render by middleware and the /quanly server layout.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
