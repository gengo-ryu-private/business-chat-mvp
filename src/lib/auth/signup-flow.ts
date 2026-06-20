import { loginWithEmail } from '@/lib/auth/auth';

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

type SignUpApiResponse = {
  ok: boolean;
  message?: string;
};

export async function signUpWithNewTenant(
  input: SignUpWithNewTenantInput
): Promise<string> {
  await requestSignUp('/api/signup/create-tenant', input);
  const user = await loginWithEmail(input.email, input.password);

  return user.uid;
}

export async function signUpWithJoinCode(
  input: SignUpWithJoinCodeInput
): Promise<string> {
  await requestSignUp('/api/signup/join-tenant', input);
  const user = await loginWithEmail(input.email, input.password);

  return user.uid;
}

async function requestSignUp(endpoint: string, input: object): Promise<void> {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  const data = (await response.json()) as SignUpApiResponse;

  if (!response.ok || !data.ok) {
    throw new Error(data.message ?? 'ユーザー登録に失敗しました。');
  }
}
