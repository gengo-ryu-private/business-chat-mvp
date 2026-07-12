import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { SignUpForm } from '@/components/auth/SignUpForm';
import { VALIDATION_LIMITS } from '@/utils/validation';

function renderSignUpForm(input?: {
  onCreateTenant?: ReturnType<typeof vi.fn>;
  onJoinTenant?: ReturnType<typeof vi.fn>;
  onSuccess?: ReturnType<typeof vi.fn>;
  tenantSignupDisabled?: boolean;
}) {
  const onCreateTenant = input?.onCreateTenant ?? vi.fn();
  const onJoinTenant = input?.onJoinTenant ?? vi.fn();
  const onSuccess = input?.onSuccess ?? vi.fn();

  return render(
    <SignUpForm
      onCreateTenant={onCreateTenant}
      onJoinTenant={onJoinTenant}
      onSuccess={onSuccess}
      tenantSignupDisabled={input?.tenantSignupDisabled}
    />
  );
}

describe('SignUpForm', () => {
  it('登録方法に応じてテナント固有の入力欄を切り替える', async () => {
    const user = userEvent.setup();
    renderSignUpForm();

    expect(screen.getByLabelText('テナント名')).toBeInTheDocument();
    expect(screen.queryByLabelText('参加コード')).not.toBeInTheDocument();

    await user.click(screen.getByLabelText('既存テナントに参加する'));

    expect(screen.getByLabelText('参加コード')).toBeInTheDocument();
    expect(screen.queryByLabelText('テナント名')).not.toBeInTheDocument();
  });

  it('新規テナント作成が無効な場合は作成導線を非表示にする', () => {
    renderSignUpForm({ tenantSignupDisabled: true });

    expect(
      screen.queryByLabelText('新しいテナントを作成する')
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText('テナント名')).not.toBeInTheDocument();
    expect(screen.getByLabelText('参加コード')).toBeInTheDocument();
    expect(
      screen.getByText('参加コードで既存テナントに参加します。')
    ).toBeInTheDocument();
  });

  it('ユーザー名が空の場合はバリデーションエラーを表示する', async () => {
    const user = userEvent.setup();
    renderSignUpForm();

    await user.click(screen.getByRole('button', { name: '登録' }));

    expect(
      screen.getByText('ユーザー名を入力してください。')
    ).toBeInTheDocument();
  });

  it('パスワード要件を表示する', () => {
    renderSignUpForm();

    expect(
      screen.getByText(
        `${VALIDATION_LIMITS.passwordMin}〜${VALIDATION_LIMITS.passwordMax}文字で、メールアドレスとは異なるものを入力してください。`
      )
    ).toBeInTheDocument();
  });

  it.each([
    [
      '短すぎる場合',
      'short',
      `パスワードは${VALIDATION_LIMITS.passwordMin}文字以上で入力してください。`,
    ],
    [
      '長すぎる場合',
      'a'.repeat(VALIDATION_LIMITS.passwordMax + 1),
      `パスワードは${VALIDATION_LIMITS.passwordMax}文字以内で入力してください。`,
    ],
    [
      'メールアドレスと同一の場合',
      'yamada@example.com',
      'パスワードはメールアドレスと異なるものを入力してください。',
    ],
  ])('パスワードが%sはエラーを表示する', async (_, password, message) => {
    const user = userEvent.setup();
    const onCreateTenant = vi.fn();
    renderSignUpForm({ onCreateTenant });

    await user.type(screen.getByLabelText('ユーザー名'), '山田太郎');
    await user.type(
      screen.getByLabelText('メールアドレス'),
      'yamada@example.com'
    );
    await user.type(screen.getByLabelText('パスワード'), password);
    await user.type(screen.getByLabelText('テナント名'), '開発チーム');
    await user.click(screen.getByRole('button', { name: '登録' }));

    expect(screen.getByText(message)).toBeInTheDocument();
    expect(onCreateTenant).not.toHaveBeenCalled();
  });

  it('ユーザー名が上限を超える場合はバリデーションエラーを表示する', async () => {
    const user = userEvent.setup();
    const onCreateTenant = vi.fn();
    renderSignUpForm({ onCreateTenant });

    await user.type(
      screen.getByLabelText('ユーザー名'),
      'a'.repeat(VALIDATION_LIMITS.displayNameMax + 1)
    );
    await user.click(screen.getByRole('button', { name: '登録' }));

    expect(
      screen.getByText(
        `ユーザー名は${VALIDATION_LIMITS.displayNameMax}文字以内で入力してください。`
      )
    ).toBeInTheDocument();
    expect(onCreateTenant).not.toHaveBeenCalled();
  });

  it('参加コードに不正な文字が含まれる場合はバリデーションエラーを表示する', async () => {
    const user = userEvent.setup();
    const onJoinTenant = vi.fn();
    renderSignUpForm({ onJoinTenant });

    await user.click(screen.getByLabelText('既存テナントに参加する'));
    await user.type(screen.getByLabelText('ユーザー名'), '佐藤花子');
    await user.type(
      screen.getByLabelText('メールアドレス'),
      'sato@example.com'
    );
    await user.type(screen.getByLabelText('パスワード'), 'password123');
    await user.type(screen.getByLabelText('参加コード'), '0OI2345678');
    await user.click(screen.getByRole('button', { name: '登録' }));

    expect(
      screen.getByText('参加コードは10文字の英数字大文字で入力してください。')
    ).toBeInTheDocument();
    expect(onJoinTenant).not.toHaveBeenCalled();
  });
});
