import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import type { Channel } from '@/types/models';
import { formatDateTime } from '@/utils/date';

type ChannelListProps = {
    channels: Channel[];
};

export function ChannelList({ channels }: ChannelListProps) {
    if (channels.length === 0) {
        return (
            <Card>
                <CardContent className="py-8">
                    <p className="text-sm text-muted-foreground">
                        まだチャンネルがありません。
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
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
    );
}
