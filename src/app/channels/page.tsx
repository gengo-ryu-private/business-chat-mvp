'use client';

import { useRouter } from 'next/navigation';

import { AuthGuard } from '@/features/auth/AuthGuard';
import { useAuth } from '@/features/auth/AuthProvider';
import { logout } from '@/lib/auth/auth';

export default function ChannelsPage() {
    return (
        <AuthGuard>
            <ChannelsContent />
        </AuthGuard>
    );
}

function ChannelsContent() {
    const router = useRouter();
    const { appUser } = useAuth();

    async function handleLogout() {
        await logout();
        router.push('/login');
    }

    return (
        <main>
            <h1>チャンネル一覧</h1>

            <p>ログイン済みユーザーのみ表示される画面です。</p>

            {appUser && (
                <section>
                    <h2>ログインユーザー</h2>
                    <dl>
                        <dt>ユーザー名</dt>
                        <dd>{appUser.displayName}</dd>

                        <dt>メールアドレス</dt>
                        <dd>{appUser.email}</dd>

                        <dt>ユーザー種別</dt>
                        <dd>{appUser.role}</dd>

                        <dt>テナントID</dt>
                        <dd>{appUser.tenantId}</dd>
                    </dl>
                </section>
            )}

            <button type="button" onClick={handleLogout}>
                ログアウト
            </button>
        </main>
    );
}
