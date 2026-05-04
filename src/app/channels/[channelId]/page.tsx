'use client';

import { use } from 'react';

import { AuthGuard } from '@/features/auth/AuthGuard';

type ChannelDetailPageProps = {
    params: Promise<{
        channelId: string;
    }>;
};

export default function ChannelDetailPage({ params }: ChannelDetailPageProps) {
    const { channelId } = use(params);

    return (
        <AuthGuard>
            <main>
                <h1>チャンネル詳細</h1>
                <p>Phase 2 で本格実装する画面です。</p>
                <p>チャンネルID: {channelId}</p>
            </main>
        </AuthGuard>
    );
}
