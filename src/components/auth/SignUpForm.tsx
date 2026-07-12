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
import {
  createTenantSignupSchema,
  getSignupValidationMessage,
  joinTenantSignupSchema,
} from '@/lib/signup-schema';
import { VALIDATION_LIMITS } from '@/utils/validation';

type SignUpMode = 'newTenant' | 'joinTenant';

type SignUpBaseInput = {
  displayName: string;
  email: string;
  password: string;
};

type SignUpWithNewTenantInput = SignUpBaseInput & {
  tenantName: string;
};

type SignUpWithJoinCodeInput = SignUpBaseInput & {
  joinCode: string;
};

type SignUpFormProps = {
  onCreateTenant: (input: SignUpWithNewTenantInput) => Promise<string>;
  onJoinTenant: (input: SignUpWithJoinCodeInput) => Promise<string>;
  onSuccess: (userId: string) => Promise<void> | void;
  tenantSignupDisabled?: boolean;
};

export function SignUpForm({
  onCreateTenant,
  onJoinTenant,
  onSuccess,
  tenantSignupDisabled = false,
}: SignUpFormProps) {
  const [mode, setMode] = useState<SignUpMode>(
    tenantSignupDisabled ? 'joinTenant' : 'newTenant'
  );
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage('');
    const trimmedDisplayName = displayName.trim();
    const trimmedEmail = email.trim();
    const trimmedTenantName = tenantName.trim();
    const trimmedJoinCode = joinCode.trim();

    const result =
      mode === 'newTenant'
        ? createTenantSignupSchema.safeParse({
            displayName: trimmedDisplayName,
            email: trimmedEmail,
            password,
            tenantName: trimmedTenantName,
          })
        : joinTenantSignupSchema.safeParse({
            displayName: trimmedDisplayName,
            email: trimmedEmail,
            password,
            joinCode: trimmedJoinCode,
          });

    if (!result.success) {
      setErrorMessage(getSignupValidationMessage(result.error));
      return;
    }

    try {
      setSubmitting(true);

      const userId =
        mode === 'newTenant'
          ? await onCreateTenant({
              displayName: trimmedDisplayName,
              email: trimmedEmail,
              password,
              tenantName: trimmedTenantName,
            })
          : await onJoinTenant({
              displayName: trimmedDisplayName,
              email: trimmedEmail,
              password,
              joinCode: trimmedJoinCode,
            });

      await onSuccess(userId);
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
            {tenantSignupDisabled
              ? '参加コードで既存テナントに参加します。'
              : '新しいテナントを作成するか、参加コードで既存テナントに参加します。'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <fieldset className="space-y-3 rounded-lg border p-4">
              <legend className="px-1 text-sm font-medium">登録方法</legend>

              {!tenantSignupDisabled && (
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
              )}

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
                onChange={(event) => setDisplayName(event.target.value)}
                autoComplete="name"
              />
            </div>

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
                autoComplete="new-password"
                aria-describedby="password-requirements"
              />
              <p
                id="password-requirements"
                className="text-sm text-muted-foreground"
              >
                {VALIDATION_LIMITS.passwordMin}〜{VALIDATION_LIMITS.passwordMax}
                文字で、メールアドレスとは異なるものを入力してください。
              </p>
            </div>

            {mode === 'newTenant' ? (
              <div className="space-y-2">
                <Label htmlFor="tenantName">テナント名</Label>
                <Input
                  id="tenantName"
                  type="text"
                  value={tenantName}
                  onChange={(event) => setTenantName(event.target.value)}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="joinCode">参加コード</Label>
                <Input
                  id="joinCode"
                  type="text"
                  value={joinCode}
                  onChange={(event) => setJoinCode(event.target.value)}
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
