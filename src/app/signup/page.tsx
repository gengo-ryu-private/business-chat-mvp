'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { useAuth } from '@/features/auth/AuthProvider';

import { GuestGuard } from '@/features/auth/GuestGuard';
import {
    signUpWithJoinCode,
    signUpWithNewTenant,
} from '@/lib/auth/signup-flow';
import { isRequired, isValidEmail } from '@/utils/validation';

type SignUpMode = 'newTenant' | 'joinTenant';

export default function SignUpPage() {
    return (
        <GuestGuard>
            <SignUpForm />
        </GuestGuard>
    );
}

function SignUpForm() {
    const router = useRouter();

    const [mode, setMode] = useState<SignUpMode>('newTenant');
    const [displayName, setDisplayName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [tenantName, setTenantName] = useState('');
    const [joinCode, setJoinCode] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const { refreshAppUser } = useAuth();

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setErrorMessage('');

        if (!isRequired(displayName)) {
            setErrorMessage('ユーザー名を入力してください。');
            return;
        }

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

        if (mode === 'newTenant' && !isRequired(tenantName)) {
            setErrorMessage('テナント名を入力してください。');
            return;
        }

        if (mode === 'joinTenant' && !isRequired(joinCode)) {
            setErrorMessage('参加コードを入力してください。');
            return;
        }

        try {
            setSubmitting(true);

            let userId: string;

            if (mode === 'newTenant') {
                userId = await signUpWithNewTenant({
                    displayName,
                    email,
                    password,
                    tenantName,
                });
            } else {
                userId = await signUpWithJoinCode({
                    displayName,
                    email,
                    password,
                    joinCode,
                });
            }

            await refreshAppUser(userId);
            router.push('/channels');
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : 'ユーザー登録に失敗しました。入力内容を確認してください。';

            setErrorMessage(message);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <main>
            <h1>新規登録</h1>

            <form onSubmit={handleSubmit}>
                <fieldset>
                    <legend>登録方法</legend>

                    <label>
                        <input
                            type="radio"
                            name="signupMode"
                            value="newTenant"
                            checked={mode === 'newTenant'}
                            onChange={() => setMode('newTenant')}
                        />
                        新しいテナントを作成する
                    </label>

                    <label>
                        <input
                            type="radio"
                            name="signupMode"
                            value="joinTenant"
                            checked={mode === 'joinTenant'}
                            onChange={() => setMode('joinTenant')}
                        />
                        既存テナントに参加する
                    </label>
                </fieldset>

                <div>
                    <label htmlFor="displayName">ユーザー名</label>
                    <input
                        id="displayName"
                        type="text"
                        value={displayName}
                        onChange={(event) => setDisplayName(event.target.value)}
                        autoComplete="name"
                    />
                </div>

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
                        autoComplete="new-password"
                    />
                </div>

                {mode === 'newTenant' ? (
                    <div>
                        <label htmlFor="tenantName">テナント名</label>
                        <input
                            id="tenantName"
                            type="text"
                            value={tenantName}
                            onChange={(event) =>
                                setTenantName(event.target.value)
                            }
                        />
                    </div>
                ) : (
                    <div>
                        <label htmlFor="joinCode">参加コード</label>
                        <input
                            id="joinCode"
                            type="text"
                            value={joinCode}
                            onChange={(event) =>
                                setJoinCode(event.target.value)
                            }
                        />
                    </div>
                )}

                {errorMessage && <p role="alert">{errorMessage}</p>}

                <button type="submit" disabled={submitting}>
                    {submitting ? '登録中...' : '登録'}
                </button>
            </form>

            <p>
                アカウントをお持ちの方は <Link href="/login">ログイン</Link>
            </p>
        </main>
    );
}
