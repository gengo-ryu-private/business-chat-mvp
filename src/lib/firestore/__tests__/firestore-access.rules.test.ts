import { readFileSync } from 'node:fs';

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const projectId = 'business-chat-mvp-e2e';

const tenantAlphaId = 'tenant-alpha';
const tenantBetaId = 'tenant-beta';

const adminAlphaUid = 'uid-admin-alpha';
const memberAlphaUid = 'uid-member-alpha';
const adminBetaUid = 'uid-admin-beta';

const channelAlphaId = 'channel-alpha-general';
const channelBetaId = 'channel-beta-general';

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId,
    firestore: {
      rules: readFileSync('firestore.rules', 'utf8'),
    },
  });
});

beforeEach(async () => {
  await testEnv.clearFirestore();
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();

    await db.doc(`tenants/${tenantAlphaId}`).set({
      id: tenantAlphaId,
      name: 'Alpha Company',
      createdBy: adminAlphaUid,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });

    await db.doc(`tenants/${tenantBetaId}`).set({
      id: tenantBetaId,
      name: 'Beta Company',
      createdBy: adminBetaUid,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });

    await db.doc(`tenantSecrets/${tenantAlphaId}`).set({
      tenantId: tenantAlphaId,
      joinCode: 'ALPHA23456',
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });

    await db.doc(`tenantSecrets/${tenantBetaId}`).set({
      tenantId: tenantBetaId,
      joinCode: 'BETA345678',
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });

    await db.doc(`users/${adminAlphaUid}`).set({
      id: adminAlphaUid,
      displayName: 'Alpha Admin',
      email: 'admin.alpha@example.com',
      tenantId: tenantAlphaId,
      role: 'admin',
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });

    await db.doc(`users/${memberAlphaUid}`).set({
      id: memberAlphaUid,
      displayName: 'Alpha Member',
      email: 'member.alpha@example.com',
      tenantId: tenantAlphaId,
      role: 'member',
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });

    await db.doc(`users/${adminBetaUid}`).set({
      id: adminBetaUid,
      displayName: 'Beta Admin',
      email: 'admin.beta@example.com',
      tenantId: tenantBetaId,
      role: 'admin',
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });

    await db.doc(`tenants/${tenantAlphaId}/channels/${channelAlphaId}`).set({
      id: channelAlphaId,
      tenantId: tenantAlphaId,
      name: 'alpha-general',
      description: 'Alpha tenant channel',
      createdBy: adminAlphaUid,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });

    await db.doc(`tenants/${tenantBetaId}/channels/${channelBetaId}`).set({
      id: channelBetaId,
      tenantId: tenantBetaId,
      name: 'beta-general',
      description: 'Beta tenant channel',
      createdBy: adminBetaUid,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

describe('firestore.rules access control', () => {
  it('未ログインユーザーは認証後データを読めない', async () => {
    const db = testEnv.unauthenticatedContext().firestore();

    await assertFails(db.doc(`users/${memberAlphaUid}`).get());
    await assertFails(db.doc(`tenants/${tenantAlphaId}`).get());
    await assertFails(
      db.doc(`tenants/${tenantAlphaId}/channels/${channelAlphaId}`).get()
    );
  });

  it('ユーザーは自分のユーザー情報だけ読める', async () => {
    const db = testEnv.authenticatedContext(memberAlphaUid).firestore();

    await assertSucceeds(db.doc(`users/${memberAlphaUid}`).get());
    await assertFails(db.doc(`users/${adminAlphaUid}`).get());
  });

  it('ユーザーは所属テナントのデータだけ読める', async () => {
    const db = testEnv.authenticatedContext(memberAlphaUid).firestore();

    await assertSucceeds(db.doc(`tenants/${tenantAlphaId}`).get());
    await assertSucceeds(
      db.doc(`tenants/${tenantAlphaId}/channels/${channelAlphaId}`).get()
    );
    await assertFails(db.doc(`tenants/${tenantBetaId}`).get());
    await assertFails(
      db.doc(`tenants/${tenantBetaId}/channels/${channelBetaId}`).get()
    );
  });

  it('管理者だけが所属テナントの参加コードを読める', async () => {
    const adminDb = testEnv.authenticatedContext(adminAlphaUid).firestore();
    const memberDb = testEnv.authenticatedContext(memberAlphaUid).firestore();

    await assertSucceeds(adminDb.doc(`tenantSecrets/${tenantAlphaId}`).get());
    await assertFails(adminDb.doc(`tenantSecrets/${tenantBetaId}`).get());
    await assertFails(memberDb.doc(`tenantSecrets/${tenantAlphaId}`).get());
  });

  it('所属テナント本体には参加コードが含まれない', async () => {
    const db = testEnv.authenticatedContext(memberAlphaUid).firestore();
    const snapshot = await assertSucceeds(
      db.doc(`tenants/${tenantAlphaId}`).get()
    );

    expect(snapshot.data()).not.toHaveProperty('joinCode');
  });

  it('管理者ユーザーは所属テナントにチャンネルを作成できる', async () => {
    const db = testEnv.authenticatedContext(adminAlphaUid).firestore();
    const channelId = 'channel-alpha-admin-created';

    await assertSucceeds(
      db.doc(`tenants/${tenantAlphaId}/channels/${channelId}`).set({
        id: channelId,
        tenantId: tenantAlphaId,
        name: 'admin-created',
        description: 'Created by Alpha Admin',
        createdBy: adminAlphaUid,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      })
    );
  });

  it('一般ユーザーはチャンネルを作成できない', async () => {
    const db = testEnv.authenticatedContext(memberAlphaUid).firestore();
    const channelId = 'channel-alpha-member-created';

    await assertFails(
      db.doc(`tenants/${tenantAlphaId}/channels/${channelId}`).set({
        id: channelId,
        tenantId: tenantAlphaId,
        name: 'member-created',
        description: 'Created by Alpha Member',
        createdBy: memberAlphaUid,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      })
    );
  });

  it('ユーザーは所属テナント内のチャンネルにメッセージを投稿できる', async () => {
    const db = testEnv.authenticatedContext(memberAlphaUid).firestore();
    const messageId = 'message-alpha-member';

    await assertSucceeds(
      db
        .doc(
          `tenants/${tenantAlphaId}/channels/${channelAlphaId}/messages/${messageId}`
        )
        .set({
          id: messageId,
          tenantId: tenantAlphaId,
          channelId: channelAlphaId,
          body: 'Hello from Alpha Member',
          senderId: memberAlphaUid,
          senderName: 'Alpha Member',
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        })
    );
  });

  it('ユーザーは他テナントのチャンネルにメッセージを投稿できない', async () => {
    const db = testEnv.authenticatedContext(memberAlphaUid).firestore();
    const messageId = 'message-alpha-to-beta';

    await assertFails(
      db
        .doc(
          `tenants/${tenantBetaId}/channels/${channelBetaId}/messages/${messageId}`
        )
        .set({
          id: messageId,
          tenantId: tenantBetaId,
          channelId: channelBetaId,
          body: 'Hello from Alpha Member to Beta',
          senderId: memberAlphaUid,
          senderName: 'Alpha Member',
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        })
    );
  });

  it('クライアントはユーザー情報を作成・更新・削除できない', async () => {
    const db = testEnv.authenticatedContext(memberAlphaUid).firestore();

    await assertFails(
      db.doc('users/uid-client-created').set({
        id: 'uid-client-created',
        displayName: 'Client Created',
        email: 'client.created@example.com',
        tenantId: tenantAlphaId,
        role: 'member',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      })
    );
    await assertFails(
      db.doc(`users/${memberAlphaUid}`).update({
        displayName: 'Updated By Client',
      })
    );
    await assertFails(db.doc(`users/${memberAlphaUid}`).delete());
  });

  it('クライアントはテナント情報を作成・更新・削除できない', async () => {
    const db = testEnv.authenticatedContext(adminAlphaUid).firestore();

    await assertFails(
      db.doc('tenants/tenant-client-created').set({
        id: 'tenant-client-created',
        name: 'Client Created Tenant',
        createdBy: adminAlphaUid,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      })
    );
    await assertFails(
      db.doc(`tenants/${tenantAlphaId}`).update({
        name: 'Updated By Client',
      })
    );
    await assertFails(db.doc(`tenants/${tenantAlphaId}`).delete());
    await assertFails(
      db
        .doc(`tenantSecrets/${tenantAlphaId}`)
        .update({ joinCode: 'CLNT234567' })
    );
  });
});
