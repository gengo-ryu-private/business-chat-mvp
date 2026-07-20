import {
  applicationDefault,
  deleteApp,
  initializeApp,
} from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { GoogleAuth } from 'google-auth-library';
import { randomUUID } from 'node:crypto';

const AUTH_PERMISSION_CHECK_UID = 'demo-cli-permission-check-nonexistent';
const DEMO_TENANT_EMULATOR_PROJECT_ID = 'business-chat-mvp-e2e';

export const DEMO_TENANT_OPERATOR_EMAIL =
  'demo-tenant-operator@business-chat-mvp-prod.iam.gserviceaccount.com';

export type FirebaseAdminContext = {
  auth: Auth;
  close: () => Promise<void>;
  db: Firestore;
};

function hasErrorCode(error: unknown, code: string): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === code
  );
}

export async function checkFirebaseAccess(projectId: string): Promise<void> {
  const context = await createFirebaseAdminContext(projectId);

  try {
    await context.db.doc('demoCliChecks/connection').get();

    try {
      await context.auth.getUser(AUTH_PERMISSION_CHECK_UID);
    } catch (error: unknown) {
      if (!hasErrorCode(error, 'auth/user-not-found')) {
        throw error;
      }
    }
  } finally {
    await context.close();
  }
}

export function assertExpectedFirebasePrincipal(
  serviceAccountEmail: string
): void {
  if (serviceAccountEmail !== DEMO_TENANT_OPERATOR_EMAIL) {
    throw new Error(
      `ADC principal ${serviceAccountEmail || '(unknown)'} is not the required demo tenant operator ${DEMO_TENANT_OPERATOR_EMAIL}.`
    );
  }
}

function usesDemoTenantEmulators(projectId: string): boolean {
  return (
    projectId === DEMO_TENANT_EMULATOR_PROJECT_ID &&
    Boolean(process.env.FIREBASE_AUTH_EMULATOR_HOST) &&
    Boolean(process.env.FIRESTORE_EMULATOR_HOST)
  );
}

async function assertExpectedAdcPrincipal(): Promise<void> {
  let serviceAccountEmail: string | undefined;
  try {
    const credentials = await new GoogleAuth().getCredentials();
    serviceAccountEmail = credentials.client_email;
  } catch (error: unknown) {
    throw new Error(
      'The ADC principal could not be identified. Use keyless ADC service-account impersonation.',
      { cause: error }
    );
  }

  assertExpectedFirebasePrincipal(serviceAccountEmail ?? '');
}

export async function createFirebaseAdminContext(
  projectId: string
): Promise<FirebaseAdminContext> {
  if (!usesDemoTenantEmulators(projectId)) {
    await assertExpectedAdcPrincipal();
  }

  const credential = applicationDefault();
  const app = initializeApp(
    { credential, projectId },
    `demo-tenant-cli-${randomUUID()}`
  );

  return {
    auth: getAuth(app),
    close: () => deleteApp(app),
    db: getFirestore(app),
  };
}
