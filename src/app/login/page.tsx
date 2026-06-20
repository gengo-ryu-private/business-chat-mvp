'use client';

import { useRouter } from 'next/navigation';

import { LoginForm } from '@/components/auth/LoginForm';
import { GuestGuard } from '@/features/auth/GuestGuard';
import { loginWithEmail } from '@/lib/auth/auth';

export default function LoginPage() {
  const router = useRouter();

  return (
    <GuestGuard>
      <LoginForm
        onLogin={loginWithEmail}
        onSuccess={() => router.push('/channels')}
      />
    </GuestGuard>
  );
}
