'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';

import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout';
import { AuthGuard } from '@/features/auth/AuthGuard';
import { useAuth } from '@/features/auth/AuthProvider';
import type { Channel } from '@/types/models';
import { formatDateTime } from '@/utils/date';
import { canCreateChannel } from '@/utils/permissions';
import { isRequired } from '@/utils/validation';
import {
    createChannelWithAutoId,
    getChannels,
} from '@/lib/firestore/channels';

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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

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
    const [channelName, setChannelName] = useState('');
    const [channelDescription, setChannelDescription] = useState('');
    const [creating, setCreating] = useState(false);
    const [createErrorMessage, setCreateErrorMessage] = useState('');

    async function handleCreateChannel(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setCreateErrorMessage('');

        if (!appUser) {
            setCreateErrorMessage('ログインユーザー情報を取得できません。');
            return;
        }

        if (!canCreateChannel(appUser)) {
            setCreateErrorMessage('チャンネルを作成する権限がありません。');
            return;
        }

        if (!isRequired(channelName)) {
            setCreateErrorMessage('チャンネル名を入力してください。');
            return;
        }

        const duplicatedChannel = channels.find(
            (channel) => channel.name === channelName.trim(),
        );

        if (duplicatedChannel) {
            setCreateErrorMessage('同じ名前のチャンネルがすでに存在します。');
            return;
        }

        try {
            setCreating(true);

            await createChannelWithAutoId({
                tenantId: appUser.tenantId,
                name: channelName.trim(),
                description: channelDescription.trim() || undefined,
                createdBy: appUser.id,
            });

            setChannelName('');
            setChannelDescription('');
            await fetchChannels();
        } catch {
            setCreateErrorMessage('チャンネル作成に失敗しました。');
        } finally {
            setCreating(false);
        }
    }

    const fetchChannels = useCallback(async () => {
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
        fetchChannels();
    }, [fetchChannels]);

    return (
        <main className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-normal">チャンネル一覧</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    所属テナント内のチャンネルを確認できます。
                </p>
            </div>

            {appUser && canCreateChannel(appUser) && (
                <Card>
                    <CardHeader>
                        <CardTitle>チャンネル作成</CardTitle>
                        <CardDescription>
                            話題ごとの情報共有場所を作成します。
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={handleCreateChannel} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="channelName">チャンネル名</Label>
                                <Input
                                    id="channelName"
                                    type="text"
                                    value={channelName}
                                    onChange={(event) =>
                                        setChannelName(event.target.value)
                                    }
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="channelDescription">
                                    チャンネル説明
                                </Label>
                                <Textarea
                                    id="channelDescription"
                                    value={channelDescription}
                                    onChange={(event) =>
                                        setChannelDescription(event.target.value)
                                    }
                                />
                            </div>

                            {createErrorMessage && (
                                <Alert variant="destructive">
                                    <AlertDescription>
                                        {createErrorMessage}
                                    </AlertDescription>
                                </Alert>
                            )}

                            <Button type="submit" disabled={creating}>
                                {creating ? '作成中...' : 'チャンネルを作成'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            )}

            {loading && (
                <p className="text-sm text-muted-foreground">
                    チャンネル一覧を読み込み中...
                </p>
            )}

            {errorMessage && (
                <Alert variant="destructive">
                    <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
            )}

            {!loading && !errorMessage && channels.length === 0 && (
                <Card>
                    <CardContent className="py-8">
                        <p className="text-sm text-muted-foreground">
                            まだチャンネルがありません。
                        </p>
                    </CardContent>
                </Card>
            )}

            {!loading && channels.length > 0 && (
                <div className="grid gap-4 md:grid-cols-2">
                    {channels.map((channel) => (
                        <Link key={channel.id} href={`/channels/${channel.id}`}>
                            <Card className="h-full transition-colors hover:bg-muted/50">
                                <CardHeader>
                                    <div className="flex items-start justify-between gap-3">
                                        <CardTitle>{channel.name}</CardTitle>
                                        <Badge variant="secondary">channel</Badge>
                                    </div>

                                    {channel.description && (
                                        <CardDescription>
                                            {channel.description}
                                        </CardDescription>
                                    )}
                                </CardHeader>

                                <CardContent>
                                    <p className="text-sm text-muted-foreground">
                                        作成日時: {formatDateTime(channel.createdAt)}
                                    </p>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </main>
    );
}
