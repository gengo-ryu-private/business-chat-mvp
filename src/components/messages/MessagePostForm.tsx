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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { AppUser, CreateMessageInput } from '@/types/models';
import { isBlankMessage } from '@/utils/validation';

type MessagePostFormProps = {
    appUser: AppUser | null;
    channelId: string;
    onCreateMessage: (input: Omit<CreateMessageInput, 'id'>) => Promise<unknown>;
};

export function MessagePostForm({
    appUser,
    channelId,
    onCreateMessage,
}: MessagePostFormProps) {
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

            await onCreateMessage({
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
