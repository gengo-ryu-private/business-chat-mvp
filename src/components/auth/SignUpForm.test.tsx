import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { SignUpForm } from '@/components/auth/SignUpForm';
import { VALIDATION_LIMITS } from '@/utils/validation';

function renderSignUpForm(input?: {
    onCreateTenant?: ReturnType<typeof vi.fn>;
    onJoinTenant?: ReturnType<typeof vi.fn>;
    onSuccess?: ReturnType<typeof vi.fn>;
}) {
    const onCreateTenant = input?.onCreateTenant ?? vi.fn();
    const onJoinTenant = input?.onJoinTenant ?? vi.fn();
    const onSuccess = input?.onSuccess ?? vi.fn();

    return render(
        <SignUpForm
            onCreateTenant={onCreateTenant}
            onJoinTenant={onJoinTenant}
            onSuccess={onSuccess}
        />,
    );
}

describe('SignUpForm', () => {
    it('switches tenant-specific fields by signup mode', async () => {
        const user = userEvent.setup();
        renderSignUpForm();

        expect(screen.getByLabelText('テナント名')).toBeInTheDocument();
        expect(screen.queryByLabelText('参加コード')).not.toBeInTheDocument();

        await user.click(screen.getByLabelText('既存テナントに参加する'));

        expect(screen.getByLabelText('参加コード')).toBeInTheDocument();
        expect(screen.queryByLabelText('テナント名')).not.toBeInTheDocument();
    });

    it('shows a validation error when display name is empty', async () => {
        const user = userEvent.setup();
        renderSignUpForm();

        await user.click(screen.getByRole('button', { name: '登録' }));

        expect(
            screen.getByText('ユーザー名を入力してください。'),
        ).toBeInTheDocument();
    });

    it('shows a validation error when display name exceeds the max length', async () => {
        const user = userEvent.setup();
        const onCreateTenant = vi.fn();
        renderSignUpForm({ onCreateTenant });

        await user.type(
            screen.getByLabelText('ユーザー名'),
            'a'.repeat(VALIDATION_LIMITS.displayNameMax + 1),
        );
        await user.click(screen.getByRole('button', { name: '登録' }));

        expect(
            screen.getByText(
                `ユーザー名は${VALIDATION_LIMITS.displayNameMax}文字以内で入力してください。`,
            ),
        ).toBeInTheDocument();
        expect(onCreateTenant).not.toHaveBeenCalled();
    });

    it('shows a validation error when join code has invalid characters', async () => {
        const user = userEvent.setup();
        const onJoinTenant = vi.fn();
        renderSignUpForm({ onJoinTenant });

        await user.click(screen.getByLabelText('既存テナントに参加する'));
        await user.type(screen.getByLabelText('ユーザー名'), '佐藤花子');
        await user.type(screen.getByLabelText('メールアドレス'), 'sato@example.com');
        await user.type(screen.getByLabelText('パスワード'), 'password123');
        await user.type(screen.getByLabelText('参加コード'), '0OI123');
        await user.click(screen.getByRole('button', { name: '登録' }));

        expect(
            screen.getByText('参加コードは6文字の英数字大文字で入力してください。'),
        ).toBeInTheDocument();
        expect(onJoinTenant).not.toHaveBeenCalled();
    });
});
