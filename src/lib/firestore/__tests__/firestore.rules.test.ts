import { readFileSync } from 'node:fs';

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';

const projectId = 'business-chat-mvp-e2e';
const tenantId = 'tenant-1';
const adminUserId = 'admin-user';
const memberUserId = 'member-user';
const channelId = 'channel-1';

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

    await db.doc(`tenants/${tenantId}`).set({
      id: tenantId,
      name: 'テストテナント',
      createdBy: adminUserId,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });

    await db.doc(`users/${adminUserId}`).set({
      id: adminUserId,
      displayName: '管理者ユーザー',
      email: 'admin@example.com',
      tenantId,
      role: 'admin',
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });

    await db.doc(`users/${memberUserId}`).set({
      id: memberUserId,
      displayName: '一般ユーザー',
      email: 'member@example.com',
      tenantId,
      role: 'member',
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });

    await db.doc(`tenants/${tenantId}/channels/${channelId}`).set({
      id: channelId,
      tenantId,
      name: 'general',
      description: '全体連絡',
      createdBy: adminUserId,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

describe('firestore.rules validation constraints', () => {
  it('チャンネル名が最大文字数ちょうどなら作成できる', async () => {
    const db = testEnv.authenticatedContext(adminUserId).firestore();

    await assertSucceeds(
      db.doc(`tenants/${tenantId}/channels/channel-name-max`).set({
        id: 'channel-name-max',
        tenantId,
        name: 'a'.repeat(50),
        createdBy: adminUserId,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      })
    );
  });

  it('チャンネル名が最大文字数を超えると作成できない', async () => {
    const db = testEnv.authenticatedContext(adminUserId).firestore();

    await assertFails(
      db.doc(`tenants/${tenantId}/channels/channel-name-too-long`).set({
        id: 'channel-name-too-long',
        tenantId,
        name: 'a'.repeat(51),
        createdBy: adminUserId,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      })
    );
  });

  it('チャンネル説明が最大文字数ちょうどなら作成できる', async () => {
    const db = testEnv.authenticatedContext(adminUserId).firestore();

    await assertSucceeds(
      db.doc(`tenants/${tenantId}/channels/description-max`).set({
        id: 'description-max',
        tenantId,
        name: 'random',
        description: 'a'.repeat(200),
        createdBy: adminUserId,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      })
    );
  });

  it('チャンネル説明が最大文字数を超えると作成できない', async () => {
    const db = testEnv.authenticatedContext(adminUserId).firestore();

    await assertFails(
      db.doc(`tenants/${tenantId}/channels/description-too-long`).set({
        id: 'description-too-long',
        tenantId,
        name: 'random',
        description: 'a'.repeat(201),
        createdBy: adminUserId,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      })
    );
  });

  it('メッセージ本文が最大文字数ちょうどなら投稿できる', async () => {
    const db = testEnv.authenticatedContext(memberUserId).firestore();

    await assertSucceeds(
      db
        .doc(
          `tenants/${tenantId}/channels/${channelId}/messages/message-body-max`
        )
        .set({
          id: 'message-body-max',
          tenantId,
          channelId,
          body: 'a'.repeat(1000),
          senderId: memberUserId,
          senderName: '一般ユーザー',
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        })
    );
  });

  it('メッセージ本文が最大文字数を超えると投稿できない', async () => {
    const db = testEnv.authenticatedContext(memberUserId).firestore();

    await assertFails(
      db
        .doc(
          `tenants/${tenantId}/channels/${channelId}/messages/message-body-too-long`
        )
        .set({
          id: 'message-body-too-long',
          tenantId,
          channelId,
          body: 'a'.repeat(1001),
          senderId: memberUserId,
          senderName: '一般ユーザー',
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        })
    );
  });
});
