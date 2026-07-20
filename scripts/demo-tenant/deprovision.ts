import type { Auth } from 'firebase-admin/auth';
import { Timestamp } from 'firebase-admin/firestore';

import { createFirebaseAdminContext } from './firebase-admin';

const FINAL_BATCH_USER_LIMIT = 498;
const INTERMEDIATE_BATCH_SIZE = 400;
const DEPROVISION_STATES_COLLECTION = 'demoTenantDeprovisions';

export type DeprovisionDemoTenantResult = {
  alreadyDeleted: boolean;
  authenticationReverified: boolean;
  deletedUserCount: number;
};

type DeprovisionState = {
  authenticationVerifiable: boolean;
  authUids: string[];
};

function hasErrorCode(error: unknown, code: string): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === code
  );
}

async function assertAuthUserDeleted(auth: Auth, uid: string): Promise<void> {
  try {
    await auth.getUser(uid);
  } catch (error: unknown) {
    if (hasErrorCode(error, 'auth/user-not-found')) {
      return;
    }
    throw error;
  }

  throw new Error(`Authentication user ${uid} still exists after deletion.`);
}

function readDeprovisionState(
  snapshot: FirebaseFirestore.DocumentSnapshot,
  tenantId: string
): DeprovisionState | null {
  if (!snapshot.exists) {
    return null;
  }

  const storedTenantId = snapshot.get('tenantId');
  const authUids = snapshot.get('authUids');
  const authenticationVerifiable = snapshot.get('authenticationVerifiable');
  const status = snapshot.get('status');

  if (
    storedTenantId !== tenantId ||
    !Array.isArray(authUids) ||
    authUids.some((uid) => typeof uid !== 'string' || uid.length === 0) ||
    new Set(authUids).size !== authUids.length ||
    typeof authenticationVerifiable !== 'boolean' ||
    (authenticationVerifiable && authUids.length === 0) ||
    (status !== 'deprovisioning' && status !== 'completed')
  ) {
    throw new Error(
      `Deprovision recovery state for ${tenantId} is inconsistent. Nothing was deleted.`
    );
  }

  return { authenticationVerifiable, authUids };
}

async function saveDeprovisionState(input: {
  authenticationVerifiable: boolean;
  authUids: string[];
  ref: FirebaseFirestore.DocumentReference;
  status: 'deprovisioning' | 'completed';
  tenantId: string;
}): Promise<void> {
  const timestamp = Timestamp.now();
  const data: Record<string, unknown> = {
    authenticationVerifiable: input.authenticationVerifiable,
    authUids: input.authUids,
    status: input.status,
    tenantId: input.tenantId,
    updatedAt: timestamp,
  };

  if (input.status === 'deprovisioning') {
    data.startedAt = timestamp;
  } else {
    data.completedAt = timestamp;
  }

  await input.ref.set(data, { merge: true });
}

