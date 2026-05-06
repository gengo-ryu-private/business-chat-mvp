'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';

import { useAuth } from '@/features/auth/AuthProvider';
import { logout } from '@/lib/auth/auth';
import { getTenant } from '@/lib/firestore/tenants';
import type { Tenant } from '@/types/models';

import { LogOut } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

type AuthenticatedLayoutProps = {
    children: ReactNode;
};

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
    const router = useRouter();
    const { appUser } = useAuth();

    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [loadingTenant, setLoadingTenant] = useState(true);

    useEffect(() => {
        async function fetchTenant() {
            if (!appUser) {
                setTenant(null);
                setLoadingTenant(false);
                return;
            }

            try {
                setLoadingTenant(true);
                const fetchedTenant = await getTenant(appUser.tenantId);
                setTenant(fetchedTenant);
            } finally {
                setLoadingTenant(false);
            }
        }

        fetchTenant();
    }, [appUser]);

    async function handleLogout() {
        await logout();
        router.push('/login');
    }

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b bg-card">
                <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <Link
                            href="/channels"
                            className="text-lg font-semibold tracking-normal"
                        >
                            Business Chat MVP
                        </Link>

                        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                            <span>
                                テナント:{' '}
                                {loadingTenant
                                    ? '読み込み中...'
                                    : tenant?.name ?? '未取得'}
                            </span>

                            {appUser && (
                                <>
                                    <Separator
                                        orientation="vertical"
                                        className="h-4"
                                    />
                                    <span>{appUser.displayName}</span>
                                    <Badge variant="secondary">{appUser.role}</Badge>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <nav className="flex items-center gap-3 text-sm">
                            <Link
                                href="/channels"
                                className="text-muted-foreground hover:text-foreground"
                            >
                                チャンネル
                            </Link>
                            <Link
                                href="/tenant"
                                className="text-muted-foreground hover:text-foreground"
                            >
                                テナント情報
                            </Link>
                        </nav>

                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleLogout}
                        >
                            <LogOut className="size-4" />
                            ログアウト
                        </Button>
                    </div>
                </div>
            </header>

            <div className="mx-auto max-w-6xl px-6 py-6">{children}</div>
        </div>
    );
}
