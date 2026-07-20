export const PRODUCTION_FIREBASE_PROJECT_ID = 'business-chat-mvp-prod';

const EMULATOR_ENVIRONMENT_VARIABLES = [
  'FIREBASE_AUTH_EMULATOR_HOST',
  'FIRESTORE_EMULATOR_HOST',
] as const;

type CommonOptions = {
  projectId: string;
  showHelp: boolean;
  tenantId?: string;
};

export function parseCommonOptions(args: string[]): CommonOptions {
  let projectId: string | undefined;
  let showHelp = false;
  let tenantId: string | undefined;

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];

    if (argument === '--help') {
      showHelp = true;
      continue;
    }

    if (argument === '--project') {
      if (projectId !== undefined) {
        throw new Error('--project must be specified exactly once.');
      }

      const value = args[index + 1];
      if (value === undefined || value.startsWith('--')) {
        throw new Error('--project requires a Firebase project ID.');
      }

      projectId = value;
      index += 1;
      continue;
    }

    if (argument === '--tenant-id') {
      if (tenantId !== undefined) {
        throw new Error('--tenant-id must be specified exactly once.');
      }

      const value = args[index + 1];
      if (value === undefined || value.startsWith('--')) {
        throw new Error('--tenant-id requires a tenant ID.');
      }

      tenantId = value;
      index += 1;
      continue;
    }

    throw new Error(`Unknown option: ${argument}`);
  }

  if (showHelp) {
    return { projectId: projectId ?? '', showHelp, tenantId };
  }

  if (projectId === undefined) {
    throw new Error('--project is required.');
  }

  return { projectId, showHelp, tenantId };
}

export function requireTenantId(tenantId: string | undefined): string {
  if (tenantId === undefined) {
    throw new Error('--tenant-id is required for this command.');
  }

  if (!/^[A-Za-z0-9]{20}$/.test(tenantId)) {
    throw new Error(
      '--tenant-id must be a 20-character Firestore auto-generated ID.'
    );
  }

  return tenantId;
}

export function assertSupportedNodeVersion(
  version = process.versions.node
): void {
  const majorVersion = Number.parseInt(version.split('.')[0] ?? '', 10);

  if (majorVersion !== 22) {
    throw new Error(
      `Node.js 22 is required, but the current version is ${version}.`
    );
  }
}

export function assertSafeProductionTarget(projectId: string): void {
  if (projectId !== PRODUCTION_FIREBASE_PROJECT_ID) {
    throw new Error(
      `Refusing project ${projectId}. This CLI only operates on ${PRODUCTION_FIREBASE_PROJECT_ID}.`
    );
  }

  const activeEmulators = EMULATOR_ENVIRONMENT_VARIABLES.filter(
    (name) => process.env[name]
  );
  if (activeEmulators.length > 0) {
    throw new Error(
      `Refusing production operation while emulator variables are set: ${activeEmulators.join(', ')}.`
    );
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    throw new Error(
      'GOOGLE_APPLICATION_CREDENTIALS is set. Use keyless ADC service-account impersonation instead.'
    );
  }

  for (const name of ['GCLOUD_PROJECT', 'GOOGLE_CLOUD_PROJECT'] as const) {
    const ambientProjectId = process.env[name];
    if (ambientProjectId && ambientProjectId !== projectId) {
      throw new Error(
        `${name} targets ${ambientProjectId}, which conflicts with --project ${projectId}.`
      );
    }
  }
}
