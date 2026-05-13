import Link from 'next/link';

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
import type { AppUser, Tenant } from '@/types/models';
import { isAdmin } from '@/utils/permissions';

type TenantInfoProps = {
    tenant: Tenant;
    appUser: AppUser;
};

export function TenantInfo({ tenant, appUser }: TenantInfoProps) {
    return (
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
    );
}
