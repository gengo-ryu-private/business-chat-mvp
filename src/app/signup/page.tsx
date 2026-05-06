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

import {
    Alert,
    AlertDescription,
} from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
        <main className="flex min-h-screen items-center justify-center bg-background px-6 py-10">
            <Card className="w-full max-w-xl">
                <CardHeader>
                    <CardTitle>新規登録</CardTitle>
                    <CardDescription>
                        新しいテナントを作成するか、参加コードで既存テナントに参加します。
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <fieldset className="space-y-3 rounded-lg border p-4">
                            <legend className="px-1 text-sm font-medium">登録方法</legend>

                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="radio"
                                    name="signupMode"
                                    value="newTenant"
                                    checked={mode === 'newTenant'}
                                    onChange={() => setMode('newTenant')}
                                />
                                新しいテナントを作成する
                            </label>

                            <label className="flex items-center gap-2 text-sm">
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

                        <div className="space-y-2">
                            <Label htmlFor="displayName">ユーザー名</Label>
                            <Input
                                id="displayName"
                                type="text"
                                value={displayName}
                                onChange={(event) =>
                                    setDisplayName(event.target.value)
                                }
                                autoComplete="name"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">メールアドレス</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(event) =>
                                    setEmail(event.target.value)
                                }
                                autoComplete="email"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">パスワード</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(event) =>
                                    setPassword(event.target.value)
                                }
                                autoComplete="new-password"
                            />
                        </div>

                        {mode === 'newTenant' ? (
                            <div className="space-y-2">
                                <Label htmlFor="tenantName">テナント名</Label>
                                <Input
                                    id="tenantName"
                                    type="text"
                                    value={tenantName}
                                    onChange={(event) =>
                                        setTenantName(event.target.value)
                                    }
                                />
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Label htmlFor="joinCode">参加コード</Label>
                                <Input
                                    id="joinCode"
                                    type="text"
                                    value={joinCode}
                                    onChange={(event) =>
                                        setJoinCode(event.target.value)
                                    }
                                />
                            </div>
                        )}

                        {errorMessage && (
                            <Alert variant="destructive">
                                <AlertDescription>{errorMessage}</AlertDescription>
                            </Alert>
                        )}

                        <Button type="submit" disabled={submitting} className="w-full">
                            {submitting ? '登録中...' : '登録'}
                        </Button>
                    </form>

                    <p className="mt-6 text-center text-sm text-muted-foreground">
                        アカウントをお持ちの方は{' '}
                        <Link
                            href="/login"
                            className="font-medium text-foreground underline-offset-4 hover:underline"
                        >
                            ログイン
                        </Link>
                    </p>
                </CardContent>
            </Card>
        </main>
    );
}
