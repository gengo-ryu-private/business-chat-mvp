import { isRequired, isValidEmail } from '@/utils/validation';

export type CreateTenantSignupInput = {
    displayName: string;
    email: string;
    password: string;
    tenantName: string;
};

export type JoinTenantSignupInput = {
    displayName: string;
    email: string;
    password: string;
    joinCode: string;
};

export type BuildTenantDataInput = {
    tenantId: string;
    tenantName: string;
    joinCode: string;
    createdBy: string;
    timestamp: unknown;
};

export type BuildSignupUserDataInput = {
    userId: string;
    displayName: string;
    email: string;
    tenantId: string;
    timestamp: unknown;
};

export class SignupApiError extends Error {
    status: number;

    constructor(message: string, status = 400) {
        super(message);
        this.name = 'SignupApiError';
        this.status = status;
    }
}

export function validateCreateTenantSignupInput(
    input: CreateTenantSignupInput,
) {
    validateBaseInput(input);

    if (!isNonEmptyString(input.tenantName)) {
        throw new SignupApiError('テナント名を入力してください。');
    }
}

export function validateJoinTenantSignupInput(input: JoinTenantSignupInput) {
    validateBaseInput(input);

    if (!isNonEmptyString(input.joinCode)) {
        throw new SignupApiError('参加コードを入力してください。');
    }
}

export function buildSignupTenantData(input: BuildTenantDataInput) {
    return {
        id: input.tenantId,
        name: input.tenantName.trim(),
        joinCode: input.joinCode,
        createdBy: input.createdBy,
        createdAt: input.timestamp,
        updatedAt: input.timestamp,
    };
}

export function buildAdminUserData(input: BuildSignupUserDataInput) {
    return buildSignupUserData(input, 'admin');
}

export function buildMemberUserData(input: BuildSignupUserDataInput) {
    return buildSignupUserData(input, 'member');
}

function validateBaseInput(input: {
    displayName: string;
    email: string;
    password: string;
}) {
    if (!isNonEmptyString(input.displayName)) {
        throw new SignupApiError('ユーザー名を入力してください。');
    }

    if (!isNonEmptyString(input.email)) {
        throw new SignupApiError('メールアドレスを入力してください。');
    }

    if (!isValidEmail(input.email)) {
        throw new SignupApiError('メールアドレスの形式が正しくありません。');
    }

    if (!isNonEmptyString(input.password)) {
        throw new SignupApiError('パスワードを入力してください。');
    }
}

function buildSignupUserData(
    input: BuildSignupUserDataInput,
    role: 'admin' | 'member',
) {
    return {
        id: input.userId,
        displayName: input.displayName.trim(),
        email: input.email.trim(),
        tenantId: input.tenantId,
        role,
        createdAt: input.timestamp,
        updatedAt: input.timestamp,
    };
}

function isNonEmptyString(value: unknown): value is string {
    return typeof value === 'string' && isRequired(value);
}