export async function deprovisionDemoTenant(
  projectId: string,
  tenantId: string
): Promise<DeprovisionDemoTenantResult> {
  const context = await createFirebaseAdminContext(projectId);

  try {
    const tenantRef = context.db.collection('tenants').doc(tenantId);
    const tenantSecretRef = context.db
      .collection('tenantSecrets')
      .doc(tenantId);
    const usersQuery = context.db
      .collection('users')
      .where('tenantId', '==', tenantId);
    const deprovisionStateRef = context.db
      .collection(DEPROVISION_STATES_COLLECTION)
      .doc(tenantId);

    const [tenant, tenantSecret, users, subcollections, stateSnapshot] =
      await Promise.all([
        tenantRef.get(),
        tenantSecretRef.get(),
        usersQuery.get(),
        tenantRef.listCollections(),
        deprovisionStateRef.get(),
      ]);
    const storedState = readDeprovisionState(stateSnapshot, tenantId);

    if (
      !tenant.exists &&
      !tenantSecret.exists &&
      users.empty &&
      subcollections.length === 0
    ) {
      if (storedState === null) {
        return {
          alreadyDeleted: true,
          authenticationReverified: false,
          deletedUserCount: 0,
        };
      }

      await Promise.all(
        storedState.authUids.map((uid) =>
          assertAuthUserDeleted(context.auth, uid)
        )
      );
      await saveDeprovisionState({
        ...storedState,
        ref: deprovisionStateRef,
        status: 'completed',
        tenantId,
      });
      return {
        alreadyDeleted: true,
        authenticationReverified: storedState.authenticationVerifiable,
        deletedUserCount: storedState.authUids.length,
      };
    }

    if (tenant.exists && tenant.get('id') !== tenantId) {
      throw new Error(
        `Tenant document ${tenantId} has an inconsistent id field. Nothing was deleted.`
      );
    }
    if (tenantSecret.exists && tenantSecret.get('tenantId') !== tenantId) {
      throw new Error(
        `Tenant secret ${tenantId} is inconsistent. Nothing was deleted.`
      );
    }
    const isRecoverableLegacyOrphan =
      storedState === null &&
      !tenant.exists &&
      !tenantSecret.exists &&
      users.empty &&
      subcollections.length > 0;
    if (users.empty && storedState === null && !isRecoverableLegacyOrphan) {
      throw new Error(
        `No Firestore users reference tenant ${tenantId}. Authentication UIDs cannot be verified, so nothing was deleted.`
      );
    }
    if (users.docs.some((user) => user.get('tenantId') !== tenantId)) {
      throw new Error(
        'Tenant user mapping is inconsistent. Nothing was deleted.'
      );
    }

    const currentUserUids = users.docs.map((user) => user.id);
    const authUids = [
      ...new Set([...(storedState?.authUids ?? []), ...currentUserUids]),
    ].sort();
    const authenticationVerifiable =
      storedState?.authenticationVerifiable ?? !isRecoverableLegacyOrphan;
    await saveDeprovisionState({
      authenticationVerifiable,
      authUids,
      ref: deprovisionStateRef,
      status: 'deprovisioning',
      tenantId,
    });

    for (const collection of subcollections) {
      await context.db.recursiveDelete(collection);
    }

    const remainingSubcollections = await tenantRef.listCollections();
    if (remainingSubcollections.length > 0) {
      throw new Error(
        'Some tenant subcollections remain. Authentication users were not deleted.'
      );
    }

    for (const uid of authUids) {
      try {
        await context.auth.deleteUser(uid);
      } catch (error: unknown) {
        if (!hasErrorCode(error, 'auth/user-not-found')) {
          throw error;
        }
      }
    }
    await Promise.all(
      authUids.map((uid) => assertAuthUserDeleted(context.auth, uid))
    );

    const remainingUserRefs = users.docs.map((user) => user.ref);
    while (remainingUserRefs.length > FINAL_BATCH_USER_LIMIT) {
      const userRefs = remainingUserRefs.splice(0, INTERMEDIATE_BATCH_SIZE);
      const batch = context.db.batch();
      userRefs.forEach((userRef) => batch.delete(userRef));
      await batch.commit();
    }

    const finalBatch = context.db.batch();
    remainingUserRefs.forEach((userRef) => finalBatch.delete(userRef));
    finalBatch.delete(tenantSecretRef);
    finalBatch.delete(tenantRef);
    await finalBatch.commit();

    const [
      remainingTenant,
      remainingTenantSecret,
      remainingUsers,
      collections,
    ] = await Promise.all([
      tenantRef.get(),
      tenantSecretRef.get(),
      usersQuery.get(),
      tenantRef.listCollections(),
    ]);

    if (
      remainingTenant.exists ||
      remainingTenantSecret.exists ||
      !remainingUsers.empty ||
      collections.length > 0
    ) {
      throw new Error(
        `Deletion verification failed for tenant ${tenantId}. Re-run deprovision.`
      );
    }

    await saveDeprovisionState({
      authenticationVerifiable,
      authUids,
      ref: deprovisionStateRef,
      status: 'completed',
      tenantId,
    });

    return {
      alreadyDeleted: false,
      authenticationReverified: authenticationVerifiable,
      deletedUserCount: authUids.length,
    };
  } finally {
    await context.close();
  }
}
