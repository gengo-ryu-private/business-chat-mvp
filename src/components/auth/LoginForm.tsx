'use client';

import Link from 'next/link';
import { SubmitEvent, useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { isRequired, isValidEmail } from '@/utils/validation';

type LoginFormProps = {
  onLogin: (email: string, password: string) => Promise<unknown>;
  onSuccess: () => void;
};

export function LoginForm({ onLogin, onSuccess }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage('');
    const trimmedEmail = email.trim();

    if (!isRequired(trimmedEmail)) {
      setErrorMessage('メールアドレスを入力してください。');
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setErrorMessage('メールアドレスの形式が正しくありません。');
      return;
    }

    if (!isRequired(password)) {
      setErrorMessage('パスワードを入力してください。');
      return;
    }

    try {
      setSubmitting(true);
      await onLogin(trimmedEmail, password);
      onSuccess();
    } catch {
      setErrorMessage(
        'ログインに失敗しました。メールアドレスとパスワードを確認してください。'
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>ログイン</CardTitle>
          <CardDescription>
            登録済みのメールアドレスとパスワードでログインします。
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">パスワード</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
              />
            </div>

            {errorMessage && (
              <Alert variant="destructive">
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? 'ログイン中...' : 'ログイン'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            アカウントをお持ちでない方は{' '}
            <Link
              href="/signup"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              新規登録
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
