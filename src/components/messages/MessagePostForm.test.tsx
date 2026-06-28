import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { MessagePostForm } from '@/components/messages/MessagePostForm';
import { memberUser } from '@/test/factories';
import { VALIDATION_LIMITS } from '@/utils/validation';

describe('MessagePostForm', () => {
  it('メッセージが空の場合はバリデーションエラーを表示する', async () => {
    const user = userEvent.setup();

    render(
      <MessagePostForm
        appUser={memberUser}
        channelId="channel-1"
        onCreateMessage={vi.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: '投稿' }));

    expect(
      screen.getByText('メッセージ本文を入力してください。')
    ).toBeInTheDocument();
  });

  it('前後の空白を除去したメッセージをログインユーザーとともに送信する', async () => {
    const user = userEvent.setup();
    const onCreateMessage = vi.fn().mockResolvedValue(undefined);

    render(
      <MessagePostForm
        appUser={memberUser}
        channelId="channel-1"
        onCreateMessage={onCreateMessage}
      />
    );

    await user.type(
      screen.getByLabelText('メッセージ本文'),
      '  共有します。  '
    );
    await user.click(screen.getByRole('button', { name: '投稿' }));

    expect(onCreateMessage).toHaveBeenCalledWith({
      tenantId: memberUser.tenantId,
      channelId: 'channel-1',
      body: '共有します。',
      senderId: memberUser.id,
      senderName: memberUser.displayName,
    });
    expect(screen.getByLabelText('メッセージ本文')).toHaveValue('');
  });

  it('メッセージ本文が上限を超える場合はバリデーションエラーを表示する', async () => {
    const user = userEvent.setup();
    const onCreateMessage = vi.fn();

    render(
      <MessagePostForm
        appUser={memberUser}
        channelId="channel-1"
        onCreateMessage={onCreateMessage}
      />
    );

    await user.type(
      screen.getByLabelText('メッセージ本文'),
      'a'.repeat(VALIDATION_LIMITS.messageBodyMax + 1)
    );
    await user.click(screen.getByRole('button', { name: '投稿' }));

    expect(
      screen.getByText(
        `メッセージ本文は${VALIDATION_LIMITS.messageBodyMax}文字以内で入力してください。`
      )
    ).toBeInTheDocument();
    expect(onCreateMessage).not.toHaveBeenCalled();
  });
});
