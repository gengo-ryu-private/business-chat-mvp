import { Timestamp } from 'firebase-admin/firestore';

import { createFirebaseAdminContext } from './firebase-admin';
import { addDemoSeedToBatch, verifyDemoSeed } from './seed';

type ResetUser = {
  displayName: string;
  role: 'admin' | 'member';
  uid: string;
};

function readResetUser(
  document: FirebaseFirestore.QueryDocumentSnapshot
): ResetUser | null {
  const role = document.get('role');
  const displayName = document.get('displayName');

  if (
    (role !== 'admin' && role !== 'member') ||
    typeof displayName !== 'string' ||
    displayName.trim().length === 0
  ) {
    return null;
  }

  return { displayName, role, uid: document.id };
}

export async function resetDemoTenant(
  projectId: string,
  tenantId: string
): Promise<void> {
  const context = await createFirebaseAdminContext(projectId);

  try {
    const tenantRef = context.db.collection('tenants').doc(tenantId);
    const [tenant, tenantSecret, users] = await Promise.all([
      tenantRef.get(),
      context.db.collection('tenantSecrets').doc(tenantId).get(),
      context.db.collection('users').where('tenantId', '==', tenantId).get(),
    ]);

    if (!tenant.exists || tenant.get('id') !== tenantId) {
      throw new Error(`Tenant ${tenantId} does not exist or is inconsistent.`);
    }
    if (!tenantSecret.exists || tenantSecret.get('tenantId') !== tenantId) {
      throw new Error(
        `Tenant secret for ${tenantId} is missing or inconsistent.`
      );
    }
    if (users.size !== 2) {
      throw new Error(
        `Expected exactly 2 tenant users, but found ${users.size}. No demo data was deleted.`
      );
    }

    const parsedUsers = users.docs.map(readResetUser);
    if (parsedUsers.some((user) => user === null)) {
      throw new Error('Tenant user data is invalid. No demo data was deleted.');
    }

    const validUsers = parsedUsers as ResetUser[];
    const admins = validUsers.filter((user) => user.role === 'admin');
    const members = validUsers.filter((user) => user.role === 'member');
    if (
      admins.length !== 1 ||
      members.length !== 1 ||
      tenant.get('createdBy') !== admins[0].uid
    ) {
      throw new Error(
        'Expected one original admin and one member. No demo data was deleted.'
      );
    }

    await Promise.all([
      context.auth.getUser(admins[0].uid),
      context.auth.getUser(members[0].uid),
    ]);

    const channelsRef = tenantRef.collection('channels');
    const channels = await channelsRef.get();
    for (const channel of channels.docs) {
      await context.db.recursiveDelete(channel.ref);
    }

    const remainingChannels = await channelsRef.limit(1).get();
    if (!remainingChannels.empty) {
      throw new Error(
        'Some channels remain after deletion. Re-run reset after stopping demo access.'
      );
    }

    const timestamp = Timestamp.now();
    const batch = context.db.batch();
    addDemoSeedToBatch(batch, {
      admin: admins[0],
      db: context.db,
      member: members[0],
      tenantId,
      timestamp,
    });
    await batch.commit();
    await verifyDemoSeed({
      adminUid: admins[0].uid,
      db: context.db,
      memberUid: members[0].uid,
      tenantId,
    });
  } finally {
    await context.close();
  }
}
