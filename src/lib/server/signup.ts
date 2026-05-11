import 'server-only';

import { FieldValue } from 'firebase-admin/firestore';

import { adminAuth, adminDb } from '@/lib/firebase/admin';
import {
    buildAdminUserData,
    buildMemberUserData,
    buildSignupTenantData,
    SignupApiError,
    validateCreateTenantSignupInput,
    validateJoinTenantSignupInput,
    type CreateTenantSignupInput,
    type JoinTenantSignupInput,
} from '@/lib/server/signup-data';
import { generateJoinCode } from '@/utils/join-code';

export { SignupApiError };
export type { CreateTenantSignupInput, JoinTenantSignupInput };

export async function createTenantSignup(
    input: CreateTenantSignupInput,
): Promise<void> {
    validateCreateTenantSignupInput(input);

    const authUser = await createAuthUser(input);
    const tenantRef = adminDb.collection('tenants').doc();
    let tenantCreated = false;

    try {
        const timestamp = FieldValue.serverTimestamp();

        await tenantRef.set(
            buildSignupTenantData({
                tenantId: tenantRef.id,
                tenantName: input.tenantName,
                joinCode: await generateUniqueJoinCode(),
                createdBy: authUser.uid,
                timestamp,
            }),
        );
        tenantCreated = true;

        await adminDb.collection('users').doc(authUser.uid).set(
            buildAdminUserData({
                userId: authUser.uid,
                displayName: input.displayName,
                email: input.email,
                tenantId: tenantRef.id,
                timestamp,
            }),
        );
    } catch (error) {
        await cleanupFailedCreateTenantSignup({
            uid: authUser.uid,
            tenantId: tenantCreated ? tenantRef.id : undefined,
        });
        throw toSignupApiError(error);
    }
}

export async function joinTenantSignup(
    input: JoinTenantSignupInput,
): Promise<void> {
    validateJoinTenantSignupInput(input);

    const tenant = await findTenantByJoinCode(input.joinCode.trim());

    if (!tenant) {
        throw new SignupApiError(
            '参加コードに一致するテナントが見つかりません。',
            404,
        );
    }

    const authUser = await createAuthUser(input);

    try {
        await adminDb.collection('users').doc(authUser.uid).set(
            buildMemberUserData({
                userId: authUser.uid,
                displayName: input.displayName,
                email: input.email,
                tenantId: tenant.id,
                timestamp: FieldValue.serverTimestamp(),
            }),
        );
    } catch (error) {
        await cleanupAuthUser(authUser.uid);
        throw toSignupApiError(error);
    }
}

async function createAuthUser(input: {
    displayName: string;
    email: string;
    password: string;
}) {
    try {
        return await adminAuth.createUser({
            displayName: input.displayName.trim(),
            email: input.email.trim(),
            password: input.password,
        });
    } catch (error) {
        throw toSignupApiError(error);
    }
}

async function generateUniqueJoinCode(): Promise<string> {
    for (let attempt = 0; attempt < 10; attempt += 1) {
        const joinCode = generateJoinCode();
        const existingTenant = await findTenantByJoinCode(joinCode);

        if (!existingTenant) {
            return joinCode;
        }
    }

    throw new SignupApiError('参加コードの生成に失敗しました。', 500);
}

async function findTenantByJoinCode(
    joinCode: string,
): Promise<{ id: string } | null> {
    const snapshot = await adminDb
        .collection('tenants')
        .where('joinCode', '==', joinCode)
        .limit(1)
        .get();

    if (snapshot.empty) {
        return null;
    }

    return { id: snapshot.docs[0].id };
}

async function cleanupFailedCreateTenantSignup(input: {
    uid: string;
    tenantId?: string;
}) {
    const cleanupTasks: Promise<unknown>[] = [cleanupAuthUser(input.uid)];

    if (input.tenantId) {
        cleanupTasks.push(
            adminDb.collection('tenants').doc(input.tenantId).delete(),
        );
    }

    await Promise.allSettled(cleanupTasks);
}

async function cleanupAuthUser(uid: string) {
    await adminAuth.deleteUser(uid).catch(() => undefined);
}

function toSignupApiError(error: unknown): SignupApiError {
    if (error instanceof SignupApiError) {
        return error;
    }

    if (isFirebaseAuthError(error, 'auth/email-already-exists')) {
        return new SignupApiError(
            'このメールアドレスはすでに登録されています。',
            409,
        );
    }

    if (isFirebaseAuthError(error, 'auth/invalid-password')) {
        return new SignupApiError('パスワードの形式が正しくありません。');
    }

    return new SignupApiError('ユーザー登録に失敗しました。', 500);
}

function isFirebaseAuthError(error: unknown, code: string): boolean {
    return (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === code
    );
}
