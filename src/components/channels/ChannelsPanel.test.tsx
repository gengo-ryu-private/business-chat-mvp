import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ChannelsPanel } from '@/components/channels/ChannelsPanel';
import { adminUser, channel, memberUser } from '@/test/factories';

function renderChannelsPanel(appUser = adminUser) {
    return render(
        <ChannelsPanel
            appUser={appUser}
            channels={[channel]}
            loading={false}
            errorMessage=""
            onCreateChannel={vi.fn()}
            onChannelsChanged={vi.fn()}
        />,
    );
}

describe('ChannelsPanel', () => {
    it('shows channel create form for admin users', () => {
        renderChannelsPanel(adminUser);

        expect(screen.getByText('チャンネル作成')).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: 'チャンネルを作成' }),
        ).toBeInTheDocument();
    });

    it('hides channel create form for member users', () => {
        renderChannelsPanel(memberUser);

        expect(screen.queryByText('チャンネル作成')).not.toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: 'チャンネルを作成' }),
        ).not.toBeInTheDocument();
    });
});
