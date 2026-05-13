import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { SignUpForm } from '@/components/auth/SignUpForm';

function renderSignUpForm() {
    return render(
        <SignUpForm
            onCreateTenant={vi.fn()}
            onJoinTenant={vi.fn()}
            onSuccess={vi.fn()}
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
});
