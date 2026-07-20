import { Timestamp } from 'firebase-admin/firestore';
import { describe, expect, it } from 'vitest';

import { deprovisionDemoTenant } from '../deprovision';
import { createFirebaseAdminContext } from '../firebase-admin';
import { provisionDemoTenant } from '../provision';
import { resetDemoTenant } from '../reset';
import { verifyDemoSeed } from '../seed';

const EMULATOR_PROJECT_ID = 'business-chat-mvp-e2e';

describe('demo tenant CLI lifecycle with Firebase emulators', () => {
  it('provisions, resets, and deprovisions an isolated tenant', async () => {
    expect(process.env.FIREBASE_AUTH_EMULATOR_HOST).toBeTruthy();
    expect(process.env.FIRESTORE_EMULATOR_HOST).toBeTruthy();

    const provisioned = await provisionDemoTenant(EMULATOR_PROJECT_ID);
    const beforeReset = await createFirebaseAdminContext(EMULATOR_PROJECT_ID);

    try {
      expect(
        await beforeReset.auth.getUser(provisioned.admin.uid)
      ).toMatchObject({ email: provisioned.admin.email });
      expect(
        await beforeReset.auth.getUser(provisioned.member.uid)
      ).toMatchObject({ email: provisioned.member.email });
      expect(
        (
          await beforeReset.db
            .collection('tenants')
            .doc(provisioned.tenantId)
            .get()
        ).exists
      ).toBe(true);

      await verifyDemoSeed({
        adminUid: provisioned.admin.uid,
        db: beforeReset.db,
        memberUid: provisioned.member.uid,
        tenantId: provisioned.tenantId,
      });

      const customChannel = beforeReset.db
        .collection('tenants')
        .doc(provisioned.tenantId)
        .collection('channels')
        .doc('temporary');
      await customChannel.set({
        createdAt: Timestamp.now(),
        createdBy: provisioned.admin.uid,
        id: customChannel.id,
        name: '一時チャンネル',
        tenantId: provisioned.tenantId,
        updatedAt: Timestamp.now(),
      });
      await customChannel.collection('messages').doc('temporary').set({
        body: 'リセットで削除される架空のメッセージです。',
        channelId: customChannel.id,
        createdAt: Timestamp.now(),
        id: 'temporary',
        senderId: provisioned.admin.uid,
        senderName: 'デモ管理者',
        tenantId: provisioned.tenantId,
      });
    } finally {
      await beforeReset.close();
    }

    await resetDemoTenant(EMULATOR_PROJECT_ID, provisioned.tenantId);

    const afterReset = await createFirebaseAdminContext(EMULATOR_PROJECT_ID);
    try {
      expect(
        (
          await afterReset.db
            .collection('tenants')
            .doc(provisioned.tenantId)
            .collection('channels')
            .doc('temporary')
            .get()
        ).exists
      ).toBe(false);
      await verifyDemoSeed({
        adminUid: provisioned.admin.uid,
        db: afterReset.db,
        memberUid: provisioned.member.uid,
        tenantId: provisioned.tenantId,
      });
      await expect(
        afterReset.auth.getUser(provisioned.admin.uid)
      ).resolves.toBeTruthy();
      await expect(
        afterReset.auth.getUser(provisioned.member.uid)
      ).resolves.toBeTruthy();
    } finally {
      await afterReset.close();
    }

    await expect(
      deprovisionDemoTenant(EMULATOR_PROJECT_ID, provisioned.tenantId)
    ).resolves.toEqual({
      alreadyDeleted: false,
      authenticationReverified: true,
      deletedUserCount: 2,
    });

    const afterDelete = await createFirebaseAdminContext(EMULATOR_PROJECT_ID);
    try {
      await expect(
        afterDelete.auth.getUser(provisioned.admin.uid)
      ).rejects.toMatchObject({ code: 'auth/user-not-found' });
      await expect(
        afterDelete.auth.getUser(provisioned.member.uid)
      ).rejects.toMatchObject({ code: 'auth/user-not-found' });
      await expect(
        afterDelete.db.collection('tenants').doc(provisioned.tenantId).get()
      ).resolves.toMatchObject({ exists: false });
    } finally {
      await afterDelete.close();
    }

    await expect(
      deprovisionDemoTenant(EMULATOR_PROJECT_ID, provisioned.tenantId)
    ).resolves.toEqual({
      alreadyDeleted: true,
      authenticationReverified: true,
      deletedUserCount: 2,
    });
  });

  it('recovers when user mappings are gone but a saved UID mapping and tenant data remain', async () => {
    const provisioned = await provisionDemoTenant(EMULATOR_PROJECT_ID);
    const interrupted = await createFirebaseAdminContext(EMULATOR_PROJECT_ID);

    try {
      const timestamp = Timestamp.now();
      await interrupted.db
        .collection('demoTenantDeprovisions')
        .doc(provisioned.tenantId)
        .set({
          authenticationVerifiable: true,
          authUids: [provisioned.admin.uid, provisioned.member.uid].sort(),
          startedAt: timestamp,
          status: 'deprovisioning',
          tenantId: provisioned.tenantId,
          updatedAt: timestamp,
        });

      await Promise.all([
        interrupted.auth.deleteUser(provisioned.admin.uid),
        interrupted.auth.deleteUser(provisioned.member.uid),
      ]);

      const batch = interrupted.db.batch();
      batch.delete(
        interrupted.db.collection('users').doc(provisioned.admin.uid)
      );
      batch.delete(
        interrupted.db.collection('users').doc(provisioned.member.uid)
      );
      batch.delete(
        interrupted.db.collection('tenantSecrets').doc(provisioned.tenantId)
      );
      batch.delete(
        interrupted.db.collection('tenants').doc(provisioned.tenantId)
      );
      await batch.commit();
    } finally {
      await interrupted.close();
    }

    await expect(
      deprovisionDemoTenant(EMULATOR_PROJECT_ID, provisioned.tenantId)
    ).resolves.toEqual({
      alreadyDeleted: false,
      authenticationReverified: true,
      deletedUserCount: 2,
    });

    const recovered = await createFirebaseAdminContext(EMULATOR_PROJECT_ID);
    try {
      await expect(
        recovered.db
          .collection('tenants')
          .doc(provisioned.tenantId)
          .listCollections()
      ).resolves.toHaveLength(0);
      await expect(
        recovered.db
          .collection('demoTenantDeprovisions')
          .doc(provisioned.tenantId)
          .get()
      ).resolves.toMatchObject({ exists: true });
      expect(
        (
          await recovered.db
            .collection('demoTenantDeprovisions')
            .doc(provisioned.tenantId)
            .get()
        ).get('status')
      ).toBe('completed');
    } finally {
      await recovered.close();
    }
  });

  it('cleans up a legacy orphaned subcollection without claiming Auth verification', async () => {
    const tenantId = 'legacyorphan12345678';
    const setup = await createFirebaseAdminContext(EMULATOR_PROJECT_ID);

    try {
      await setup.db
        .collection('tenants')
        .doc(tenantId)
        .collection('channels')
        .doc('orphaned')
        .set({ id: 'orphaned', tenantId });
    } finally {
      await setup.close();
    }

    await expect(
      deprovisionDemoTenant(EMULATOR_PROJECT_ID, tenantId)
    ).resolves.toEqual({
      alreadyDeleted: false,
      authenticationReverified: false,
      deletedUserCount: 0,
    });

    const verified = await createFirebaseAdminContext(EMULATOR_PROJECT_ID);
    try {
      await expect(
        verified.db.collection('tenants').doc(tenantId).listCollections()
      ).resolves.toHaveLength(0);
    } finally {
      await verified.close();
    }
  });
});
