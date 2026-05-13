import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { MessageList } from '@/components/messages/MessageList';
import { message } from '@/test/factories';

describe('MessageList', () => {
    it('shows sender name, date, and body', () => {
        render(
            <MessageList
                messages={[message]}
                loading={false}
                errorMessage=""
            />,
        );

        expect(screen.getByText('テストメッセージです。')).toBeInTheDocument();
        expect(screen.getByText(/一般ユーザー/)).toBeInTheDocument();
        expect(screen.getByText(/2026/)).toBeInTheDocument();
    });

    it('shows an empty state when there are no messages', () => {
        render(
            <MessageList
                messages={[]}
                loading={false}
                errorMessage=""
            />,
        );

        expect(
            screen.getByText('まだメッセージがありません。'),
        ).toBeInTheDocument();
    });
});
