import { deleteUser } from 'firebase/auth';
import { collection, doc } from 'firebase/firestore';

import { signUpWithEmail } from '@/lib/auth/auth';
import { db } from '@/lib/firebase/client';
import { createTenant, findTenantByJoinCode } from '@/lib/firestore/tenants';
import { createAppUser } from '@/lib/firestore/users';
import { generateJoinCode } from '@/utils/join-code';

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

export async function signUpWithNewTenant(
    input: SignUpWithNewTenantInput,
): Promise<string> {
    const authUser = await signUpWithEmail(input.email, input.password);
    const tenantRef = doc(collection(db, 'tenants'));
    const tenantId = tenantRef.id;

    try {
        await createTenant({
            id: tenantId,
            name: input.tenantName,
            joinCode: generateJoinCode(),
            createdBy: authUser.uid,
        });

        await createAppUser({
            id: authUser.uid,
            displayName: input.displayName,
            email: input.email,
            tenantId,
            role: 'admin',
        });
    } catch (error) {
        await deleteUser(authUser);
        throw error;
    }
    return authUser.uid;
}

export async function signUpWithJoinCode(
    input: SignUpWithJoinCodeInput,
): Promise<string> {
    const tenant = await findTenantByJoinCode(input.joinCode);

    if (!tenant) {
        throw new Error('参加コードに一致するテナントが見つかりません。');
    }

    const authUser = await signUpWithEmail(input.email, input.password);

    try {
        await createAppUser({
            id: authUser.uid,
            displayName: input.displayName,
            email: input.email,
            tenantId: tenant.id,
            role: 'member',
        });
    } catch (error) {
        await deleteUser(authUser);
        throw error;
    }
    return authUser.uid;
}
