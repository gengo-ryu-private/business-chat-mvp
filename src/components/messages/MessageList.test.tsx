import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { MessageList } from '@/components/messages/MessageList';
import { message } from '@/test/factories';

describe('MessageList', () => {
  it('送信者名、日時、本文を表示する', () => {
    render(
      <MessageList messages={[message]} loading={false} errorMessage="" />
    );

    expect(screen.getByText('テストメッセージです。')).toBeInTheDocument();
    expect(screen.getByText(/一般ユーザー/)).toBeInTheDocument();
    expect(screen.getByText(/2026/)).toBeInTheDocument();
  });

  it('メッセージがない場合は空の状態を表示する', () => {
    render(<MessageList messages={[]} loading={false} errorMessage="" />);

    expect(
      screen.getByText('まだメッセージがありません。')
    ).toBeInTheDocument();
  });
});
