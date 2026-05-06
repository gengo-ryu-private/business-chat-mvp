'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/features/auth/AuthProvider';

export default function HomePage() {
    const router = useRouter();
    const { loading, isAuthenticated } = useAuth();

    useEffect(() => {
        if (loading) {
            return;
        }

        if (isAuthenticated) {
            router.replace('/channels');
            return;
        }

        router.replace('/login');
    }, [loading, isAuthenticated, router]);

    return (
        <main className="flex min-h-screen items-center justify-center bg-background px-6">
            <p className="text-sm text-muted-foreground">
                画面を読み込み中...
            </p>
        </main>
    );
}
