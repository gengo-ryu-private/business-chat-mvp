import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { LoginForm } from '@/components/auth/LoginForm';

describe('LoginForm', () => {
  it('メールアドレスが空の場合はバリデーションエラーを表示する', async () => {
    const user = userEvent.setup();

    render(<LoginForm onLogin={vi.fn()} onSuccess={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'ログイン' }));

    expect(
      screen.getByText('メールアドレスを入力してください。')
    ).toBeInTheDocument();
  });
});
