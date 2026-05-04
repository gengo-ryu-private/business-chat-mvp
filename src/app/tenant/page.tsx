'use client';

import { AuthGuard } from '@/features/auth/AuthGuard';
import { useAuth } from '@/features/auth/AuthProvider';

export default function TenantPage() {
    return (
        <AuthGuard>
            <TenantContent />
        </AuthGuard>
    );
}

function TenantContent() {
    const { appUser } = useAuth();

    return (
        <main>
            <h1>テナント情報</h1>
            <p>Phase 2 で本格実装する画面です。</p>

            {appUser && (
                <dl>
                    <dt>ユーザー名</dt>
                    <dd>{appUser.displayName}</dd>

                    <dt>ユーザー種別</dt>
                    <dd>{appUser.role}</dd>

                    <dt>テナントID</dt>
                    <dd>{appUser.tenantId}</dd>
                </dl>
            )}
        </main>
    );
}
