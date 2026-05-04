'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/features/auth/AuthProvider';

type AuthGuardProps = {
    children: ReactNode;
};

export function AuthGuard({ children }: AuthGuardProps) {
    const router = useRouter();
    const { loading, isAuthenticated } = useAuth();

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.replace('/login');
        }
    }, [loading, isAuthenticated, router]);

    if (loading) {
        return <p>読み込み中...</p>;
    }

    if (!isAuthenticated) {
        return <p>ログイン画面へ移動しています...</p>;
    }

    return <>{children}</>;
}
