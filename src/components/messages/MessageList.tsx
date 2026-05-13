import {
    Alert,
    AlertDescription,
} from '@/components/ui/alert';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import type { Message } from '@/types/models';
import { formatDateTime } from '@/utils/date';

type MessageListProps = {
    messages: Message[];
    loading: boolean;
    errorMessage: string;
};

export function MessageList({
    messages,
    loading,
    errorMessage,
}: MessageListProps) {
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
