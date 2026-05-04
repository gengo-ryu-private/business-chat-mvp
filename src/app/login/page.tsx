'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

import { GuestGuard } from '@/features/auth/GuestGuard';
import { loginWithEmail } from '@/lib/auth/auth';
import { isRequired, isValidEmail } from '@/utils/validation';

export default function LoginPage() {
    return (
        <GuestGuard>
            <LoginForm />
        </GuestGuard>
    );
}

function LoginForm() {
    const router = useRouter();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setErrorMessage('');

        if (!isRequired(email)) {
            setErrorMessage('メールアドレスを入力してください。');
            return;
        }

        if (!isValidEmail(email)) {
            setErrorMessage('メールアドレスの形式が正しくありません。');
            return;
        }

        if (!isRequired(password)) {
            setErrorMessage('パスワードを入力してください。');
            return;
        }

        try {
            setSubmitting(true);
            await loginWithEmail(email, password);
            router.push('/channels');
        } catch {
            setErrorMessage(
                'ログインに失敗しました。メールアドレスとパスワードを確認してください。',
            );
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <main>
            <h1>ログイン</h1>

            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="email">メールアドレス</label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        autoComplete="email"
                    />
                </div>

                <div>
                    <label htmlFor="password">パスワード</label>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        autoComplete="current-password"
                    />
                </div>

                {errorMessage && <p role="alert">{errorMessage}</p>}

                <button type="submit" disabled={submitting}>
                    {submitting ? 'ログイン中...' : 'ログイン'}
                </button>
            </form>

            <p>
                アカウントをお持ちでない方は{' '}
                <Link href="/signup">新規登録</Link>
            </p>
        </main>
    );
}
