import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

export async function confirmProductionOperation(
  projectId: string,
  operation: string,
  tenantId?: string
): Promise<void> {
  if (!stdin.isTTY || !stdout.isTTY) {
    throw new Error(
      'Interactive terminal confirmation is required for write operations.'
    );
  }

  console.log(`
Operation: ${operation}
Project:   ${projectId}
${tenantId === undefined ? '' : `Tenant:    ${tenantId}\n`}

This operation changes production Firebase data.`);

  const prompt = createInterface({ input: stdin, output: stdout });

  try {
    const answer = await prompt.question(
      `Type the project ID (${projectId}) to continue: `
    );

    if (answer.trim() !== projectId) {
      throw new Error(
        'Project confirmation did not match. No data was changed.'
      );
    }

    if (tenantId !== undefined) {
      const tenantAnswer = await prompt.question(
        `Type the tenant ID (${tenantId}) to continue: `
      );
      if (tenantAnswer.trim() !== tenantId) {
        throw new Error(
          'Tenant confirmation did not match. No data was changed.'
        );
      }
    }
  } finally {
    prompt.close();
  }
}
