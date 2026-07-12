import type {
  CreateTenantSignupInput,
  JoinTenantSignupInput,
} from '@/lib/signup-schema';

export type { CreateTenantSignupInput, JoinTenantSignupInput };

export type BuildTenantDataInput = {
  tenantId: string;
  tenantName: string;
  createdBy: string;
  timestamp: unknown;
};

export type BuildTenantSecretDataInput = {
  tenantId: string;
  joinCode: string;
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

export function buildSignupTenantData(input: BuildTenantDataInput) {
  return {
    id: input.tenantId,
    name: input.tenantName.trim(),
    createdBy: input.createdBy,
    createdAt: input.timestamp,
    updatedAt: input.timestamp,
  };
}

export function buildSignupTenantSecretData(input: BuildTenantSecretDataInput) {
  return {
    tenantId: input.tenantId,
    joinCode: input.joinCode,
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

function buildSignupUserData(
  input: BuildSignupUserDataInput,
  role: 'admin' | 'member'
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
