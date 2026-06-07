import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ChannelsPanel } from '@/components/channels/ChannelsPanel';
import { adminUser, channel, memberUser } from '@/test/factories';
import { VALIDATION_LIMITS } from '@/utils/validation';

function renderChannelsPanel(input?: {
    appUser?: typeof adminUser;
    onCreateChannel?: ReturnType<typeof vi.fn>;
}) {
    const appUser = input?.appUser ?? adminUser;
    const onCreateChannel = input?.onCreateChannel ?? vi.fn();

    return render(
        <ChannelsPanel
            appUser={appUser}
            channels={[channel]}
            loading={false}
            errorMessage=""
            onCreateChannel={onCreateChannel}
            onChannelsChanged={vi.fn()}
        />,
    );
}

describe('ChannelsPanel', () => {
    it('shows channel create form for admin users', () => {
        renderChannelsPanel({ appUser: adminUser });

        expect(screen.getByText('チャンネル作成')).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: 'チャンネルを作成' }),
        ).toBeInTheDocument();
    });

    it('hides channel create form for member users', () => {
        renderChannelsPanel({ appUser: memberUser });

        expect(screen.queryByText('チャンネル作成')).not.toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: 'チャンネルを作成' }),
        ).not.toBeInTheDocument();
    });

    it('shows a validation error when channel name exceeds the max length', async () => {
        const { default: userEvent } = await import('@testing-library/user-event');
        const user = userEvent.setup();
        const onCreateChannel = vi.fn();
        renderChannelsPanel({ onCreateChannel });

        await user.type(
            screen.getByLabelText('チャンネル名'),
            'a'.repeat(VALIDATION_LIMITS.channelNameMax + 1),
        );
        await user.click(screen.getByRole('button', { name: 'チャンネルを作成' }));

        expect(
            screen.getByText(
                `チャンネル名は${VALIDATION_LIMITS.channelNameMax}文字以内で入力してください。`,
            ),
        ).toBeInTheDocument();
        expect(onCreateChannel).not.toHaveBeenCalled();
    });

    it('shows a validation error when channel description exceeds the max length', async () => {
        const { default: userEvent } = await import('@testing-library/user-event');
        const user = userEvent.setup();
        const onCreateChannel = vi.fn();
        renderChannelsPanel({ onCreateChannel });

        await user.type(screen.getByLabelText('チャンネル名'), 'random');
        await user.type(
            screen.getByLabelText('チャンネル説明'),
            'a'.repeat(VALIDATION_LIMITS.channelDescriptionMax + 1),
        );
        await user.click(screen.getByRole('button', { name: 'チャンネルを作成' }));

        expect(
            screen.getByText(
                `チャンネル説明は${VALIDATION_LIMITS.channelDescriptionMax}文字以内で入力してください。`,
            ),
        ).toBeInTheDocument();
        expect(onCreateChannel).not.toHaveBeenCalled();
    });
});
