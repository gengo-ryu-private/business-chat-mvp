'use client';

import { useRouter } from 'next/navigation';

import { SignUpForm } from '@/components/auth/SignUpForm';
import { GuestGuard } from '@/features/auth/GuestGuard';
import { useAuth } from '@/features/auth/AuthProvider';
import {
    signUpWithJoinCode,
    signUpWithNewTenant,
} from '@/lib/auth/signup-flow';

export default function SignUpPage() {
    const router = useRouter();
    const { refreshAppUser } = useAuth();

    async function handleSignUpSuccess(userId: string) {
        await refreshAppUser(userId);
        router.push('/channels');
    }

    return (
        <GuestGuard>
            <SignUpForm
                onCreateTenant={signUpWithNewTenant}
                onJoinTenant={signUpWithJoinCode}
                onSuccess={handleSignUpSuccess}
            />
        </GuestGuard>
    );
}
