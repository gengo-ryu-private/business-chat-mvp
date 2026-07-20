import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GoogleAuth } from 'google-auth-library';

import {
  assertExpectedFirebasePrincipal,
  createFirebaseAdminContext,
  DEMO_TENANT_OPERATOR_EMAIL,
} from '../firebase-admin';
import {
  assertSafeProductionTarget,
  assertSupportedNodeVersion,
  parseCommonOptions,
  PRODUCTION_FIREBASE_PROJECT_ID,
  requireTenantId,
} from '../safety';

const ENVIRONMENT_VARIABLES = [
  'FIREBASE_AUTH_EMULATOR_HOST',
  'FIRESTORE_EMULATOR_HOST',
  'GCLOUD_PROJECT',
  'GOOGLE_APPLICATION_CREDENTIALS',
  'GOOGLE_CLOUD_PROJECT',
] as const;

describe('demo tenant CLI safety', () => {
  beforeEach(() => {
    ENVIRONMENT_VARIABLES.forEach((name) => vi.stubEnv(name, ''));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('parses the explicit project and tenant IDs', () => {
    expect(
      parseCommonOptions([
        '--project',
        PRODUCTION_FIREBASE_PROJECT_ID,
        '--tenant-id',
        'abcdefghijklmnopqrst',
      ])
    ).toEqual({
      projectId: PRODUCTION_FIREBASE_PROJECT_ID,
      showHelp: false,
      tenantId: 'abcdefghijklmnopqrst',
    });
  });

  it('requires an explicit project ID', () => {
    expect(() => parseCommonOptions([])).toThrow('--project is required');
  });

  it('accepts only a Firestore auto-generated tenant ID', () => {
    expect(requireTenantId('abcdefghijklmnopqrst')).toBe(
      'abcdefghijklmnopqrst'
    );
    expect(() => requireTenantId('invalid')).toThrow('20-character');
  });

  it('accepts only Node.js 22', () => {
    expect(() => assertSupportedNodeVersion('22.23.1')).not.toThrow();
    expect(() => assertSupportedNodeVersion('23.11.0')).toThrow(
      'Node.js 22 is required'
    );
  });

  it('accepts the production target with keyless ADC settings', () => {
    expect(() =>
      assertSafeProductionTarget(PRODUCTION_FIREBASE_PROJECT_ID)
    ).not.toThrow();
  });

  it('rejects a different project', () => {
    expect(() => assertSafeProductionTarget('business-chat-mvp')).toThrow(
      `only operates on ${PRODUCTION_FIREBASE_PROJECT_ID}`
    );
  });

  it('rejects Firebase emulator variables', () => {
    vi.stubEnv('FIRESTORE_EMULATOR_HOST', '127.0.0.1:8080');

    expect(() =>
      assertSafeProductionTarget(PRODUCTION_FIREBASE_PROJECT_ID)
    ).toThrow('FIRESTORE_EMULATOR_HOST');
  });

  it('rejects a service-account key file', () => {
    vi.stubEnv('GOOGLE_APPLICATION_CREDENTIALS', '/tmp/key.json');

    expect(() =>
      assertSafeProductionTarget(PRODUCTION_FIREBASE_PROJECT_ID)
    ).toThrow('keyless ADC');
  });

  it('rejects a conflicting ambient project', () => {
    vi.stubEnv('GOOGLE_CLOUD_PROJECT', 'business-chat-mvp');

    expect(() =>
      assertSafeProductionTarget(PRODUCTION_FIREBASE_PROJECT_ID)
    ).toThrow('conflicts with --project');
  });

  it('accepts only the dedicated demo tenant operator ADC principal', () => {
    expect(() =>
      assertExpectedFirebasePrincipal(DEMO_TENANT_OPERATOR_EMAIL)
    ).not.toThrow();
    expect(() => assertExpectedFirebasePrincipal('owner@example.com')).toThrow(
      'is not the required demo tenant operator'
    );
  });

  it('rejects an unexpected ADC principal before creating a production Firebase context', async () => {
    vi.spyOn(
      GoogleAuth.prototype as unknown as {
        getCredentials: () => Promise<{ client_email?: string }>;
      },
      'getCredentials'
    ).mockResolvedValue({ client_email: 'owner@example.com' });

    await expect(
      createFirebaseAdminContext(PRODUCTION_FIREBASE_PROJECT_ID)
    ).rejects.toThrow('is not the required demo tenant operator');
  });
});
