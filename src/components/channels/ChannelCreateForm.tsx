'use client';

import { FormEvent, useState } from 'react';

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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { AppUser, Channel, CreateChannelInput } from '@/types/models';
import { canCreateChannel } from '@/utils/permissions';
import { isRequired } from '@/utils/validation';

type ChannelCreateFormProps = {
    appUser: AppUser;
    channels: Channel[];
    onCreateChannel: (input: Omit<CreateChannelInput, 'id'>) => Promise<unknown>;
    onCreated: () => Promise<void>;
};

export function ChannelCreateForm({
    appUser,
    channels,
    onCreateChannel,
    onCreated,
}: ChannelCreateFormProps) {
    const [channelName, setChannelName] = useState('');
    const [channelDescription, setChannelDescription] = useState('');
    const [creating, setCreating] = useState(false);
    const [createErrorMessage, setCreateErrorMessage] = useState('');

    async function handleCreateChannel(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setCreateErrorMessage('');

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

            await onCreateChannel({
                tenantId: appUser.tenantId,
                name: channelName.trim(),
                description: channelDescription.trim() || undefined,
                createdBy: appUser.id,
            });

            setChannelName('');
            setChannelDescription('');
            await onCreated();
        } catch {
            setCreateErrorMessage('チャンネル作成に失敗しました。');
        } finally {
            setCreating(false);
        }
    }

    return (
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
    );
}
