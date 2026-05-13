import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import type { Channel } from '@/types/models';

type ChannelSummaryProps = {
    channel: Channel;
};

export function ChannelSummary({ channel }: ChannelSummaryProps) {
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
