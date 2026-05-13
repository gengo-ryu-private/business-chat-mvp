'use client';

import { use, useEffect, useState } from 'react';

import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout';
import { ChannelSummary } from '@/components/messages/ChannelSummary';
import { MessageList } from '@/components/messages/MessageList';
import { MessagePostForm } from '@/components/messages/MessagePostForm';
import { AuthGuard } from '@/features/auth/AuthGuard';
import { useAuth } from '@/features/auth/AuthProvider';
import { getChannel } from '@/lib/firestore/channels';
import {
    createMessageWithAutoId,
    subscribeMessages,
} from '@/lib/firestore/messages';
import type { Channel, Message } from '@/types/models';

import {
    Alert,
    AlertDescription,
} from '@/components/ui/alert';

type ChannelDetailPageProps = {
    params: Promise<{
        channelId: string;
    }>;
};
type ChannelDetailContentProps = {
    channelId: string;
};

type ChannelDetailState = {
    channel: Channel | null;
    messages: Message[];
    loadingChannel: boolean;
    loadingMessages: boolean;
    channelErrorMessage: string;
    messageErrorMessage: string;
};

function useChannelDetail(channelId: string): ChannelDetailState {
    const { appUser } = useAuth();

    const [channel, setChannel] = useState<Channel | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loadingChannel, setLoadingChannel] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(true);
    const [channelErrorMessage, setChannelErrorMessage] = useState('');
    const [messageErrorMessage, setMessageErrorMessage] = useState('');

    useEffect(() => {
        let unsubscribeMessages: (() => void) | undefined;
        let cancelled = false;

        async function fetchChannelDetail() {
            if (!appUser) {
                setChannel(null);
                setMessages([]);
                setLoadingChannel(false);
                setLoadingMessages(false);
                return;
            }

            try {
                setLoadingChannel(true);
                setLoadingMessages(true);
                setChannelErrorMessage('');
                setMessageErrorMessage('');

                const fetchedChannel = await getChannel(
                    appUser.tenantId,
                    channelId,
                );

                if (cancelled) {
                    return;
                }

                if (!fetchedChannel) {
                    setChannelErrorMessage('チャンネルが見つかりません。');
                    setChannel(null);
                    setMessages([]);
                    setLoadingChannel(false);
                    setLoadingMessages(false);
                    return;
                }

                setChannel(fetchedChannel);
                setLoadingChannel(false);

                unsubscribeMessages = subscribeMessages(
                    appUser.tenantId,
                    channelId,
                    (fetchedMessages) => {
                        if (cancelled) {
                            return;
                        }

                        setMessages(fetchedMessages);
                        setLoadingMessages(false);
                    },
                    () => {
                        if (cancelled) {
                            return;
                        }

                        setMessages([]);
                        setMessageErrorMessage(
                            'メッセージ一覧の取得に失敗しました。',
                        );
                        setLoadingMessages(false);
                    },
                );
            } catch {
                if (cancelled) {
                    return;
                }

                setChannelErrorMessage('チャンネル情報の取得に失敗しました。');
                setMessageErrorMessage('メッセージ一覧の取得に失敗しました。');
                setLoadingChannel(false);
                setLoadingMessages(false);
            }
        }

        fetchChannelDetail();

        return () => {
            cancelled = true;
            unsubscribeMessages?.();
        };
    }, [appUser, channelId]);

    return {
        channel,
        messages,
        loadingChannel,
        loadingMessages,
        channelErrorMessage,
        messageErrorMessage,
    };
}

function ChannelDetailContent({ channelId }: ChannelDetailContentProps) {
    const { appUser } = useAuth();
    const {
        channel,
        messages,
        loadingChannel,
        loadingMessages,
        channelErrorMessage,
        messageErrorMessage,
    } = useChannelDetail(channelId);

    return (
        <main className="space-y-6">
            {loadingChannel && (
                <p className="text-sm text-muted-foreground">
                    チャンネル情報を読み込み中...
                </p>
            )}

            {channelErrorMessage && (
                <Alert variant="destructive">
                    <AlertDescription>{channelErrorMessage}</AlertDescription>
                </Alert>
            )}

            {!loadingChannel && channel && (
                <>
                    <ChannelSummary channel={channel} />
                    <MessageList
                        messages={messages}
                        loading={loadingMessages}
                        errorMessage={messageErrorMessage}
                    />
                    <MessagePostForm
                        appUser={appUser}
                        channelId={channelId}
                        onCreateMessage={createMessageWithAutoId}
                    />
                </>
            )}
        </main>
    );
}

export default function ChannelDetailPage({ params }: ChannelDetailPageProps) {
    const { channelId } = use(params);

    return (
        <AuthGuard>
            <AuthenticatedLayout>
                <ChannelDetailContent channelId={channelId} />
            </AuthenticatedLayout>
        </AuthGuard>
    );
}
