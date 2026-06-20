'use client';

import type { ReactNode } from 'react';

import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout';
import { AuthGuard } from '@/features/auth/AuthGuard';

type AuthenticatedRouteLayoutProps = {
  children: ReactNode;
};

export default function AuthenticatedRouteLayout({
  children,
}: AuthenticatedRouteLayoutProps) {
  return (
    <AuthGuard>
      <AuthenticatedLayout>{children}</AuthenticatedLayout>
    </AuthGuard>
  );
}
