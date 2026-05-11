'use client';

import { FormEvent, use, useEffect, useState } from 'react';

import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout';
import { AuthGuard } from '@/features/auth/AuthGuard';
import { useAuth } from '@/features/auth/AuthProvider';
import { getChannel } from '@/lib/firestore/channels';
import type { Channel, Message } from '@/types/models';
import { formatDateTime } from '@/utils/date';
import { isBlankMessage } from '@/utils/validation';
import {
    createMessageWithAutoId,
    subscribeMessages,
} from '@/lib/firestore/messages';

import {
    Alert,
    AlertDescription,
} from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

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
                    <MessagePostForm channelId={channelId} />
                </>
            )}
        </main>
    );
}

type ChannelSummaryProps = {
    channel: Channel;
};

function ChannelSummary({ channel }: ChannelSummaryProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-2xl">{channel.name}</CardTitle>
                {channel.description && (
                    <CardDescription>{channel.description}</CardDescription>
                )}
            </CardHeader>
        </Card>
    );
}

type MessageListProps = {
    messages: Message[];
    loading: boolean;
    errorMessage: string;
};

function MessageList({ messages, loading, errorMessage }: MessageListProps) {
    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>メッセージ</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        メッセージを読み込み中...
                    </p>
                </CardContent>
            </Card>
        );
    }

    if (errorMessage) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>メッセージ</CardTitle>
                </CardHeader>
                <CardContent>
                    <Alert variant="destructive">
                        <AlertDescription>{errorMessage}</AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        );
    }

    if (messages.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>メッセージ</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        まだメッセージがありません。
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>メッセージ</CardTitle>
            </CardHeader>

            <CardContent>
                <ul className="space-y-4">
                    {messages.map((message) => (
                        <li
                            key={message.id}
                            className="rounded-lg border bg-background p-4"
                        >
                            <p className="whitespace-pre-wrap">{message.body}</p>
                            <p className="mt-2 text-xs text-muted-foreground">
                                {message.senderName} /{' '}
                                {formatDateTime(message.createdAt)}
                            </p>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    );
}

type MessagePostFormProps = {
    channelId: string;
};

function MessagePostForm({ channelId }: MessagePostFormProps) {
    const { appUser } = useAuth();

    const [messageBody, setMessageBody] = useState('');
    const [posting, setPosting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setErrorMessage('');

        if (!appUser) {
            setErrorMessage('ログインユーザー情報を取得できません。');
            return;
        }

        if (isBlankMessage(messageBody)) {
            setErrorMessage('メッセージ本文を入力してください。');
            return;
        }

        try {
            setPosting(true);

            await createMessageWithAutoId({
                tenantId: appUser.tenantId,
                channelId,
                body: messageBody.trim(),
                senderId: appUser.id,
                senderName: appUser.displayName,
            });

            setMessageBody('');
        } catch {
            setErrorMessage('メッセージ投稿に失敗しました。');
        } finally {
            setPosting(false);
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>メッセージ投稿</CardTitle>
                <CardDescription>
                    このチャンネルに新しいメッセージを投稿します。
                </CardDescription>
            </CardHeader>

            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="messageBody">メッセージ本文</Label>
                        <Textarea
                            id="messageBody"
                            value={messageBody}
                            onChange={(event) =>
                                setMessageBody(event.target.value)
                            }
                        />
                    </div>

                    {errorMessage && (
                        <Alert variant="destructive">
                            <AlertDescription>{errorMessage}</AlertDescription>
                        </Alert>
                    )}

                    <Button type="submit" disabled={posting}>
                        {posting ? '投稿中...' : '投稿'}
                    </Button>
                </form>
            </CardContent>
        </Card>
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
