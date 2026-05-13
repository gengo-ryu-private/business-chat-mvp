'use client';

import { useCallback, useEffect, useState } from 'react';

import { ChannelsPanel } from '@/components/channels/ChannelsPanel';
import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout';
import { AuthGuard } from '@/features/auth/AuthGuard';
import { useAuth } from '@/features/auth/AuthProvider';
import type { Channel } from '@/types/models';
import {
    createChannelWithAutoId,
    getChannels,
} from '@/lib/firestore/channels';

export default function ChannelsPage() {
    return (
        <AuthGuard>
            <AuthenticatedLayout>
                <ChannelsContent />
            </AuthenticatedLayout>
        </AuthGuard>
    );
}

function ChannelsContent() {
    const { appUser } = useAuth();

    const [channels, setChannels] = useState<Channel[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');

    const fetchChannels = useCallback(async () => {
        await Promise.resolve();

        if (!appUser) {
            setChannels([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setErrorMessage('');

            const fetchedChannels = await getChannels(appUser.tenantId);
            setChannels(fetchedChannels);
        } catch {
            setErrorMessage('チャンネル一覧の取得に失敗しました。');
        } finally {
            setLoading(false);
        }
    }, [appUser]);

    useEffect(() => {
        void Promise.resolve().then(fetchChannels);
    }, [fetchChannels]);

    return (
        <ChannelsPanel
            appUser={appUser}
            channels={channels}
            loading={loading}
            errorMessage={errorMessage}
            onCreateChannel={createChannelWithAutoId}
            onChannelsChanged={fetchChannels}
        />
    );
}
