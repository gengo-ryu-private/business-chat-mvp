'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/features/auth/AuthProvider';

type GuestGuardProps = {
    children: ReactNode;
};

export function GuestGuard({ children }: GuestGuardProps) {
    const router = useRouter();
    const { loading, isAuthenticated } = useAuth();

    useEffect(() => {
        if (!loading && isAuthenticated) {
            router.replace('/channels');
        }
    }, [loading, isAuthenticated, router]);

    if (loading) {
        return <p>読み込み中...</p>;
    }

    if (isAuthenticated) {
        return <p>チャンネル一覧へ移動しています...</p>;
    }

    return <>{children}</>;
}
