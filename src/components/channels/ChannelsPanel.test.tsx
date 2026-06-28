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
    />
  );
}

describe('ChannelsPanel', () => {
  it('管理者ユーザーにチャンネル作成フォームを表示する', () => {
    renderChannelsPanel({ appUser: adminUser });

    expect(screen.getByText('チャンネル作成')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'チャンネルを作成' })
    ).toBeInTheDocument();
  });

  it('一般ユーザーにチャンネル作成フォームを表示しない', () => {
    renderChannelsPanel({ appUser: memberUser });

    expect(screen.queryByText('チャンネル作成')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'チャンネルを作成' })
    ).not.toBeInTheDocument();
  });

  it('チャンネル名が上限を超える場合はバリデーションエラーを表示する', async () => {
    const { default: userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    const onCreateChannel = vi.fn();
    renderChannelsPanel({ onCreateChannel });

    await user.type(
      screen.getByLabelText('チャンネル名'),
      'a'.repeat(VALIDATION_LIMITS.channelNameMax + 1)
    );
    await user.click(screen.getByRole('button', { name: 'チャンネルを作成' }));

    expect(
      screen.getByText(
        `チャンネル名は${VALIDATION_LIMITS.channelNameMax}文字以内で入力してください。`
      )
    ).toBeInTheDocument();
    expect(onCreateChannel).not.toHaveBeenCalled();
  });

  it('チャンネル説明が上限を超える場合はバリデーションエラーを表示する', async () => {
    const { default: userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    const onCreateChannel = vi.fn();
    renderChannelsPanel({ onCreateChannel });

    await user.type(screen.getByLabelText('チャンネル名'), 'random');
    await user.type(
      screen.getByLabelText('チャンネル説明'),
      'a'.repeat(VALIDATION_LIMITS.channelDescriptionMax + 1)
    );
    await user.click(screen.getByRole('button', { name: 'チャンネルを作成' }));

    expect(
      screen.getByText(
        `チャンネル説明は${VALIDATION_LIMITS.channelDescriptionMax}文字以内で入力してください。`
      )
    ).toBeInTheDocument();
    expect(onCreateChannel).not.toHaveBeenCalled();
  });

  it('チャンネル説明が空の場合はdescriptionフィールドを含めずに作成する', async () => {
    const { default: userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    const onCreateChannel = vi.fn().mockResolvedValue(undefined);
    renderChannelsPanel({ onCreateChannel });

    await user.type(screen.getByLabelText('チャンネル名'), 'random');
    await user.click(screen.getByRole('button', { name: 'チャンネルを作成' }));

    expect(onCreateChannel).toHaveBeenCalledOnce();
    expect(onCreateChannel).toHaveBeenCalledWith({
      tenantId: adminUser.tenantId,
      name: 'random',
      createdBy: adminUser.id,
    });
    expect(onCreateChannel.mock.calls[0][0]).not.toHaveProperty('description');
  });
});
