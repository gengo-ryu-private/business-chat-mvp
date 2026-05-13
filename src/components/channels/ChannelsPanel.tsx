import {
    Alert,
    AlertDescription,
} from '@/components/ui/alert';
import { ChannelCreateForm } from '@/components/channels/ChannelCreateForm';
import { ChannelList } from '@/components/channels/ChannelList';
import type { AppUser, Channel, CreateChannelInput } from '@/types/models';
import { canCreateChannel } from '@/utils/permissions';

type ChannelsPanelProps = {
    appUser: AppUser | null;
    channels: Channel[];
    loading: boolean;
    errorMessage: string;
    onCreateChannel: (input: Omit<CreateChannelInput, 'id'>) => Promise<unknown>;
    onChannelsChanged: () => Promise<void>;
};

export function ChannelsPanel({
    appUser,
    channels,
    loading,
    errorMessage,
    onCreateChannel,
    onChannelsChanged,
}: ChannelsPanelProps) {
    return (
        <main className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-normal">
                    チャンネル一覧
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    所属テナント内のチャンネルを確認できます。
                </p>
            </div>

            {appUser && canCreateChannel(appUser) && (
                <ChannelCreateForm
                    appUser={appUser}
                    channels={channels}
                    onCreateChannel={onCreateChannel}
                    onCreated={onChannelsChanged}
                />
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

            {!loading && !errorMessage && <ChannelList channels={channels} />}
        </main>
    );
}
