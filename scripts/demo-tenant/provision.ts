import { randomBytes } from 'node:crypto';

import { Timestamp, type DocumentReference } from 'firebase-admin/firestore';

import {
  buildAdminUserData,
  buildMemberUserData,
  buildSignupTenantData,
  buildSignupTenantSecretData,
} from '../../src/lib/server/signup-data';
import { generateJoinCode } from '../../src/utils/join-code';
import { createFirebaseAdminContext } from './firebase-admin';
import { addDemoSeedToBatch, verifyDemoSeed } from './seed';

const DEMO_TENANT_NAME = 'サンプル開発チーム';
const ADMIN_DISPLAY_NAME = 'デモ管理者';
const MEMBER_DISPLAY_NAME = 'デモメンバー';

type DemoCredential = {
  email: string;
  password: string;
  uid: string;
};

export type ProvisionDemoTenantResult = {
  admin: DemoCredential;
  joinCode: string;
  member: DemoCredential;
  tenantId: string;
};

type ProvisionReferences = {
  tenant: DocumentReference;
  tenantSecret: DocumentReference;
  users: DocumentReference[];
};

function generatePassword(): string {
  return `Demo-${randomBytes(18).toString('base64url')}`;
}

function generateCredentialEmails(): { admin: string; member: string } {
  const suffix = randomBytes(8).toString('hex');
  return {
    admin: `admin.${suffix}@example.com`,
    member: `member.${suffix}@example.com`,
  };
}

