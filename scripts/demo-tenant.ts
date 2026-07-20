import { checkFirebaseAccess } from './demo-tenant/firebase-admin';
import { confirmProductionOperation } from './demo-tenant/confirmation';
import { deprovisionDemoTenant } from './demo-tenant/deprovision';
import { provisionDemoTenant } from './demo-tenant/provision';
import { resetDemoTenant } from './demo-tenant/reset';
import {
  assertSafeProductionTarget,
  assertSupportedNodeVersion,
  parseCommonOptions,
  requireTenantId,
} from './demo-tenant/safety';

type DemoTenantCommand = 'check' | 'provision' | 'reset' | 'deprovision';

const COMMANDS = new Set<DemoTenantCommand>([
  'check',
  'provision',
  'reset',
  'deprovision',
]);

function isDemoTenantCommand(
  value: string | undefined
): value is DemoTenantCommand {
  return value !== undefined && COMMANDS.has(value as DemoTenantCommand);
}

function printUsage(selectedCommand?: DemoTenantCommand): void {
  const commandName = selectedCommand ?? '<check|provision|reset|deprovision>';

  console.log(`Usage:
  npm run demo:${commandName} -- --project <firebase-project-id> [options]

Commands:
  check         Verify keyless ADC access without changing data
  provision     Create a tenant and its demo accounts
  reset         Reset demo data for an existing tenant
  deprovision   Delete a tenant and its demo accounts

Common options:
  --project <id>    Firebase project ID (required)
  --tenant-id <id>  Tenant ID (required for reset and deprovision)
  --help            Show this help`);
}

async function main(): Promise<void> {
  const command = process.argv[2];

  if (!isDemoTenantCommand(command)) {
    throw new Error(`Unknown or missing command: ${command ?? '(missing)'}`);
  }

  assertSupportedNodeVersion();
  const options = parseCommonOptions(process.argv.slice(3));

  if (options.showHelp) {
    printUsage(command);
    return;
  }

  assertSafeProductionTarget(options.projectId);

  if (command === 'check') {
    if (options.tenantId !== undefined) {
      throw new Error('--tenant-id is not valid for the check command.');
    }
    await checkFirebaseAccess(options.projectId);
    console.log(
      `ADC access verified for ${options.projectId}. No data was changed.`
    );
    return;
  }

  if (command === 'provision') {
    if (options.tenantId !== undefined) {
      throw new Error('--tenant-id is not valid for the provision command.');
    }
    await confirmProductionOperation(options.projectId, command);
    const result = await provisionDemoTenant(options.projectId);

    console.log(`
Provisioning completed. Store these credentials in the approved password manager now.
They are not written to a file and will not be shown again.

Tenant ID:      ${result.tenantId}
Join code:      ${result.joinCode}

Admin email:    ${result.admin.email}
Admin password: ${result.admin.password}
Admin UID:      ${result.admin.uid}

Member email:    ${result.member.email}
Member password: ${result.member.password}
Member UID:      ${result.member.uid}`);
    return;
  }

  if (command === 'reset') {
    const tenantId = requireTenantId(options.tenantId);
    await confirmProductionOperation(options.projectId, command, tenantId);
    await resetDemoTenant(options.projectId, tenantId);
    console.log(
      `Demo data reset completed for tenant ${tenantId}. Authentication users and credentials were not changed.`
    );
    return;
  }

  if (command === 'deprovision') {
    const tenantId = requireTenantId(options.tenantId);
    await confirmProductionOperation(options.projectId, command, tenantId);
    const result = await deprovisionDemoTenant(options.projectId, tenantId);

    if (!result.authenticationReverified) {
      console.log(
        `No Firestore data remains for tenant ${tenantId}. No complete stored UID mapping was available, so Authentication could not be fully reverified.`
      );
    } else if (result.alreadyDeleted) {
      console.log(
        `No tenant data remains for ${tenantId}. ${result.deletedUserCount} stored Authentication UID(s) were reverified as deleted.`
      );
    } else {
      console.log(
        `Tenant ${tenantId} and ${result.deletedUserCount} Authentication user(s) were deleted and verified.`
      );
    }
    return;
  }

  throw new Error(`Unsupported command: ${command}`);
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Error: ${message}`);
  process.exitCode = 1;
});
