'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout';
import { AuthGuard } from '@/features/auth/AuthGuard';
import { useAuth } from '@/features/auth/AuthProvider';
import { getTenant } from '@/lib/firestore/tenants';
import type { Tenant } from '@/types/models';
import { isAdmin } from '@/utils/permissions';

import {
    Alert,
    AlertDescription,
} from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function TenantPage() {
    return (
        <AuthGuard>
            <AuthenticatedLayout>
                <TenantContent />
            </AuthenticatedLayout>
        </AuthGuard>
    );
}

function TenantContent() {
    const { appUser } = useAuth();

    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        async function fetchTenant() {
            if (!appUser) {
                setTenant(null);
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setErrorMessage('');

                const fetchedTenant = await getTenant(appUser.tenantId);

                if (!fetchedTenant) {
                    setErrorMessage('テナント情報が見つかりません。');
                    return;
                }

                setTenant(fetchedTenant);
            } catch {
                setErrorMessage('テナント情報の取得に失敗しました。');
            } finally {
                setLoading(false);
            }
        }

        fetchTenant();
    }, [appUser]);

    return (
        <main className="space-y-6">

            <div>
                <h1 className="text-2xl font-semibold tracking-normal">テナント情報</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    所属テナントとログインユーザーの情報を確認できます。
                </p>
            </div>

            {loading && (
                <p className="text-sm text-muted-foreground">
                    テナント情報を読み込み中...
                </p>
            )}

            {errorMessage && (
                <Alert variant="destructive">
                    <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
            )}

            {!loading && tenant && appUser && (
                <Card>
                    <CardHeader>
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div>
                                <CardTitle>{tenant.name}</CardTitle>
                                <CardDescription>
                                    現在ログイン中のユーザーと所属情報です。
                                </CardDescription>
                            </div>

                            <Badge variant="secondary">{appUser.role}</Badge>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        <dl className="grid gap-4 md:grid-cols-[160px_1fr]">
                            <dt className="text-sm font-medium text-muted-foreground">
                                ユーザー名
                            </dt>
                            <dd>{appUser.displayName}</dd>

                            <dt className="text-sm font-medium text-muted-foreground">
                                メールアドレス
                            </dt>
                            <dd>{appUser.email}</dd>

                            <dt className="text-sm font-medium text-muted-foreground">
                                ユーザー種別
                            </dt>
                            <dd>{appUser.role}</dd>

                            {isAdmin(appUser) && (
                                <>
                                    <dt className="text-sm font-medium text-muted-foreground">
                                        参加コード
                                    </dt>
                                    <dd>{tenant.joinCode}</dd>
                                </>
                            )}
                        </dl>

                        <Separator />

                        <Button asChild variant="outline">
                            <Link href="/channels">チャンネル一覧へ戻る</Link>
                        </Button>
                    </CardContent>
                </Card>
            )}
        </main>
    );
}