async function generateUniqueJoinCode(
  tenantSecrets: FirebaseFirestore.CollectionReference
): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const joinCode = generateJoinCode();
    const existing = await tenantSecrets
      .where('joinCode', '==', joinCode)
      .limit(1)
      .get();

    if (existing.empty) {
      return joinCode;
    }
  }

  throw new Error('Could not generate a unique tenant join code.');
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function provisionDemoTenant(
  projectId: string
): Promise<ProvisionDemoTenantResult> {
  const context = await createFirebaseAdminContext(projectId);
  const emails = generateCredentialEmails();
  const adminPassword = generatePassword();
  const memberPassword = generatePassword();
  const createdAuthUids: string[] = [];
  let references: ProvisionReferences | undefined;

  try {
    const tenantRef = context.db.collection('tenants').doc();
    const tenantSecretRef = context.db
      .collection('tenantSecrets')
      .doc(tenantRef.id);
    const joinCode = await generateUniqueJoinCode(
      context.db.collection('tenantSecrets')
    );

    const admin = await context.auth.createUser({
      displayName: ADMIN_DISPLAY_NAME,
      email: emails.admin,
      emailVerified: true,
      password: adminPassword,
    });
    createdAuthUids.push(admin.uid);

    const member = await context.auth.createUser({
      displayName: MEMBER_DISPLAY_NAME,
      email: emails.member,
      emailVerified: true,
      password: memberPassword,
    });
    createdAuthUids.push(member.uid);

    const adminUserRef = context.db.collection('users').doc(admin.uid);
    const memberUserRef = context.db.collection('users').doc(member.uid);
    references = {
      tenant: tenantRef,
      tenantSecret: tenantSecretRef,
      users: [adminUserRef, memberUserRef],
    };

    const timestamp = Timestamp.now();
    const batch = context.db.batch();
    batch.create(
      tenantRef,
      buildSignupTenantData({
        createdBy: admin.uid,
        tenantId: tenantRef.id,
        tenantName: DEMO_TENANT_NAME,
        timestamp,
      })
    );
    batch.create(
      tenantSecretRef,
      buildSignupTenantSecretData({
        joinCode,
        tenantId: tenantRef.id,
        timestamp,
      })
    );
    batch.create(
      adminUserRef,
      buildAdminUserData({
        displayName: ADMIN_DISPLAY_NAME,
        email: emails.admin,
        tenantId: tenantRef.id,
        timestamp,
        userId: admin.uid,
      })
    );
    batch.create(
      memberUserRef,
      buildMemberUserData({
        displayName: MEMBER_DISPLAY_NAME,
        email: emails.member,
        tenantId: tenantRef.id,
        timestamp,
        userId: member.uid,
      })
    );
    addDemoSeedToBatch(batch, {
      admin: { displayName: ADMIN_DISPLAY_NAME, uid: admin.uid },
      db: context.db,
      member: { displayName: MEMBER_DISPLAY_NAME, uid: member.uid },
      tenantId: tenantRef.id,
      timestamp,
    });
    await batch.commit();

    const [tenant, tenantSecret, adminUser, memberUser, authAdmin, authMember] =
      await Promise.all([
        tenantRef.get(),
        tenantSecretRef.get(),
        adminUserRef.get(),
        memberUserRef.get(),
        context.auth.getUser(admin.uid),
        context.auth.getUser(member.uid),
        verifyDemoSeed({
          adminUid: admin.uid,
          db: context.db,
          memberUid: member.uid,
          tenantId: tenantRef.id,
        }),
      ]);

    if (
      !tenant.exists ||
      tenant.get('id') !== tenantRef.id ||
      tenant.get('createdBy') !== admin.uid ||
      !tenantSecret.exists ||
      tenantSecret.get('joinCode') !== joinCode ||
      !adminUser.exists ||
      adminUser.get('tenantId') !== tenantRef.id ||
      adminUser.get('role') !== 'admin' ||
      !memberUser.exists ||
      memberUser.get('tenantId') !== tenantRef.id ||
      memberUser.get('role') !== 'member' ||
      authAdmin.email !== emails.admin ||
      authMember.email !== emails.member
    ) {
      throw new Error('Provisioned data verification failed.');
    }

    return {
      admin: { email: emails.admin, password: adminPassword, uid: admin.uid },
      joinCode,
      member: {
        email: emails.member,
        password: memberPassword,
        uid: member.uid,
      },
      tenantId: tenantRef.id,
    };
  } catch (error: unknown) {
    const cleanupErrors: string[] = [];

    if (references) {
      try {
        const batch = context.db.batch();
        batch.delete(
          references.tenant
            .collection('channels')
            .doc('announcements')
            .collection('messages')
            .doc('welcome')
        );
        batch.delete(
          references.tenant
            .collection('channels')
            .doc('announcements')
            .collection('messages')
            .doc('acknowledged')
        );
        batch.delete(
          references.tenant
            .collection('channels')
            .doc('general')
            .collection('messages')
            .doc('greeting')
        );
        batch.delete(
          references.tenant
            .collection('channels')
            .doc('general')
            .collection('messages')
            .doc('reply')
        );
        batch.delete(
          references.tenant.collection('channels').doc('announcements')
        );
        batch.delete(references.tenant.collection('channels').doc('general'));
        references.users.forEach((user) => batch.delete(user));
        batch.delete(references.tenantSecret);
        batch.delete(references.tenant);
        await batch.commit();
      } catch (cleanupError: unknown) {
        cleanupErrors.push(`Firestore: ${getErrorMessage(cleanupError)}`);
      }
    }

    const authCleanupResults = await Promise.allSettled(
      createdAuthUids.map((uid) => context.auth.deleteUser(uid))
    );
    authCleanupResults.forEach((result, index) => {
      if (result.status === 'rejected') {
        cleanupErrors.push(
          `Authentication UID ${createdAuthUids[index]}: ${getErrorMessage(result.reason)}`
        );
      }
    });

    const cleanupMessage =
      cleanupErrors.length === 0
        ? 'Rollback completed.'
        : `Rollback needs manual attention: ${cleanupErrors.join('; ')}`;
    throw new Error(`${getErrorMessage(error)} ${cleanupMessage}`, {
      cause: error,
    });
  } finally {
    await context.close();
  }
}
